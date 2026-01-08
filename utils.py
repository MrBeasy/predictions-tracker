from datetime import datetime
from dateutil import parser
import uuid


def generate_id():
    return str(uuid.uuid4())


def current_timestamp():
    return datetime.now().isoformat()


def parse_datetime(dt_string):
    if not dt_string:
        return None
    try:
        return parser.parse(dt_string)
    except Exception:
        return None


def format_datetime(dt):
    if isinstance(dt, str):
        dt = parse_datetime(dt)
    if dt:
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    return ''


def format_date(dt):
    if isinstance(dt, str):
        dt = parse_datetime(dt)
    if dt:
        return dt.strftime('%Y-%m-%d')
    return ''


def validate_answer(answer, question_type='boolean'):
    """Validate answer based on question type"""
    if not answer and answer != 0:  # Allow 0 for numbers
        return False

    if question_type == 'boolean':
        answer_lower = str(answer).lower().strip()
        return answer_lower in ['yes', 'no']
    elif question_type == 'number':
        try:
            float(answer)
            return True
        except (ValueError, TypeError):
            return False
    elif question_type == 'text':
        return len(str(answer).strip()) > 0

    return False


def normalize_answer(answer, question_type='boolean'):
    """Normalize answer based on question type"""
    if not answer and answer != 0:
        return None

    if question_type == 'boolean':
        return str(answer).lower().strip()
    elif question_type == 'number':
        try:
            return float(answer)
        except (ValueError, TypeError):
            return None
    elif question_type == 'text':
        return str(answer).strip()

    return str(answer).strip()


def validate_confidence(confidence):
    try:
        conf = int(confidence)
        return 1 <= conf <= 5
    except (ValueError, TypeError):
        return False


def validate_year(year):
    try:
        y = int(year)
        return 2000 <= y <= 2100
    except (ValueError, TypeError):
        return False


def get_current_year():
    return datetime.now().year


def can_edit_predictions(year, current_year=None):
    if current_year is None:
        current_year = get_current_year()
    return int(year) == int(current_year)


def can_resolve_results(year, current_year=None):
    if current_year is None:
        current_year = get_current_year()
    if int(year) == int(current_year) - 1:
        month = datetime.now().month
        return month <= 3
    return False


def calculate_percentage(correct, total):
    if total == 0:
        return 0.0
    return round((correct / total) * 100, 1)


def compare_answers(predicted, actual, question_type='boolean', tolerance_percent=10):
    """Compare predicted vs actual answer based on question type"""
    if predicted is None or actual is None:
        return False

    if question_type == 'boolean':
        return normalize_answer(predicted, 'boolean') == normalize_answer(actual, 'boolean')
    elif question_type == 'number':
        try:
            pred_num = float(predicted)
            actual_num = float(actual)

            # If actual is 0, use absolute tolerance
            if actual_num == 0:
                return abs(pred_num - actual_num) < 0.01

            # Otherwise use percentage tolerance
            tolerance = abs(actual_num * (tolerance_percent / 100))
            return abs(pred_num - actual_num) <= tolerance
        except (ValueError, TypeError):
            return False
    elif question_type == 'text':
        # Text answers can't be automatically scored
        return None

    return False


def validate_question_type(question_type):
    """Validate question type"""
    return question_type in ['boolean', 'number', 'text']
