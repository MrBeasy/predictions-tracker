# LLM Context: Predictions Tracker Project

This document provides comprehensive context for AI assistants working on this project.

## Project Overview

**Purpose**: A web application for tracking yearly predictions with scoring and review capabilities.

**Stack**:
- Backend: Python Flask 3.0.0
- Database: Firebase Firestore (NoSQL)
- Frontend: Jinja2 templates + Bootstrap 5
- Deployment: Docker + Google Cloud Run ready
- Auth: Simple session-based username authentication

**Repository**: https://github.com/MrBeasy/predictions-tracker.git

## Architecture

### Request Flow
```
User → Flask Route → PredictionService → FirebaseClient → Firestore
                   ↓
              Jinja2 Template → HTML Response
```

### Key Design Patterns
1. **Service Layer**: `PredictionService` in `models.py` handles business logic
2. **Data Access Layer**: `FirebaseClient` in `firebase_client.py` handles all Firestore operations
3. **Separation of Concerns**: Auth in `auth.py`, validation in `utils.py`
4. **Session-based Auth**: No passwords, username-only login with Flask sessions

## File Structure and Responsibilities

### Core Application Files

**app.py** (387 lines)
- Main Flask application
- All route handlers
- Request validation and error handling
- Flash messages for user feedback
- Routes:
  - `/` - Home redirect
  - `/login`, `/logout` - Authentication
  - `/dashboard` - Main user interface (current year)
  - `/predictions/new` - Create predictions
  - `/predictions/edit/<id>` - Edit predictions
  - `/review` - Review past predictions
  - `/scores` - View score statistics
  - `/admin/questions` - Manage questions
  - `/admin/resolve` - Resolve outcomes
  - `/initialize` - Firebase connection test

**models.py** (379 lines)
- Data models: `User`, `Question`, `Prediction`, `Result`
- `PredictionService` class - business logic layer
- `ScoreCalculator` class - scoring algorithms
- Key methods:
  - `create_prediction()` - Validates and creates predictions
  - `update_prediction()` - Updates existing predictions
  - `resolve_question()` - Marks actual outcomes
  - `calculate_basic_score()` - Computes accuracy percentage
  - `calculate_confidence_calibration()` - Stats by confidence level

**firebase_client.py** (284 lines)
- `FirebaseClient` class - Firestore wrapper
- CRUD operations for all collections
- Query methods with filtering
- Collections:
  - `users` - User accounts
  - `questions` - Prediction questions
  - `predictions` - User predictions
  - `results` - Actual outcomes

**auth.py**
- `login_user()`, `logout_user()` - Session management
- `get_current_user()` - Retrieve logged-in user
- `is_authenticated()` - Check login status
- `@login_required` decorator - Protect routes
- `@admin_required` decorator - Admin-only routes

**utils.py**
- `validate_answer()` - Type-specific validation
- `validate_question_type()` - Checks 'boolean', 'number', 'text'
- `normalize_answer()` - Lowercase normalization for boolean
- `compare_answers()` - Type-aware comparison (10% tolerance for numbers)
- `can_edit_predictions()` - Check if year is still editable
- `generate_id()` - UUID generation
- `current_timestamp()` - ISO 8601 timestamps

**config.py**
- Loads `config.yaml` configuration
- Provides `Config` dataclass with settings
- Validates configuration on startup

### Templates (Jinja2)

**templates/base.html**
- Bootstrap 5 layout
- Navigation bar with conditional admin links
- Flash message display
- Mobile-responsive

**templates/dashboard.html**
- Main user interface
- Shows current year questions
- Indicates predicted/unpredicted status
- "Predict" button with pre-selection: `?question_id=XXX`

**templates/predictions_new.html**
- Dynamic form based on question type
- JavaScript shows/hides input fields:
  - Boolean: Yes/No radio buttons
  - Number: Number input
  - Text: Textarea
- Pre-selection support via URL parameter
- Client-side validation before submission

**templates/predictions_edit.html**
- Similar to predictions_new.html
- Pre-populates existing prediction data
- Type-aware input fields

**templates/admin_questions.html**
- Add new questions with type selection
- List all questions with type badges
- Delete button with confirmation dialog
- Optional immediate resolution for historical questions

