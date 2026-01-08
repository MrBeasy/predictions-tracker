import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import utils


class FirebaseClient:
    COLLECTION_USERS = 'users'
    COLLECTION_QUESTIONS = 'questions'
    COLLECTION_PREDICTIONS = 'predictions'
    COLLECTION_RESULTS = 'results'

    def __init__(self, credentials_path):
        """Initialize Firebase connection"""
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)

        self.db = firestore.client()

    def initialize_collections(self):
        """Initialize Firestore collections (creates them on first write)"""
        # Firestore creates collections automatically on first document write
        # This method is kept for compatibility but doesn't need to do anything
        pass

    # User methods
    def get_all_users(self):
        """Get all users"""
        users_ref = self.db.collection(self.COLLECTION_USERS)
        docs = users_ref.stream()

        users = []
        for doc in docs:
            data = doc.to_dict()
            data['username'] = doc.id
            users.append(data)

        return users

    def get_user(self, username):
        """Get a specific user by username"""
        doc_ref = self.db.collection(self.COLLECTION_USERS).document(username)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            data['username'] = doc.id
            return data
        return None

    def add_user(self, username, display_name=None):
        """Add a new user"""
        if display_name is None:
            display_name = username

        user_data = {
            'display_name': display_name,
            'created_at': utils.current_timestamp()
        }

        self.db.collection(self.COLLECTION_USERS).document(username).set(user_data)

        return {
            'username': username,
            'display_name': display_name,
            'created_at': user_data['created_at']
        }

    # Question methods
    def get_all_questions(self, year=None, active_only=True):
        """Get all questions with optional filters"""
        questions_ref = self.db.collection(self.COLLECTION_QUESTIONS)

        # Apply filters
        if year:
            questions_ref = questions_ref.where('year', '==', int(year))
        if active_only:
            questions_ref = questions_ref.where('is_active', '==', True)

        docs = questions_ref.stream()

        questions = []
        for doc in docs:
            data = doc.to_dict()
            data['question_id'] = doc.id
            questions.append(data)

        return questions

    def get_question(self, question_id):
        """Get a specific question"""
        doc_ref = self.db.collection(self.COLLECTION_QUESTIONS).document(question_id)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            data['question_id'] = doc.id
            return data
        return None

    def add_question(self, year, question_text, created_by, question_type='boolean'):
        """Add a new question"""
        question_id = utils.generate_id()

        question_data = {
            'year': int(year),
            'question_text': question_text,
            'question_type': question_type,  # 'boolean', 'number', or 'text'
            'created_by': created_by,
            'created_at': utils.current_timestamp(),
            'is_active': True
        }

        self.db.collection(self.COLLECTION_QUESTIONS).document(question_id).set(question_data)

        return question_id

    def delete_question(self, question_id):
        """Delete a question and its associated predictions and results"""
        # Delete the question
        self.db.collection(self.COLLECTION_QUESTIONS).document(question_id).delete()

        # Delete all predictions for this question
        predictions_ref = self.db.collection(self.COLLECTION_PREDICTIONS).where('question_id', '==', question_id)
        for doc in predictions_ref.stream():
            doc.reference.delete()

        # Delete result for this question
        results_ref = self.db.collection(self.COLLECTION_RESULTS).where('question_id', '==', question_id)
        for doc in results_ref.stream():
            doc.reference.delete()

        return True

    # Prediction methods
    def get_all_predictions(self, username=None, year=None, question_id=None):
        """Get all predictions with optional filters"""
        predictions_ref = self.db.collection(self.COLLECTION_PREDICTIONS)

        # Apply filters
        if username:
            predictions_ref = predictions_ref.where('username', '==', username)
        if year:
            predictions_ref = predictions_ref.where('year', '==', int(year))
        if question_id:
            predictions_ref = predictions_ref.where('question_id', '==', question_id)

        docs = predictions_ref.stream()

        predictions = []
        for doc in docs:
            data = doc.to_dict()
            data['prediction_id'] = doc.id
            predictions.append(data)

        return predictions

    def get_prediction(self, prediction_id):
        """Get a specific prediction"""
        doc_ref = self.db.collection(self.COLLECTION_PREDICTIONS).document(prediction_id)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            data['prediction_id'] = doc.id
            return data, None  # Return None for row_idx (not needed in Firestore)
        return None, None

    def add_prediction(self, question_id, username, year, answer, confidence, notes=''):
        """Add a new prediction"""
        prediction_id = utils.generate_id()
        timestamp = utils.current_timestamp()

        prediction_data = {
            'question_id': question_id,
            'username': username,
            'year': int(year),
            'answer': answer,
            'confidence': int(confidence),
            'notes': notes,
            'created_at': timestamp,
            'updated_at': timestamp
        }

        self.db.collection(self.COLLECTION_PREDICTIONS).document(prediction_id).set(prediction_data)

        return prediction_id

    def update_prediction(self, prediction_id, answer, confidence, notes=''):
        """Update an existing prediction"""
        doc_ref = self.db.collection(self.COLLECTION_PREDICTIONS).document(prediction_id)

        if not doc_ref.get().exists:
            return False

        update_data = {
            'answer': answer,
            'confidence': int(confidence),
            'notes': notes,
            'updated_at': utils.current_timestamp()
        }

        doc_ref.update(update_data)
        return True

    # Result methods
    def get_all_results(self, year=None):
        """Get all results with optional year filter"""
        results_ref = self.db.collection(self.COLLECTION_RESULTS)

        if year:
            results_ref = results_ref.where('year', '==', int(year))

        docs = results_ref.stream()

        results = []
        for doc in docs:
            data = doc.to_dict()
            data['result_id'] = doc.id
            results.append(data)

        return results

    def get_result(self, question_id):
        """Get a specific result by question_id"""
        results_ref = self.db.collection(self.COLLECTION_RESULTS)
        query = results_ref.where('question_id', '==', question_id).limit(1)
        docs = list(query.stream())

        if docs:
            data = docs[0].to_dict()
            data['result_id'] = docs[0].id
            return data, None  # Return None for row_idx (not needed in Firestore)
        return None, None

    def add_result(self, question_id, year, actual_answer, resolved_by):
        """Add a new result"""
        result_id = utils.generate_id()

        result_data = {
            'question_id': question_id,
            'year': int(year),
            'actual_answer': actual_answer,
            'resolved_at': utils.current_timestamp(),
            'resolved_by': resolved_by
        }

        self.db.collection(self.COLLECTION_RESULTS).document(result_id).set(result_data)

        return True

    def update_result(self, question_id, actual_answer):
        """Update an existing result"""
        # Find the result document by question_id
        results_ref = self.db.collection(self.COLLECTION_RESULTS)
        query = results_ref.where('question_id', '==', question_id).limit(1)
        docs = list(query.stream())

        if not docs:
            return False

        doc_ref = docs[0].reference
        update_data = {
            'actual_answer': actual_answer,
            'resolved_at': utils.current_timestamp()
        }

        doc_ref.update(update_data)
        return True

    def get_years_with_predictions(self):
        """Get all unique years that have predictions"""
        predictions_ref = self.db.collection(self.COLLECTION_PREDICTIONS)
        docs = predictions_ref.stream()

        years = set()
        for doc in docs:
            data = doc.to_dict()
            if 'year' in data:
                years.add(int(data['year']))

        return sorted(years, reverse=True)
