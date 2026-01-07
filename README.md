# Predictions Tracker

A web application for tracking yearly predictions with Google Sheets as the backend database.

## Features

- Make predictions for the current year
- Review past year predictions with actual outcomes
- Score calculation (percentage of correct predictions)
- Confidence level tracking (1-5 scale)
- Notes/reasoning for each prediction
- Multi-user support with simple username authentication
- Admin interface for managing questions and resolving outcomes
- Google Sheets integration for data storage

## Requirements

- Python 3.8+
- Google Cloud Platform account
- Google Spreadsheet

## Setup Instructions

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"
   - Skip granting roles (click "Continue")
   - Click "Done"
5. Generate Service Account Key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Download the key file
   - Save it as `service-account.json` in the `credentials/` directory

### 2. Google Spreadsheet Setup

1. Create a new Google Spreadsheet
2. Copy the Spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part
3. Share the spreadsheet with the service account email:
   - Open the JSON key file you downloaded
   - Find the `client_email` field (looks like `xyz@abc.iam.gserviceaccount.com`)
   - In your Google Spreadsheet, click "Share"
   - Add the service account email with "Editor" permissions

### 3. Application Setup

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

google_sheets:
  spreadsheet_id: "YOUR_SPREADSHEET_ID_HERE"  # Paste your spreadsheet ID
  credentials_path: "credentials/service-account.json"

app_settings:
  current_year: 2026  # Update to current year
  predictions_open: true
  admin_usernames:
    - "admin"  # Add your admin username(s)
```

5. Place your service account JSON file:
```bash
mkdir credentials
# Copy your service-account.json to credentials/
```

### 4. Initialize the Application

1. Initialize Google Sheets structure:
```bash
python -c "from sheets_client import SheetsClient; from config import load_config; c = load_config(); s = SheetsClient(c.credentials_path, c.spreadsheet_id); s.initialize_sheets()"
```

Or visit `http://localhost:5000/initialize` after starting the app.

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

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
2. **Resolve Results**: Mark actual outcomes for past questions to calculate user scores

## Project Structure

```
prediction-app/
├── app.py                      # Main Flask application
├── config.py                   # Configuration loader
├── auth.py                     # Authentication logic
├── models.py                   # Data models & business logic
├── sheets_client.py            # Google Sheets API wrapper
├── utils.py                    # Utility functions
├── requirements.txt            # Python dependencies
├── config.yaml                 # Configuration file (create from example)
├── config.yaml.example         # Configuration template
├── README.md                   # This file
├── templates/                  # HTML templates
├── static/                     # CSS and JS files
└── credentials/                # Google credentials (gitignored)
```

## Data Model

The application uses 4 Google Sheets:

1. **Users**: username, display_name, created_at
2. **Questions**: question_id, year, question_text, created_by, created_at, is_active
3. **Predictions**: prediction_id, question_id, username, year, answer, confidence, notes, created_at, updated_at
4. **Results**: question_id, year, actual_answer, resolved_at, resolved_by

## Security Notes

- Never commit `config.yaml` or `credentials/` to version control
- Use a strong random string for `secret_key` in production
- Consider adding password authentication for production use
- The service account has editor access to the spreadsheet

## Troubleshooting

### "Configuration file not found"
- Make sure you created `config.yaml` from `config.yaml.example`

### "Unable to connect to Google Sheets"
- Verify the service account JSON file is in `credentials/`
- Check that the spreadsheet is shared with the service account email
- Ensure Google Sheets API is enabled in Google Cloud Console

### "Permission denied" errors
- Verify the service account has Editor permissions on the spreadsheet
- Check that credentials file path in config.yaml is correct

## Deployment

For production deployment:

1. Set `debug: false` in config.yaml
2. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
3. Consider using a reverse proxy (nginx)
4. Set up HTTPS
5. Use environment variables for sensitive config

## License

This project is provided as-is for personal use.
