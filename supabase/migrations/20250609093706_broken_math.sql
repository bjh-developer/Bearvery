/*
  # Create gamification system tables

  1. New Tables
    - `user_progress`
      - `user_id` (uuid, primary key, references auth.users.id)
      - `level` (integer, default 1)
      - `experience_points` (integer, default 0)
      - `total_tasks_completed` (integer, default 0)
      - `streak_days` (integer, default 0)
      - `last_activity_date` (date)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `badge_id` (text, not null)
      - `earned_at` (timestamptz, default now())
    - `user_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `reward_type` (text, not null)
      - `reward_data` (jsonb)
      - `claimed` (boolean, default false)
      - `earned_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
*/

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_data JSONB DEFAULT '{}',
  claimed BOOLEAN DEFAULT false,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for user_badges
CREATE POLICY "Users can view own badges"
  ON user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_rewards
CREATE POLICY "Users can view own rewards"
  ON user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rewards"
  ON user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON user_rewards
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();