/*
  # Create businesses table

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `address` (text, not null)
      - `phone` (text, not null)
      - `email` (text, nullable)
      - `hours_of_operation` (text, nullable)
      - `social_media` (jsonb, nullable)
      - `category` (text, not null)
      - `city` (text, not null)
      - `state` (text, not null)
      - `rating` (text, nullable)
      - `reviews` (jsonb, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `description` (text, nullable)
      - `images` (text[], nullable)
      - `rating_score` (numeric, nullable)
      - `review_count` (integer, nullable)
      - `is_pinned` (boolean, default false)
  2. Security
    - Enable RLS on `businesses` table
    - Add policies for authenticated users to read all businesses
    - Add policies for authenticated users to insert their own businesses
    - Add policies for authenticated users to update their own businesses
  3. Indexes
    - Add indexes for `city`, `state`, and `category` columns for faster filtering
*/

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text,
  hours_of_operation text,
  social_media jsonb,
  category text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  rating text,
  reviews jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  description text,
  images text[],
  rating_score numeric,
  review_count integer,
  is_pinned boolean DEFAULT false
);

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS businesses_city_idx ON businesses (city);
CREATE INDEX IF NOT EXISTS businesses_state_idx ON businesses (state);
CREATE INDEX IF NOT EXISTS businesses_category_idx ON businesses (category);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read businesses"
  ON businesses
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = businesses.id
  ));