-- Create the contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all contact submissions
CREATE POLICY "Admins can read all contact submissions" 
  ON contact_submissions 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow anyone to insert new contact submissions
CREATE POLICY "Anyone can insert contact submissions" 
  ON contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON contact_submissions (created_at DESC);
