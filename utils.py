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


def validate_answer(answer):
    if not answer:
        return False
    answer = answer.lower().strip()
    return answer in ['yes', 'no']


def normalize_answer(answer):
    if not answer:
        return None
    return answer.lower().strip()


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
