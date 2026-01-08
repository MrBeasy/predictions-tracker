# Predictions Tracker

A web application for tracking yearly predictions with Google Firebase Firestore as the backend database.

## Features

### Core Functionality
- **Multiple Question Types**: Support for three question types:
  - **Boolean (Yes/No)**: Traditional binary predictions
  - **Number**: Numeric predictions with 10% tolerance for scoring
  - **Text**: Open-ended predictions (excluded from auto-scoring, requires manual review)
- **Make Predictions**: Add predictions for current year questions with confidence levels
- **Review Past Years**: Compare your predictions with actual outcomes
- **Score Calculation**: Automatic scoring for boolean and numeric questions
- **Confidence Calibration**: Track accuracy across different confidence levels (1-5)
- **Notes/Reasoning**: Add detailed explanations for your predictions

### User Experience
- **Simple Authentication**: Username-based login (no password required)
- **Pre-selection**: Click "Predict" on a question to have it pre-selected in the form
- **Multi-user Support**: Track predictions for multiple users independently
- **Responsive Design**: Bootstrap 5 UI works on desktop and mobile

### Admin Features
- **Manage Questions**: Add, view, and delete questions for any year
- **Question Type Selection**: Create questions as boolean, number, or text types
- **Resolve Outcomes**: Mark actual answers to calculate scores
- **Historical Questions**: Optionally set answers when creating questions
- **Cascade Delete**: Deleting questions also removes associated predictions and results

### Technical Features
- **Firebase Firestore**: Scalable NoSQL database backend
- **Real-time Data**: Live synchronization capabilities
- **Cloud Deployment**: Ready for Google Cloud Run deployment
- **Production Ready**: Includes Docker configuration and deployment guide

## Requirements

- Python 3.8+
- Google Firebase account
- Firebase project with Firestore enabled

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Enable Firestore

1. In the Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll use service account for security)
4. Select a Cloud Firestore location (choose one close to your users)
5. Click "Enable"

### 3. Create Service Account

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" - this downloads a JSON file
6. Save this file as `firebase-service-account.json` in the `credentials/` directory

### 4. Application Setup

1. Clone or download this project

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create configuration file:
```bash
cp config.yaml.example config.yaml
```

4. Edit `config.yaml`:
```yaml
app:
  secret_key: "generate-a-random-secret-key-here"  # Use a random string
  debug: true  # Set to false in production

firebase:
  credentials_path: "credentials/firebase-service-account.json"

app_settings:
  current_year: 2026  # Update to current year
  predictions_open: true
  admin_usernames:
    - "admin"  # Add your admin username(s)
```

5. Place your Firebase service account JSON file:
```bash
mkdir credentials
# Copy your firebase-service-account.json to credentials/
```

### 5. Run the Application

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. (Optional) Visit `/initialize` to verify Firebase connection

## Usage

### For Regular Users

1. **Login**: Enter a username and optional display name (account created if new)
2. **Dashboard**: View current year questions and your predictions
   - Green checkmark = already predicted
   - Gray icon = not yet predicted
   - Click "Predict" to add a prediction (question will be pre-selected)
3. **Add Prediction**:
   - Select a question (or use pre-selected from dashboard)
   - Answer based on question type:
     - **Boolean**: Choose Yes or No
     - **Number**: Enter a numeric value
     - **Text**: Write your open-ended prediction
   - Set confidence level (1-5)
   - Add optional notes/reasoning
   - Edit predictions before the year ends
4. **Review**: View past year predictions and compare with actual outcomes
   - See which predictions were correct/incorrect
   - Text predictions are shown but not auto-scored
5. **Scores**: See your accuracy percentage and confidence calibration
   - Separate stats for each confidence level
   - Only boolean and numeric questions count toward score

### For Admins

1. **Manage Questions** (`/admin/questions`):
   - Add new questions for any year
   - Choose question type: Boolean, Number, or Text
   - Optionally set the actual answer immediately (for historical questions)
   - View all questions with their status
   - **Delete questions** (removes question, predictions, and results)
2. **Resolve Results** (`/admin/resolve`):
   - Mark actual outcomes for past questions
   - Answer based on question type (Yes/No, number, or text)
   - Scores automatically recalculate after resolution

## Project Structure

```
prediction-app/
├── app.py                      # Main Flask application with all routes
├── config.py                   # Configuration loader
├── auth.py                     # Authentication logic and decorators
├── models.py                   # Data models, score calculation, business logic
├── firebase_client.py          # Firebase Firestore client wrapper
├── utils.py                    # Utility functions (validation, normalization)
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker container configuration
├── .dockerignore              # Files to exclude from Docker build
├── config.yaml                 # Configuration file (create from example)
├── config.yaml.example         # Configuration template
├── README.md                   # This file
├── DEPLOYMENT.md              # Google Cloud Run deployment guide
├── templates/                  # Jinja2 HTML templates
│   ├── base.html              # Base layout with Bootstrap
│   ├── login.html             # Login page
│   ├── dashboard.html         # Main user interface
│   ├── predictions_new.html   # Add prediction form
│   ├── predictions_edit.html  # Edit prediction form
│   ├── review.html            # Review past predictions
│   ├── scores.html            # Score display
│   ├── admin_questions.html   # Manage questions (admin)
│   ├── admin_resolve.html     # Resolve outcomes (admin)
│   └── initialize.html        # Firebase connection test
├── static/                     # Static assets
│   ├── css/custom.css         # Custom styles
│   └── js/app.js              # Client-side JavaScript
└── credentials/                # Firebase credentials (gitignored)
    └── firebase-service-account.json
```

