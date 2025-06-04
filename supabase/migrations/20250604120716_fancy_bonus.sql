/*
  # Create initial database schema for ComPAWnion app

  1. New Tables
    - `user_pets`
      - `user_id` (uuid, primary key, references auth.users.id)
      - `pet_id` (text, not null)
      - `custom_tips` (text array, default empty array)
      - `happiness` (integer, default 50)
      - `created_at` (timestamptz, default now())
    - `todos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users.id)
      - `text` (text, not null)
      - `completed` (boolean, default false)
      - `category` (text, not null)
      - `due_date` (date, nullable)
      - `created_at` (timestamptz, default now())
    - `mood_entries`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, references auth.users.id)
      - `mood` (text, not null)
      - `notes` (text, default empty string)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
*/

-- Create user_pets table
CREATE TABLE IF NOT EXISTS user_pets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id TEXT NOT NULL,
  custom_tips TEXT[] DEFAULT '{}',
  happiness INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user_pets
CREATE POLICY "Users can view own pet"
  ON user_pets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pet"
  ON user_pets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pet"
  ON user_pets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for todos
CREATE POLICY "Users can view own todos"
  ON todos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos"
  ON todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
  ON todos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
  ON todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for mood_entries
CREATE POLICY "Users can view own mood entries"
  ON mood_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mood entries"
  ON mood_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  USING (auth.uid() = user_id);