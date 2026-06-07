-- Run this in your Supabase SQL Editor to create the table and security policies

CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_api_key TEXT,
  stremio_addons JSONB DEFAULT '[]'::jsonb,
  stream_preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Turn on Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING ( auth.uid() = id );

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING ( auth.uid() = id );
