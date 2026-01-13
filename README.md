# Prediction Tracker

A web application for tracking yearly predictions with scoring and review capabilities. Users can create questions, make predictions with confidence levels, and track their accuracy over time.

## Features

- **Google Authentication**: Secure login via Google OAuth
- **Question Types**: Support for boolean (yes/no), text, and numeric predictions
- **Confidence Levels**: Each prediction includes a confidence percentage (default 50%)
- **Scoring System**: Automatic calculation of prediction accuracy
- **Leaderboard**: Compare your performance with other users
- **Dashboard**: Overview of your predictions, score, and upcoming deadlines
- **Multi-user Support**: Multiple users can make predictions on the same questions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Hosting**: Vercel

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier)
- A Vercel account (free tier)
- A Google Cloud Console account (for OAuth)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd prediction_app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public Key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the query
5. Verify that tables were created in **Database** → **Tables**

### 6. Set Up Google OAuth

#### In Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose "External" user type
   - Fill in app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs: Add `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - Save and copy Client ID and Client Secret

#### In Supabase:

1. Go to **Authentication** → **Providers**
2. Enable Google provider
3. Paste your Google Client ID and Client Secret
4. Save

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click **Deploy**

### 3. Update Google OAuth Redirect URI

After deployment, add your Vercel domain to Google OAuth:

1. Go to Google Cloud Console → **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add to Authorized redirect URIs:
   - `https://your-vercel-domain.vercel.app/api/auth/callback`
4. Save

### 4. Update Supabase Site URL

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set Site URL to: `https://your-vercel-domain.vercel.app`
3. Add to Redirect URLs: `https://your-vercel-domain.vercel.app/**`
4. Save

## Usage Guide

### Creating Questions

1. Click **Create Question** from the dashboard or questions page
2. Enter a question title (e.g., "Will Bitcoin reach $100k by end of 2026?")
3. Select question type:
   - **Boolean**: Yes/No questions
   - **Text**: Text-based answers
   - **Number**: Numeric answers
4. Optionally set a deadline
5. Click **Create Question**

### Making Predictions

1. Navigate to a question (from dashboard, questions list, or my predictions)
2. Enter your prediction based on the question type
3. Adjust your confidence level (0-100%, default 50%)
4. Click **Submit Prediction**
5. You can update your prediction until the question is resolved

### Resolving Questions

1. Any authenticated user can resolve questions
2. Navigate to the question detail page
3. Click **Resolve** (available for questions past their deadline)
4. Enter the correct answer
5. For text/number questions, manually mark each prediction as correct/incorrect
6. Click **Resolve Question**
7. All predictions are automatically scored

### Viewing Scores

- **Dashboard**: See your overall score and stats
- **My Predictions**: View all your predictions with results
- **Leaderboard**: Compare your score with all users

## Database Schema

### profiles
- User profile information synced with auth.users
- Stores display name and avatar

### questions
- Question data with type, deadline, and resolution status
- Links to creator profile

### predictions
- User predictions on questions
- Includes prediction value, confidence, and correctness
- Unique constraint: one prediction per user per question

## Project Structure

```
prediction_app/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── questions/         # Question pages
│   ├── my-predictions/    # User predictions page
│   ├── leaderboard/       # Leaderboard page
│   └── login/             # Login page
├── components/            # React components
│   └── ui/               # UI components
├── lib/                  # Utilities and types
│   ├── supabase/        # Supabase client config
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Helper functions
└── supabase/            # Database migrations
```

## Troubleshooting

### "Not authenticated" errors
- Ensure Google OAuth is properly configured
- Check that redirect URIs match exactly
- Clear browser cookies and try again

### Database errors
- Verify migration was run successfully
- Check RLS policies in Supabase
- Ensure environment variables are correct

### Build fails on Vercel
- Check build logs for specific errors
- Ensure all environment variables are set
- Verify Node.js version compatibility

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