**templates/admin_resolve.html**
- Resolve outcomes for past year questions
- Type-aware answer inputs
- Shows current resolution status

**templates/review.html**
- Compare predictions vs actual outcomes
- Color-coded correct/incorrect
- Text predictions shown but not scored

**templates/scores.html**
- Overall accuracy percentage
- Confidence calibration table
- Breakdown by confidence level

### Static Files

**static/css/custom.css**
- Custom styling additions to Bootstrap
- Color scheme for prediction status

**static/js/app.js**
- Client-side JavaScript helpers
- Dynamic form field visibility

## Data Model (Firestore)

### Collections

**users**
```
Document ID: username (string)
Fields:
  - display_name: string
  - created_at: ISO 8601 timestamp
```

**questions**
```
Document ID: question_id (UUID)
Fields:
  - year: integer
  - question_text: string
  - question_type: 'boolean' | 'number' | 'text'
  - created_by: username (string)
  - created_at: ISO 8601 timestamp
  - is_active: boolean
```

**predictions**
```
Document ID: prediction_id (UUID)
Fields:
  - question_id: UUID (foreign key)
  - username: string (foreign key)
  - year: integer
  - answer: string (varies by type)
  - confidence: integer (1-5)
  - notes: string (optional)
  - created_at: ISO 8601 timestamp
  - updated_at: ISO 8601 timestamp
```

**results**
```
Document ID: result_id (UUID)
Fields:
  - question_id: UUID (foreign key)
  - year: integer
  - actual_answer: string (varies by type)
  - resolved_at: ISO 8601 timestamp
  - resolved_by: username (string)
```

### Queries Used
- `where('year', '==', year)` - Filter by year
- `where('username', '==', username)` - User's predictions
- `where('question_id', '==', question_id)` - Specific question
- `where('is_active', '==', True)` - Active questions only

## Question Types System

### Boolean (Yes/No)
- **Storage**: "yes" or "no" (lowercase)
- **Validation**: Must be "yes" or "no"
- **Scoring**: Exact match after normalization
- **UI**: Radio buttons (Yes/No)

### Number
- **Storage**: String representation of number (e.g., "5000.5")
- **Validation**: Must be parseable as float
- **Scoring**: Within 10% tolerance: `|predicted - actual| / actual <= 0.10`
- **UI**: Number input with `step="any"`

### Text
- **Storage**: Any non-empty string
- **Validation**: Cannot be empty
- **Scoring**: **Not auto-scored** - excluded from score calculations
- **UI**: Textarea

### Implementation Notes
- `question_type` defaults to 'boolean' for backwards compatibility
- Templates use `question.question_type|default('boolean')`
- JavaScript dynamically shows correct input type
- Score calculations skip text questions
- Review page shows text predictions but doesn't mark correct/incorrect

## Recent Changes (v2.1.0 - 2026-01-08)

### 1. Multiple Question Types
**Files Modified**: `models.py`, `utils.py`, `firebase_client.py`, all templates
- Added `question_type` field to Question model
- Added type-specific validation in `utils.py`
- Updated templates with dynamic input fields
- Modified scoring to handle numbers with 10% tolerance
- Text questions excluded from auto-scoring

### 2. Admin Delete Functionality
**Files Modified**: `firebase_client.py`, `app.py`, `admin_questions.html`
- Added `delete_question()` method in `firebase_client.py`
- Cascade delete: removes question + all predictions + all results
- Added `/admin/questions/delete/<question_id>` route
- Added Delete button with JavaScript confirmation in admin interface

### 3. Question Pre-selection
**Files Modified**: `app.py`, `predictions_new.html`, `dashboard.html`
- Dashboard "Predict" button passes `?question_id=XXX` parameter
- `predictions_new` route captures and passes `pre_selected_question_id`
- Template marks option as `selected` when IDs match
- JavaScript calls `updateAnswerInput()` on page load to show correct input type

### 4. Google Cloud Run Deployment
**Files Added**: `Dockerfile`, `.dockerignore`, `DEPLOYMENT.md`
**Files Modified**: `requirements.txt`
- Added Dockerfile with gunicorn for production
- Added .dockerignore to exclude unnecessary files
- Updated requirements.txt with gunicorn
- Created comprehensive deployment guide
- Configured for Cloud Run (PORT=8080, secrets management)

