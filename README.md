# Predictions Tracker

A web application for tracking yearly predictions with Google Firebase Firestore as the backend database.

## Features

- Make predictions for the current year
- Review past year predictions with actual outcomes
- Score calculation (percentage of correct predictions)
- Confidence level tracking (1-5 scale)
- Notes/reasoning for each prediction
- Multi-user support with simple username authentication
- Admin interface for managing questions and resolving outcomes
- Firebase Firestore integration for scalable data storage
- Real-time data synchronization

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

1. **Login**: Enter a username (will be created if new)
2. **Dashboard**: View current year questions and make predictions
3. **Add Prediction**:
   - Select a question
   - Choose Yes/No
   - Set confidence level (1-5)
   - Add optional notes/reasoning
4. **Review**: View past year predictions and compare with actual outcomes
5. **Scores**: See your accuracy percentage and confidence calibration

### For Admins

1. **Manage Questions**: Add new questions for any year
   - Optionally set the actual answer immediately (for historical questions)
2. **Resolve Results**: Mark actual outcomes for past questions to calculate user scores

## Project Structure

```
prediction-app/
├── app.py                      # Main Flask application
├── config.py                   # Configuration loader
├── auth.py                     # Authentication logic
├── models.py                   # Data models & business logic
├── firebase_client.py          # Firebase Firestore client
├── utils.py                    # Utility functions
├── requirements.txt            # Python dependencies
├── config.yaml                 # Configuration file (create from example)
├── config.yaml.example         # Configuration template
├── README.md                   # This file
├── templates/                  # HTML templates
├── static/                     # CSS and JS files
└── credentials/                # Firebase credentials (gitignored)
```

## Data Model

The application uses 4 Firestore collections:

1. **users**: username (doc ID), display_name, created_at
2. **questions**: question_id (doc ID), year, question_text, created_by, created_at, is_active
3. **predictions**: prediction_id (doc ID), question_id, username, year, answer, confidence, notes, created_at, updated_at
4. **results**: result_id (doc ID), question_id, year, actual_answer, resolved_at, resolved_by

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

### Option 1: Firebase Hosting + Cloud Run

1. Containerize the Flask app
2. Deploy to Cloud Run
3. Use Firebase Hosting for static content

### Option 2: Traditional Hosting

For production deployment on any server:

1. Set `debug: false` in config.yaml
2. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
3. Set up a reverse proxy (nginx)
4. Configure HTTPS
5. Use environment variables for sensitive config

### Option 3: Cloud Functions

Deploy as a Firebase Cloud Function for serverless operation.

## License

This project is provided as-is for personal use.

## Changelog

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
