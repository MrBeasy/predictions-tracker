import utils


class User:
    def __init__(self, username, display_name=None):
        self.username = username
        self.display_name = display_name or username

    @staticmethod
    def from_dict(data):
        return User(
            username=data.get('username'),
            display_name=data.get('display_name')
        )


class Question:
    def __init__(self, question_id, year, question_text, created_by, created_at=None, is_active=True):
        self.question_id = question_id
        self.year = year
        self.question_text = question_text
        self.created_by = created_by
        self.created_at = created_at
        self.is_active = is_active

    @staticmethod
    def from_dict(data):
        return Question(
            question_id=data.get('question_id'),
            year=data.get('year'),
            question_text=data.get('question_text'),
            created_by=data.get('created_by'),
            created_at=data.get('created_at'),
            is_active=str(data.get('is_active', 'true')).lower() == 'true'
        )


class Prediction:
    def __init__(self, prediction_id, question_id, username, year, answer, confidence, notes='', created_at=None, updated_at=None):
        self.prediction_id = prediction_id
        self.question_id = question_id
        self.username = username
        self.year = year
        self.answer = answer
        self.confidence = confidence
        self.notes = notes
        self.created_at = created_at
        self.updated_at = updated_at

    @staticmethod
    def from_dict(data):
        return Prediction(
            prediction_id=data.get('prediction_id'),
            question_id=data.get('question_id'),
            username=data.get('username'),
            year=data.get('year'),
            answer=data.get('answer'),
            confidence=data.get('confidence'),
            notes=data.get('notes', ''),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )


class Result:
    def __init__(self, question_id, year, actual_answer, resolved_at=None, resolved_by=None):
        self.question_id = question_id
        self.year = year
        self.actual_answer = actual_answer
        self.resolved_at = resolved_at
        self.resolved_by = resolved_by

    @staticmethod
    def from_dict(data):
        return Result(
            question_id=data.get('question_id'),
            year=data.get('year'),
            actual_answer=data.get('actual_answer'),
            resolved_at=data.get('resolved_at'),
            resolved_by=data.get('resolved_by')
        )


class ScoreCalculator:
    @staticmethod
    def calculate_basic_score(predictions, results, questions):
        if not predictions:
            return {
                'total': 0,
                'correct': 0,
                'incorrect': 0,
                'unresolved': 0,
                'text_questions': 0,
                'percentage': 0.0
            }

        results_dict = {r['question_id']: r for r in results}
        questions_dict = {q['question_id']: q for q in questions}

        correct = 0
        incorrect = 0
        unresolved = 0
        text_questions = 0

        for pred in predictions:
            question = questions_dict.get(pred['question_id'])
            if not question:
                continue

            question_type = question.get('question_type', 'boolean')

            # Skip text questions from scoring
            if question_type == 'text':
                text_questions += 1
                continue

            result = results_dict.get(pred['question_id'])
            if result:
                is_correct = utils.compare_answers(
                    pred['answer'],
                    result['actual_answer'],
                    question_type
                )
                if is_correct:
                    correct += 1
                else:
                    incorrect += 1
            else:
                unresolved += 1

        total = correct + incorrect
        percentage = utils.calculate_percentage(correct, total)

        return {
            'total': total,
            'correct': correct,
            'incorrect': incorrect,
            'unresolved': unresolved,
            'text_questions': text_questions,
            'percentage': percentage
        }

    @staticmethod
    def calculate_confidence_calibration(predictions, results, questions):
        results_dict = {r['question_id']: r for r in results}
        questions_dict = {q['question_id']: q for q in questions}

        by_confidence = {1: [], 2: [], 3: [], 4: [], 5: []}

        for pred in predictions:
            question = questions_dict.get(pred['question_id'])
            if not question:
                continue

            question_type = question.get('question_type', 'boolean')

            # Skip text questions from calibration
            if question_type == 'text':
                continue

            result = results_dict.get(pred['question_id'])
            if result:
                confidence = int(pred.get('confidence', 3))
                is_correct = utils.compare_answers(
                    pred['answer'],
                    result['actual_answer'],
                    question_type
                )
                by_confidence[confidence].append(is_correct)

        calibration = {}
        for conf_level, results_list in by_confidence.items():
            if results_list:
                correct_count = sum(results_list)
                total_count = len(results_list)
                percentage = utils.calculate_percentage(correct_count, total_count)
                calibration[conf_level] = {
                    'total': total_count,
                    'correct': correct_count,
                    'percentage': percentage
                }
            else:
                calibration[conf_level] = {
                    'total': 0,
                    'correct': 0,
                    'percentage': 0.0
                }

        return calibration


