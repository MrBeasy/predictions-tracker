from flask import Flask, render_template, request, redirect, url_for, flash, session
from datetime import timedelta
import os

from config import load_config
from firebase_client import FirebaseClient
from models import PredictionService
import auth
import utils

app = Flask(__name__)

config = load_config()
app.config['SECRET_KEY'] = config.secret_key
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

firebase_client = FirebaseClient(
    credentials_path=config.firebase_credentials_path
)

prediction_service = PredictionService(firebase_client)


@app.context_processor
def inject_user():
    return {
        'current_user': auth.get_current_user(),
        'current_display_name': auth.get_current_display_name(),
        'is_admin': auth.is_admin(auth.get_current_user() or '', config.admin_usernames),
        'current_year': config.current_year
    }


@app.route('/')
def index():
    if auth.is_authenticated():
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        display_name = request.form.get('display_name', '').strip()

        if not username:
            flash('Username is required', 'danger')
            return render_template('login.html')

        try:
            user = prediction_service.get_or_create_user(username, display_name or None)
            auth.login_user(user.username, user.display_name)
            flash(f'Welcome, {user.display_name}!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            flash(f'Login failed: {str(e)}', 'danger')
            return render_template('login.html')

    return render_template('login.html')


@app.route('/logout')
def logout():
    auth.logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


@app.route('/dashboard')
@auth.login_required
def dashboard():
    username = auth.get_current_user()
    year = config.current_year

    try:
        questions = prediction_service.get_questions_for_year(year)
        predictions = prediction_service.get_predictions_for_user_year(username, year)

        predictions_dict = {p.question_id: p for p in predictions}

        dashboard_items = []
        for question in questions:
            prediction = predictions_dict.get(question.question_id)
            dashboard_items.append({
                'question': question,
                'prediction': prediction
            })

        return render_template(
            'dashboard.html',
            year=year,
            items=dashboard_items,
            can_edit=utils.can_edit_predictions(year, config.current_year)
        )
    except Exception as e:
        flash(f'Error loading dashboard: {str(e)}', 'danger')
        return render_template('dashboard.html', year=year, items=[])


@app.route('/predictions/new', methods=['GET', 'POST'])
@auth.login_required
def predictions_new():
    username = auth.get_current_user()
    year = config.current_year

    if not utils.can_edit_predictions(year, config.current_year):
        flash('Predictions for this year are closed.', 'warning')
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        question_id = request.form.get('question_id')
        answer = request.form.get('answer')
        confidence = request.form.get('confidence')
        notes = request.form.get('notes', '')

        try:
            prediction_service.create_prediction(
                question_id=question_id,
                username=username,
                year=year,
                answer=answer,
                confidence=confidence,
                notes=notes
            )
            flash('Prediction saved successfully!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            flash(f'Error saving prediction: {str(e)}', 'danger')

    try:
        questions = prediction_service.get_questions_for_year(year)
        predictions = prediction_service.get_predictions_for_user_year(username, year)
        predictions_dict = {p.question_id: p for p in predictions}

        available_questions = [q for q in questions if q.question_id not in predictions_dict]

        return render_template(
            'predictions_new.html',
            questions=available_questions,
            year=year
        )
    except Exception as e:
        flash(f'Error loading questions: {str(e)}', 'danger')
        return render_template('predictions_new.html', questions=[], year=year)


@app.route('/predictions/edit/<prediction_id>', methods=['GET', 'POST'])
@auth.login_required
def predictions_edit(prediction_id):
    username = auth.get_current_user()

    try:
        prediction_data, _ = firebase_client.get_prediction(prediction_id)

        if not prediction_data:
            flash('Prediction not found.', 'danger')
            return redirect(url_for('dashboard'))

        if prediction_data['username'] != username:
            flash('You can only edit your own predictions.', 'danger')
            return redirect(url_for('dashboard'))

        year = prediction_data['year']
        if not utils.can_edit_predictions(year, config.current_year):
            flash('Predictions for this year are closed.', 'warning')
            return redirect(url_for('dashboard'))

        if request.method == 'POST':
            answer = request.form.get('answer')
            confidence = request.form.get('confidence')
            notes = request.form.get('notes', '')

            try:
                prediction_service.update_prediction(
                    prediction_id=prediction_id,
                    answer=answer,
                    confidence=confidence,
                    notes=notes
                )
                flash('Prediction updated successfully!', 'success')
                return redirect(url_for('dashboard'))
            except Exception as e:
                flash(f'Error updating prediction: {str(e)}', 'danger')

        question = firebase_client.get_question(prediction_data['question_id'])

        return render_template(
            'predictions_edit.html',
            prediction=prediction_data,
            question=question
        )
    except Exception as e:
        flash(f'Error: {str(e)}', 'danger')
        return redirect(url_for('dashboard'))


@app.route('/review')
@app.route('/review/<int:year>')
@auth.login_required
def review(year=None):
    username = auth.get_current_user()

    try:
        available_years = prediction_service.get_available_years()

        if year is None:
            if available_years:
                past_years = [y for y in available_years if y < config.current_year]
                if past_years:
                    year = past_years[0]
                else:
                    flash('No past predictions to review yet.', 'info')
                    return render_template('review.html', items=[], year=None, available_years=available_years)
            else:
                flash('No predictions found.', 'info')
                return render_template('review.html', items=[], year=None, available_years=[])

        review_items = prediction_service.get_review_data_for_year(username, year)
        score_data = prediction_service.get_score_for_user_year(username, year)

        return render_template(
            'review.html',
            year=year,
            items=review_items,
            score=score_data['score'],
            calibration=score_data['calibration'],
            available_years=available_years
        )
    except Exception as e:
        flash(f'Error loading review: {str(e)}', 'danger')
        return render_template('review.html', items=[], year=year, available_years=[])


@app.route('/scores')
@app.route('/scores/<int:year>')
@auth.login_required
def scores(year=None):
    username = auth.get_current_user()

    try:
        available_years = prediction_service.get_available_years()

        if year is None:
            if available_years:
                past_years = [y for y in available_years if y < config.current_year]
                if past_years:
                    year = past_years[0]
                else:
                    flash('No past predictions to score yet.', 'info')
                    return render_template('scores.html', year=None, available_years=available_years)
            else:
                flash('No predictions found.', 'info')
                return render_template('scores.html', year=None, available_years=[])

        score_data = prediction_service.get_score_for_user_year(username, year)

        return render_template(
            'scores.html',
            year=year,
            score=score_data['score'],
            calibration=score_data['calibration'],
            available_years=available_years
        )
    except Exception as e:
        flash(f'Error loading scores: {str(e)}', 'danger')
        return render_template('scores.html', year=year, available_years=[])


@app.route('/admin/questions', methods=['GET', 'POST'])
@auth.admin_required(config.admin_usernames)
def admin_questions():
    username = auth.get_current_user()

    if request.method == 'POST':
        year = request.form.get('year')
        question_text = request.form.get('question_text')
        question_type = request.form.get('question_type', 'boolean')
        actual_answer = request.form.get('actual_answer')

        try:
            question_id = prediction_service.create_question(
                year=year,
                question_text=question_text,
                created_by=username,
                question_type=question_type
            )

            # If actual_answer is provided, resolve the question immediately
            if actual_answer:
                prediction_service.resolve_question(
                    question_id=question_id,
                    year=year,
                    actual_answer=actual_answer,
                    resolved_by=username
                )
                flash('Question added and resolved successfully!', 'success')
            else:
                flash('Question added successfully!', 'success')

            return redirect(url_for('admin_questions'))
        except Exception as e:
            flash(f'Error adding question: {str(e)}', 'danger')

    try:
        questions = firebase_client.get_all_questions(active_only=False)
        return render_template(
            'admin_questions.html',
            questions=questions,
            current_year=config.current_year
        )
    except Exception as e:
        flash(f'Error loading questions: {str(e)}', 'danger')
        return render_template('admin_questions.html', questions=[])


@app.route('/admin/questions/delete/<question_id>', methods=['POST'])
@auth.admin_required(config.admin_usernames)
def admin_delete_question(question_id):
    try:
        firebase_client.delete_question(question_id)
        flash('Question and all associated predictions deleted successfully!', 'success')
    except Exception as e:
        flash(f'Error deleting question: {str(e)}', 'danger')

    return redirect(url_for('admin_questions'))


@app.route('/admin/resolve')
@app.route('/admin/resolve/<int:year>', methods=['GET', 'POST'])
@auth.admin_required(config.admin_usernames)
def admin_resolve(year=None):
    username = auth.get_current_user()

    if year is None:
        year = config.current_year - 1

    if request.method == 'POST':
        question_id = request.form.get('question_id')
        actual_answer = request.form.get('actual_answer')

        try:
            prediction_service.resolve_question(
                question_id=question_id,
                year=year,
                actual_answer=actual_answer,
                resolved_by=username
            )
            flash('Result saved successfully!', 'success')
            return redirect(url_for('admin_resolve', year=year))
        except Exception as e:
            flash(f'Error saving result: {str(e)}', 'danger')

    try:
        resolution_items = prediction_service.get_questions_for_resolution(year)
        available_years = prediction_service.get_available_years()

        return render_template(
            'admin_resolve.html',
            year=year,
            items=resolution_items,
            available_years=available_years
        )
    except Exception as e:
        flash(f'Error loading questions: {str(e)}', 'danger')
        return render_template('admin_resolve.html', year=year, items=[])


@app.route('/initialize', methods=['GET', 'POST'])
def initialize():
    if request.method == 'POST':
        try:
            firebase_client.initialize_collections()
            flash('Firebase Firestore initialized successfully!', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash(f'Error initializing Firestore: {str(e)}', 'danger')

    return render_template('initialize.html')


if __name__ == '__main__':
    app.run(debug=config.debug, host='0.0.0.0', port=5000)
