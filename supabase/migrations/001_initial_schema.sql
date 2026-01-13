-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_type enum
CREATE TYPE question_type AS ENUM ('boolean', 'text', 'float');

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_type question_type NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  correct_answer_boolean BOOLEAN,
  correct_answer_text TEXT,
  correct_answer_float DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prediction_boolean BOOLEAN,
  prediction_text TEXT,
  prediction_float DOUBLE PRECISION,
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_questions_creator_id ON questions(creator_id);
CREATE INDEX idx_questions_resolved ON questions(resolved);
CREATE INDEX idx_questions_deadline ON questions(deadline);
CREATE INDEX idx_predictions_question_id ON predictions(question_id);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_is_correct ON predictions(is_correct);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions policies
CREATE POLICY "Authenticated users can view all questions"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create questions"
  ON questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

CREATE POLICY "Any authenticated user can resolve questions"
  ON questions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Predictions policies
CREATE POLICY "Users can view their own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view predictions for resolved questions"
  ON predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = predictions.question_id
      AND questions.resolved = TRUE
    )
  );

CREATE POLICY "Authenticated users can create predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions if question not resolved"
  ON predictions FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = predictions.question_id
      AND questions.resolved = TRUE
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
