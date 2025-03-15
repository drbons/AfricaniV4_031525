/*
  # Create posts table

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null, references auth.users)
      - `content` (text, not null)
      - `images` (text[], nullable)
      - `city` (text, not null)
      - `state` (text, not null)
      - `category` (text, nullable)
      - `likes` (integer, default 0)
      - `comments` (jsonb, nullable)
      - `shares` (integer, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `is_pinned` (boolean, default false)
      - `is_business_promotion` (boolean, default false)
      - `business_id` (uuid, nullable, references businesses)
  2. Security
    - Enable RLS on `posts` table
    - Add policies for authenticated users to read all posts
    - Add policies for authenticated users to insert their own posts
    - Add policies for authenticated users to update their own posts
  3. Indexes
    - Add indexes for `city`, `state`, and `category` columns for faster filtering
    - Add index for `user_id` for faster user-specific queries
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  content text NOT NULL,
  images text[],
  city text NOT NULL,
  state text NOT NULL,
  category text,
  likes integer DEFAULT 0,
  comments jsonb,
  shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_pinned boolean DEFAULT false,
  is_business_promotion boolean DEFAULT false,
  business_id uuid REFERENCES businesses
);

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS posts_city_idx ON posts (city);
CREATE INDEX IF NOT EXISTS posts_state_idx ON posts (state);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts (category);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts (user_id);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);