## Common Development Patterns

### Adding a New Route
1. Define route in `app.py` with decorator
2. Add authentication decorator if needed: `@auth.login_required`
3. Use `prediction_service` for business logic
4. Flash messages for user feedback: `flash('Message', 'success')`
5. Return template or redirect: `return render_template('template.html', data=data)`

### Adding a New Template
1. Create file in `templates/` directory
2. Extend base: `{% extends "base.html" %}`
3. Override blocks: `{% block title %}`, `{% block content %}`
4. Access context variables: `{{ current_user }}`, `{{ current_year }}`
5. Use URL generation: `{{ url_for('route_name') }}`

### Adding Firestore Operations
1. Add method to `FirebaseClient` class in `firebase_client.py`
2. Use `self.db.collection(COLLECTION_NAME)` to access collections
3. Return data as dictionaries with document IDs included
4. Handle document not found cases (return None)
5. Use `.stream()` for iteration, `.get()` for single documents

### Modifying Score Calculation
1. Edit `ScoreCalculator` class in `models.py`
2. Both methods take: predictions, results, questions (all as lists of dicts)
3. Skip text questions: `if question_type == 'text': continue`
4. Use `utils.compare_answers()` for type-aware comparison
5. Return dictionaries with score data

## Configuration

**config.yaml** (not in Git):
```yaml
app:
  secret_key: "random-secret-key"
  debug: false

firebase:
  credentials_path: "credentials/firebase-service-account.json"

app_settings:
  current_year: 2026
  admin_usernames:
    - "admin"
```

**Environment Variables** (Cloud Run):
- `PORT` - Cloud Run sets to 8080
- Secrets mounted as files (firebase credentials)

## Testing the Application

### Local Testing
```bash
# Install dependencies
pip install -r requirements.txt

# Create config.yaml from example
cp config.yaml.example config.yaml

# Edit config.yaml with your settings

# Run Flask development server
python app.py

# Access at http://localhost:5000
```

### Docker Testing
```bash
# Build image
docker build -t predictions-tracker .

# Run container
docker run -p 8080:8080 \
  -v $(pwd)/credentials:/app/credentials \
  -v $(pwd)/config.yaml:/app/config.yaml \
  predictions-tracker
```

## Common Issues and Solutions

### Question Type Not Showing in Predictions
- **Cause**: Question model missing `question_type` attribute
- **Solution**: Ensure `Question.__init__()` and `from_dict()` include `question_type`
- **Check**: Templates use `question.question_type|default('boolean')`

### Cascade Delete Not Working
- **Cause**: Missing queries for predictions/results
- **Solution**: `delete_question()` must query and delete related documents
- **Check**: Use `where('question_id', '==', question_id)` to find related docs

### Pre-selection Not Working
- **Cause**: URL parameter not captured or passed to template
- **Solution**: Route must capture `request.args.get('question_id')` and pass to template
- **Check**: Template checks `{% if pre_selected_question_id and question.question_id == pre_selected_question_id %}`

### Score Calculation Wrong
- **Cause**: Question types not handled correctly
- **Solution**: Use `utils.compare_answers()` with question_type parameter
- **Check**: Text questions must be excluded from scoring

### Firebase Connection Fails
- **Cause**: Invalid credentials or path
- **Solution**: Verify service account JSON is valid and path in config.yaml is correct
- **Check**: Visit `/initialize` endpoint to test connection

## Git Workflow

**Branch**: `main` (primary branch)

