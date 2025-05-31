-- Drop existing users table and its dependencies
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with proper structure for Supabase Auth
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policy for service role to insert users
CREATE POLICY "Service role can insert users"
    ON public.users
    FOR INSERT
    WITH CHECK (true);  -- Allow service role to insert

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Grant access to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated; 