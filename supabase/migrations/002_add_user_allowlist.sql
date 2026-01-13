-- Create allowed_users table
CREATE TABLE allowed_users (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if they're in the allowlist
CREATE POLICY "Anyone can check allowlist"
  ON allowed_users FOR SELECT
  USING (true);

-- Policy: Only check for own email (optional, more restrictive)
-- Uncomment if you want users to only see their own entry
-- DROP POLICY "Anyone can check allowlist" ON allowed_users;
-- CREATE POLICY "Users can check their own allowlist status"
--   ON allowed_users FOR SELECT
--   USING (email = auth.jwt()->>'email');

-- Update the handle_new_user function to check allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user's email is in allowlist
  IF NOT EXISTS (SELECT 1 FROM allowed_users WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Access denied: Email % is not authorized. Please contact the administrator.', NEW.email;
  END IF;

  -- Create profile for allowed user
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add your initial allowed users here
-- Replace with your actual email addresses
INSERT INTO allowed_users (email, notes) VALUES
  ('parting.benjamin@gmail.com', 'Admin - Initial setup')
ON CONFLICT (email) DO NOTHING;

-- You can add more users by running:
-- INSERT INTO allowed_users (email, notes) VALUES ('newuser@example.com', 'Reason for access');
