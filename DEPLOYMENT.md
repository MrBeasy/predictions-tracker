# Deploying to Google Cloud Run

This guide will help you deploy the Predictions Tracker app to Google Cloud Run (free tier).

## Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com (requires credit card but won't charge for free tier)
2. **gcloud CLI**: Install from https://cloud.google.com/sdk/docs/install

## Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create predictions-tracker-app --name="Predictions Tracker"

# Set the project as default
gcloud config set project predictions-tracker-app

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## Step 2: Prepare Configuration

### Update config.yaml

Make sure your `config.yaml` has production settings:

```yaml
app:
  secret_key: "YOUR-RANDOM-SECRET-KEY-HERE"  # Generate a strong random key
  debug: false

firebase:
  credentials_path: "credentials/firebase-service-account.json"

app_settings:
  current_year: 2026
  admin_usernames:
    - "your-admin-username"
```

### Store Firebase Credentials as Secret

```bash
# Create a secret for Firebase credentials
gcloud secrets create firebase-credentials --data-file="credentials/firebase-service-account.json"

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding firebase-credentials \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Note: Replace `PROJECT_NUMBER` with your actual project number (find it with `gcloud projects describe predictions-tracker-app --format="value(projectNumber)"`)

## Step 3: Build and Deploy

### Option A: Deploy from local (recommended for first deployment)

```bash
# Build and deploy in one command
gcloud run deploy predictions-tracker \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-secrets="credentials/firebase-service-account.json=firebase-credentials:latest"
```

### Option B: Build Docker image manually then deploy

```bash
# Set your project ID
export PROJECT_ID=predictions-tracker-app

# Build the Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/predictions-tracker

# Deploy the image
gcloud run deploy predictions-tracker \
  --image gcr.io/$PROJECT_ID/predictions-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-secrets="credentials/firebase-service-account.json=firebase-credentials:latest"
```

## Step 4: Configure Environment Variables

If you need to set additional environment variables:

```bash
gcloud run services update predictions-tracker \
  --region us-central1 \
  --set-env-vars="CURRENT_YEAR=2026"
```

## Step 5: Access Your App

After deployment, you'll get a URL like:
```
https://predictions-tracker-RANDOM-HASH-uc.a.run.app
```

Share this URL with your users!

## Updating the App

When you make changes, redeploy with:

```bash
gcloud run deploy predictions-tracker \
  --source . \
  --platform managed \
  --region us-central1
```

## Monitoring and Logs

```bash
# View logs
gcloud run services logs read predictions-tracker --region us-central1

# View service details
gcloud run services describe predictions-tracker --region us-central1
```

## Free Tier Limits

Your app should stay within these limits for free:
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds
- 1 GB egress

## Troubleshooting

### Service won't start
```bash
# Check logs for errors
gcloud run services logs read predictions-tracker --region us-central1 --limit 50

# Verify secrets are mounted
gcloud run services describe predictions-tracker --region us-central1 --format="value(spec.template.spec.containers[0].volumeMounts)"
```

### Firebase connection fails
- Verify the secret contains valid JSON credentials
- Check that service account has Firestore permissions in Firebase Console

### Port binding errors
- Cloud Run expects apps to listen on port 8080 (this is configured in Dockerfile)

## Security Best Practices

1. Never commit `config.yaml` or credential files to Git
2. Use different Firebase projects for dev/prod
3. Rotate your `secret_key` regularly
4. Monitor Cloud Run logs for suspicious activity
5. Consider adding authentication if the app contains sensitive data

## Cost Monitoring

Set up billing alerts:
```bash
# Create a budget alert (optional but recommended)
gcloud billing budgets create --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Predictions Tracker Budget" \
  --budget-amount=5USD
```

## Rolling Back

If something goes wrong:
```bash
# List revisions
gcloud run revisions list --service predictions-tracker --region us-central1

# Rollback to previous revision
gcloud run services update-traffic predictions-tracker \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1
```