class PredictionService:
    def __init__(self, db_client):
        self.db = db_client

    def get_or_create_user(self, username, display_name=None):
        user = self.db.get_user(username)
        if not user:
            user = self.db.add_user(username, display_name)
        return User.from_dict(user)

    def get_questions_for_year(self, year):
        questions_data = self.db.get_all_questions(year=year, active_only=True)
        return [Question.from_dict(q) for q in questions_data]

    def get_predictions_for_user_year(self, username, year):
        predictions_data = self.db.get_all_predictions(username=username, year=year)
        return [Prediction.from_dict(p) for p in predictions_data]

    def create_prediction(self, question_id, username, year, answer, confidence, notes=''):
        # Get question to determine type
        question = self.db.get_question(question_id)
        if not question:
            raise ValueError("Question not found")

        question_type = question.get('question_type', 'boolean')

        # Validate answer based on question type
        if not utils.validate_answer(answer, question_type):
            if question_type == 'boolean':
                raise ValueError("Invalid answer. Must be 'yes' or 'no'")
            elif question_type == 'number':
                raise ValueError("Invalid answer. Must be a valid number")
            elif question_type == 'text':
                raise ValueError("Invalid answer. Cannot be empty")

        if not utils.validate_confidence(confidence):
            raise ValueError("Invalid confidence. Must be 1-5")

        answer = utils.normalize_answer(answer, question_type)
        prediction_id = self.db.add_prediction(
            question_id=question_id,
            username=username,
            year=year,
            answer=answer,
            confidence=confidence,
            notes=notes
        )
        return prediction_id

    def update_prediction(self, prediction_id, answer, confidence, notes=''):
        # Get prediction to find question
        prediction, _ = self.db.get_prediction(prediction_id)
        if not prediction:
            raise ValueError("Prediction not found")

        # Get question to determine type
        question = self.db.get_question(prediction['question_id'])
        if not question:
            raise ValueError("Question not found")

        question_type = question.get('question_type', 'boolean')

        # Validate answer based on question type
        if not utils.validate_answer(answer, question_type):
            if question_type == 'boolean':
                raise ValueError("Invalid answer. Must be 'yes' or 'no'")
            elif question_type == 'number':
                raise ValueError("Invalid answer. Must be a valid number")
            elif question_type == 'text':
                raise ValueError("Invalid answer. Cannot be empty")

        if not utils.validate_confidence(confidence):
            raise ValueError("Invalid confidence. Must be 1-5")

        answer = utils.normalize_answer(answer, question_type)
        success = self.db.update_prediction(
            prediction_id=prediction_id,
            answer=answer,
            confidence=confidence,
            notes=notes
        )
        return success

    def create_question(self, year, question_text, created_by, question_type='boolean'):
        if not question_text or len(question_text.strip()) == 0:
            raise ValueError("Question text cannot be empty")

        if not utils.validate_year(year):
            raise ValueError("Invalid year")

        if not utils.validate_question_type(question_type):
            raise ValueError("Invalid question type. Must be 'boolean', 'number', or 'text'")

        question_id = self.db.add_question(
            year=year,
            question_text=question_text.strip(),
            created_by=created_by,
            question_type=question_type
        )
        return question_id

    def resolve_question(self, question_id, year, actual_answer, resolved_by):
        # Get question to determine type
        question = self.db.get_question(question_id)
        if not question:
            raise ValueError("Question not found")

        question_type = question.get('question_type', 'boolean')

        # Validate answer based on question type
        if not utils.validate_answer(actual_answer, question_type):
            if question_type == 'boolean':
                raise ValueError("Invalid answer. Must be 'yes' or 'no'")
            elif question_type == 'number':
                raise ValueError("Invalid answer. Must be a valid number")
            elif question_type == 'text':
                raise ValueError("Invalid answer. Cannot be empty")

        actual_answer = utils.normalize_answer(actual_answer, question_type)

        existing_result, _ = self.db.get_result(question_id)
        if existing_result:
            return self.db.update_result(question_id, actual_answer)
        else:
            return self.db.add_result(
                question_id=question_id,
                year=year,
                actual_answer=actual_answer,
                resolved_by=resolved_by
            )

    def get_score_for_user_year(self, username, year):
        predictions = self.db.get_all_predictions(username=username, year=year)
        results = self.db.get_all_results(year=year)
        questions = self.db.get_all_questions(year=year, active_only=False)

        score = ScoreCalculator.calculate_basic_score(predictions, results, questions)
        calibration = ScoreCalculator.calculate_confidence_calibration(predictions, results, questions)

        return {
            'score': score,
            'calibration': calibration
        }

    def get_review_data_for_year(self, username, year):
        predictions = self.db.get_all_predictions(username=username, year=year)
        questions = self.db.get_all_questions(year=year, active_only=False)
        results = self.db.get_all_results(year=year)

        questions_dict = {q['question_id']: q for q in questions}
        results_dict = {r['question_id']: r for r in results}

        review_items = []
        for pred in predictions:
            question = questions_dict.get(pred['question_id'])
            result = results_dict.get(pred['question_id'])

            if question:
                review_items.append({
                    'question': question,
                    'prediction': pred,
                    'result': result,
                    'is_correct': result and utils.normalize_answer(pred['answer']) == utils.normalize_answer(result['actual_answer']) if result else None
                })

        return review_items

    def get_available_years(self):
        return self.db.get_years_with_predictions()

    def get_questions_for_resolution(self, year):
        questions = self.db.get_all_questions(year=year, active_only=False)
        results = self.db.get_all_results(year=year)

        results_dict = {r['question_id']: r for r in results}

        resolution_items = []
        for question in questions:
            result = results_dict.get(question['question_id'])
            resolution_items.append({
                'question': question,
                'result': result
            })

        return resolution_items