**Commit Message Format**:
```
Brief description of change

- Detail 1
- Detail 2
- Detail 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Recent Commits**:
1. "Add Google Cloud Run deployment configuration"
2. "Pre-select question when clicking Predict button from dashboard"
3. "Add ability for admins to delete questions"
4. "Fix Question model to include question_type attribute"
5. "Add support for multiple question types (boolean, number, text)"

## Deployment

### Google Cloud Run (Recommended)
See **DEPLOYMENT.md** for complete instructions.

**Quick Deploy**:
```bash
gcloud run deploy predictions-tracker \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="credentials/firebase-service-account.json=firebase-credentials:latest"
```

**Free Tier**: 2M requests/month (sufficient for small teams)

### Environment Setup
1. Install gcloud CLI
2. Create GCP project
3. Enable Cloud Build, Cloud Run APIs
4. Store Firebase credentials as secret
5. Deploy with `gcloud run deploy`

## Future Enhancement Ideas

### Short Term
- [ ] Add email notifications for resolved questions
- [ ] Export predictions/scores to PDF or CSV
- [ ] Add question categories/tags
- [ ] Bulk import questions from CSV
- [ ] User profile pages with historical stats

### Medium Term
- [ ] Add password authentication (optional)
- [ ] Implement question drafts
- [ ] Add comments/discussion on predictions
- [ ] Leaderboard across all users
- [ ] API endpoints for external integrations

### Long Term
- [ ] Machine learning prediction suggestions
- [ ] Group predictions (team predictions)
- [ ] Prediction markets (betting with points)
- [ ] Mobile app (React Native or Flutter)
- [ ] Real-time collaborative predictions

## Key Dependencies

```
flask==3.0.0              # Web framework
firebase-admin==6.3.0     # Firestore client
pyyaml==6.0.1            # Config parsing
python-dateutil==2.8.2   # Date utilities
gunicorn==21.2.0         # Production WSGI server
```

## Security Considerations

1. **Credentials**: Never commit `config.yaml` or `credentials/` to Git
2. **Secret Key**: Use strong random string for Flask sessions
3. **Admin Access**: Admin usernames list in config.yaml
4. **Firestore Rules**: Service account has full access (backend only)
5. **HTTPS**: Cloud Run provides automatic HTTPS
6. **Input Validation**: All user inputs validated in `utils.py`
7. **SQL Injection**: N/A (Firestore is NoSQL)
8. **XSS**: Jinja2 auto-escapes HTML

## Performance Notes

- **Firestore Queries**: Use indexes for compound queries
- **Session Storage**: Flask sessions stored client-side (encrypted cookie)
- **Static Files**: Served by Flask in dev, nginx/CDN in production
- **Caching**: Consider adding Redis for frequent queries
- **Connection Pool**: Firebase Admin SDK handles connection pooling

## Debugging Tips

### View Logs (Cloud Run)
```bash
gcloud run services logs read predictions-tracker --region us-central1
```

### Local Debugging
- Set `debug: true` in config.yaml
- Flask auto-reloads on code changes
- Visit `/initialize` to test Firebase connection
- Check browser console for JavaScript errors

### Common Log Messages
- "Configuration file not found" → Missing config.yaml
- "Unable to connect to Firebase" → Check credentials
- "Question not found" → Invalid question_id
- "Prediction not found" → Invalid prediction_id

## API Reference (Internal)

### PredictionService Methods
```python
get_or_create_user(username, display_name=None) → User
get_questions_for_year(year) → List[Question]
get_predictions_for_user_year(username, year) → List[Prediction]
create_prediction(question_id, username, year, answer, confidence, notes='') → str
update_prediction(prediction_id, answer, confidence, notes='') → bool
create_question(year, question_text, created_by, question_type='boolean') → str
resolve_question(question_id, year, actual_answer, resolved_by) → bool
get_score_for_user_year(username, year) → dict
get_review_data_for_year(username, year) → List[dict]
get_available_years() → List[int]
get_questions_for_resolution(year) → List[dict]
```

### FirebaseClient Methods
```python
get_user(username) → dict | None
add_user(username, display_name=None) → dict
get_all_questions(year=None, active_only=True) → List[dict]
get_question(question_id) → dict | None
add_question(year, question_text, created_by, question_type='boolean') → str
delete_question(question_id) → bool
get_all_predictions(username=None, year=None, question_id=None) → List[dict]
get_prediction(prediction_id) → (dict | None, None)
add_prediction(question_id, username, year, answer, confidence, notes='') → str
update_prediction(prediction_id, answer, confidence, notes='') → bool
get_all_results(year=None) → List[dict]
get_result(question_id) → (dict | None, None)
add_result(question_id, year, actual_answer, resolved_by) → bool
update_result(question_id, actual_answer) → bool
get_years_with_predictions() → List[int]
```

---

**Last Updated**: 2026-01-08
**Version**: 2.1.0
**AI Assistant**: Use this document to quickly understand the project architecture, recent changes, and development patterns.