## Data Model

The application uses 4 Firestore collections:

1. **users**:
   - username (document ID)
   - display_name
   - created_at

2. **questions**:
   - question_id (document ID)
   - year (integer)
   - question_text (string)
   - question_type (string: 'boolean', 'number', or 'text')
   - created_by (username)
   - created_at (timestamp)
   - is_active (boolean)

3. **predictions**:
   - prediction_id (document ID)
   - question_id (foreign key)
   - username (foreign key)
   - year (integer)
   - answer (string for boolean/text, numeric string for number)
   - confidence (integer 1-5)
   - notes (string, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

4. **results**:
   - result_id (document ID)
   - question_id (foreign key)
   - year (integer)
   - actual_answer (string for boolean/text, numeric string for number)
   - resolved_at (timestamp)
   - resolved_by (username)

## Firestore Security Rules

For production, add these security rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow service account full access (for backend)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Note: This app uses server-side Firebase Admin SDK, so client-side rules are not strictly necessary. However, setting rules adds an extra layer of security.

## Migration from Google Sheets

If you're migrating from the Google Sheets version:

1. Export your data from Google Sheets (Users, Questions, Predictions, Results)
2. Create a migration script to import data into Firestore:
   ```python
   from firebase_client import FirebaseClient

   client = FirebaseClient('credentials/firebase-service-account.json')

   # Import users
   for user in sheet_users:
       client.add_user(user['username'], user['display_name'])

   # Import questions, predictions, results similarly
   ```

## Security Notes

- Never commit `config.yaml` or `credentials/` to version control
- Use a strong random string for `secret_key` in production
- Consider adding password authentication for production use
- Firebase service account has full access to your Firestore database
- In production, use environment variables for sensitive configuration

## Advantages of Firebase over Google Sheets

- **Better Performance**: Real database queries vs spreadsheet filtering
- **Scalability**: Handles more concurrent users and larger datasets
- **Real-time Updates**: Live data synchronization capabilities
- **Proper Indexing**: Faster queries with Firestore indexes
- **Security**: Fine-grained security rules
- **No Rate Limits**: Unlike Sheets API, Firestore has generous quotas

## Troubleshooting

### "Configuration file not found"
- Make sure you created `config.yaml` from `config.yaml.example`

### "Unable to connect to Firebase"
- Verify the Firebase service account JSON file is in `credentials/`
- Check that the file path in config.yaml is correct
- Ensure your Firebase project has Firestore enabled

### "Permission denied" errors
- Verify the service account key is valid
- Check Firestore security rules allow server-side access
- Ensure credentials file path in config.yaml is correct

### FirebaseError: "Project ID not found"
- Make sure you're using the correct service account file
- Verify the JSON file contains a `project_id` field

## Deployment

### Google Cloud Run (Recommended)

This app is ready for deployment on Google Cloud Run with a generous free tier. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete step-by-step instructions.

**Quick Deploy:**
```bash
gcloud run deploy predictions-tracker \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Free Tier Limits:**
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds of compute time
- 1 GB network egress

### Alternative Hosting Options

**Traditional Server:**
1. Set `debug: false` in config.yaml
2. Use Gunicorn: `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
3. Set up reverse proxy (nginx)
4. Configure HTTPS
5. Use environment variables for sensitive config

**Firebase Cloud Functions:**
Deploy as a serverless Cloud Function for automatic scaling.

**Docker:**
The included Dockerfile works with any Docker hosting platform (Heroku, DigitalOcean, AWS, etc.)

## License

This project is provided as-is for personal use.

## Question Types and Scoring

### Boolean Questions (Yes/No)
- Traditional binary predictions
- Scored as correct or incorrect
- Normalized to lowercase for comparison

### Number Questions
- Numeric predictions with **10% tolerance**
- Examples: "What will the S&P 500 close at?", "How many users will we have?"
- Scoring: Correct if within ±10% of actual value
- Formula: `|predicted - actual| / actual <= 0.10`

### Text Questions
- Open-ended predictions
- Examples: "What will be the biggest tech trend?", "Who will win the championship?"
- **Not automatically scored** (requires manual review)
- Displayed in review but excluded from score calculations

## Changelog

### v2.1.0 - Question Types & Deployment (2026-01-08)
- Added support for three question types (boolean, number, text)
- Implemented numeric predictions with 10% tolerance scoring
- Added admin ability to delete questions (cascade delete)
- Added pre-selection: clicking "Predict" pre-selects the question
- Added Google Cloud Run deployment configuration (Dockerfile, .dockerignore)
- Added comprehensive DEPLOYMENT.md guide
- Updated all templates to support question types dynamically

### v2.0.0 - Firebase Migration
- Migrated from Google Sheets to Firebase Firestore
- Improved performance and scalability
- Real-time data synchronization capabilities
- Better query performance with proper indexing

### v1.0.0 - Initial Release
- Google Sheets-based storage
- Basic prediction tracking
- Score calculation
- Multi-user support
