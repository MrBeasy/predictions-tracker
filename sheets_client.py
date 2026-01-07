import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime, timedelta
import utils


class SheetsClient:
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    SHEET_USERS = 'Users'
    SHEET_QUESTIONS = 'Questions'
    SHEET_PREDICTIONS = 'Predictions'
    SHEET_RESULTS = 'Results'

    def __init__(self, credentials_path, spreadsheet_id):
        self.credentials_path = credentials_path
        self.spreadsheet_id = spreadsheet_id
        self.client = None
        self.spreadsheet = None
        self.cache = {}
        self.cache_timestamp = {}
        self.cache_ttl = timedelta(minutes=5)
        self._connect()

    def _connect(self):
        creds = Credentials.from_service_account_file(
            self.credentials_path,
            scopes=self.SCOPES
        )
        self.client = gspread.authorize(creds)
        self.spreadsheet = self.client.open_by_key(self.spreadsheet_id)

    def _get_or_create_sheet(self, sheet_name, headers):
        try:
            worksheet = self.spreadsheet.worksheet(sheet_name)
        except gspread.WorksheetNotFound:
            worksheet = self.spreadsheet.add_worksheet(
                title=sheet_name,
                rows=1000,
                cols=len(headers)
            )
            worksheet.append_row(headers)
        return worksheet

    def _get_sheet(self, sheet_name):
        return self.spreadsheet.worksheet(sheet_name)

    def _is_cache_valid(self, key):
        if key not in self.cache_timestamp:
            return False
        return datetime.now() - self.cache_timestamp[key] < self.cache_ttl

    def _set_cache(self, key, value):
        self.cache[key] = value
        self.cache_timestamp[key] = datetime.now()

    def _get_cache(self, key):
        if self._is_cache_valid(key):
            return self.cache.get(key)
        return None

    def _clear_cache(self, key=None):
        if key:
            self.cache.pop(key, None)
            self.cache_timestamp.pop(key, None)
        else:
            self.cache.clear()
            self.cache_timestamp.clear()

    def initialize_sheets(self):
        self._get_or_create_sheet(
            self.SHEET_USERS,
            ['username', 'display_name', 'created_at']
        )
        self._get_or_create_sheet(
            self.SHEET_QUESTIONS,
            ['question_id', 'year', 'question_text', 'created_by', 'created_at', 'is_active']
        )
        self._get_or_create_sheet(
            self.SHEET_PREDICTIONS,
            ['prediction_id', 'question_id', 'username', 'year', 'answer', 'confidence', 'notes', 'created_at', 'updated_at']
        )
        self._get_or_create_sheet(
            self.SHEET_RESULTS,
            ['question_id', 'year', 'actual_answer', 'resolved_at', 'resolved_by']
        )

    def get_all_users(self):
        cached = self._get_cache('users')
        if cached:
            return cached

        sheet = self._get_sheet(self.SHEET_USERS)
        records = sheet.get_all_records()
        self._set_cache('users', records)
        return records

    def get_user(self, username):
        users = self.get_all_users()
        for user in users:
            if user['username'] == username:
                return user
        return None

    def add_user(self, username, display_name=None):
        sheet = self._get_sheet(self.SHEET_USERS)
        if display_name is None:
            display_name = username

        sheet.append_row([
            username,
            display_name,
            utils.current_timestamp()
        ])
        self._clear_cache('users')
        return {'username': username, 'display_name': display_name}

    def get_all_questions(self, year=None, active_only=True):
        cache_key = f'questions_{year}_{active_only}'
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        sheet = self._get_sheet(self.SHEET_QUESTIONS)
        records = sheet.get_all_records()

        filtered = []
        for record in records:
            if year and str(record['year']) != str(year):
                continue
            if active_only and str(record.get('is_active', 'true')).lower() != 'true':
                continue
            filtered.append(record)

        self._set_cache(cache_key, filtered)
        return filtered

    def get_question(self, question_id):
        sheet = self._get_sheet(self.SHEET_QUESTIONS)
        records = sheet.get_all_records()
        for record in records:
            if record['question_id'] == question_id:
                return record
        return None

    def add_question(self, year, question_text, created_by):
        sheet = self._get_sheet(self.SHEET_QUESTIONS)
        question_id = utils.generate_id()

        sheet.append_row([
            question_id,
            year,
            question_text,
            created_by,
            utils.current_timestamp(),
            'true'
        ])
        self._clear_cache()
        return question_id

    def get_all_predictions(self, username=None, year=None, question_id=None):
        cache_key = f'predictions_{username}_{year}_{question_id}'
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        sheet = self._get_sheet(self.SHEET_PREDICTIONS)
        records = sheet.get_all_records()

        filtered = []
        for record in records:
            if username and record['username'] != username:
                continue
            if year and str(record['year']) != str(year):
                continue
            if question_id and record['question_id'] != question_id:
                continue
            filtered.append(record)

        self._set_cache(cache_key, filtered)
        return filtered

    def get_prediction(self, prediction_id):
        sheet = self._get_sheet(self.SHEET_PREDICTIONS)
        records = sheet.get_all_records()
        for idx, record in enumerate(records, start=2):
            if record['prediction_id'] == prediction_id:
                return record, idx
        return None, None

    def add_prediction(self, question_id, username, year, answer, confidence, notes=''):
        sheet = self._get_sheet(self.SHEET_PREDICTIONS)
        prediction_id = utils.generate_id()
        timestamp = utils.current_timestamp()

        sheet.append_row([
            prediction_id,
            question_id,
            username,
            year,
            answer,
            confidence,
            notes,
            timestamp,
            timestamp
        ])
        self._clear_cache()
        return prediction_id

    def update_prediction(self, prediction_id, answer, confidence, notes=''):
        prediction, row_idx = self.get_prediction(prediction_id)
        if not prediction:
            return False

        sheet = self._get_sheet(self.SHEET_PREDICTIONS)
        timestamp = utils.current_timestamp()

        sheet.update_cell(row_idx, 5, answer)
        sheet.update_cell(row_idx, 6, confidence)
        sheet.update_cell(row_idx, 7, notes)
        sheet.update_cell(row_idx, 9, timestamp)

        self._clear_cache()
        return True

    def get_all_results(self, year=None):
        cache_key = f'results_{year}'
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        sheet = self._get_sheet(self.SHEET_RESULTS)
        records = sheet.get_all_records()

        if year:
            filtered = [r for r in records if str(r['year']) == str(year)]
        else:
            filtered = records

        self._set_cache(cache_key, filtered)
        return filtered

    def get_result(self, question_id):
        sheet = self._get_sheet(self.SHEET_RESULTS)
        records = sheet.get_all_records()
        for idx, record in enumerate(records, start=2):
            if record['question_id'] == question_id:
                return record, idx
        return None, None

    def add_result(self, question_id, year, actual_answer, resolved_by):
        sheet = self._get_sheet(self.SHEET_RESULTS)

        sheet.append_row([
            question_id,
            year,
            actual_answer,
            utils.current_timestamp(),
            resolved_by
        ])
        self._clear_cache()
        return True

    def update_result(self, question_id, actual_answer):
        result, row_idx = self.get_result(question_id)
        if not result:
            return False

        sheet = self._get_sheet(self.SHEET_RESULTS)
        timestamp = utils.current_timestamp()

        sheet.update_cell(row_idx, 3, actual_answer)
        sheet.update_cell(row_idx, 4, timestamp)

        self._clear_cache()
        return True

    def get_years_with_predictions(self):
        sheet = self._get_sheet(self.SHEET_PREDICTIONS)
        records = sheet.get_all_records()
        years = set()
        for record in records:
            if record.get('year'):
                years.add(int(record['year']))
        return sorted(years, reverse=True)
