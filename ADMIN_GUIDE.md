# Admin Guide - User Access Management

## Managing User Access

This app uses an email allowlist to restrict who can sign up and use the application.

### View Allowed Users

1. Go to your Supabase Dashboard
2. Click **Table Editor** → **allowed_users**
3. You'll see all allowed email addresses

### Add a New User

**In Supabase SQL Editor:**

```sql
INSERT INTO allowed_users (email, notes)
VALUES ('newuser@example.com', 'Reason for granting access');
```

**Or in Table Editor:**
1. Go to **Table Editor** → **allowed_users**
2. Click **Insert row**
3. Enter the email address
4. (Optional) Add notes about why they were granted access
5. Click **Save**

### Remove a User

**In Supabase SQL Editor:**

```sql
DELETE FROM allowed_users WHERE email = 'user@example.com';
```

**Or in Table Editor:**
1. Go to **Table Editor** → **allowed_users**
2. Find the email address
3. Click the **trash icon** on the right
4. Confirm deletion

**Note:** This only prevents new signups. If the user already has an account, they can still access it. To fully remove access, you also need to delete their profile:

```sql
-- Delete from profiles (this will also delete all their questions and predictions due to CASCADE)
DELETE FROM profiles WHERE email = 'user@example.com';
```

### Bulk Add Users

```sql
INSERT INTO allowed_users (email, notes) VALUES
  ('user1@example.com', 'Team member'),
  ('user2@example.com', 'Team member'),
  ('user3@example.com', 'External collaborator')
ON CONFLICT (email) DO NOTHING;
```

### View All Current Users

```sql
SELECT
  p.email,
  p.display_name,
  p.created_at,
  COUNT(DISTINCT q.id) as questions_created,
  COUNT(DISTINCT pr.id) as predictions_made
FROM profiles p
LEFT JOIN questions q ON q.creator_id = p.id
LEFT JOIN predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.email, p.display_name, p.created_at
ORDER BY p.created_at DESC;
```

## How It Works

1. When a user tries to sign in with Google, Supabase authenticates them
2. A database trigger (`handle_new_user`) automatically runs
3. The trigger checks if their email exists in the `allowed_users` table
4. If **YES**: A profile is created and they can use the app
5. If **NO**: The signup is rejected with an error message

## Initial Setup

The migration automatically adds your email (`parting.benjamin@gmail.com`) to the allowlist. Make sure to run the migration in Supabase!

## Emergency Access

If you accidentally lock yourself out:

1. Go to Supabase SQL Editor
2. Run:
```sql
INSERT INTO allowed_users (email, notes)
VALUES ('your-email@gmail.com', 'Emergency access')
ON CONFLICT (email) DO NOTHING;
```
