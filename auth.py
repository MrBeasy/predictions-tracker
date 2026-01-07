from flask import session, redirect, url_for, flash
from functools import wraps


def login_user(username, display_name=None):
    session['username'] = username
    session['display_name'] = display_name or username
    session.permanent = True


def logout_user():
    session.clear()


def get_current_user():
    return session.get('username')


def get_current_display_name():
    return session.get('display_name', session.get('username'))


def is_authenticated():
    return 'username' in session


def is_admin(username, admin_usernames):
    return username in admin_usernames


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(admin_usernames):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated():
                flash('Please log in to access this page.', 'warning')
                return redirect(url_for('login'))

            username = get_current_user()
            if not is_admin(username, admin_usernames):
                flash('You do not have permission to access this page.', 'danger')
                return redirect(url_for('dashboard'))

            return f(*args, **kwargs)
        return decorated_function
    return decorator
