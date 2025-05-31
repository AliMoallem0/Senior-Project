-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('completed', 'in-progress', 'planned')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    dark_mode BOOLEAN DEFAULT false,
    notifications BOOLEAN DEFAULT true,
    email_updates BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view their own projects"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements"
    ON public.achievements
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON public.achievements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
    ON public.achievements
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
    ON public.achievements
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON public.achievements(user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated; 