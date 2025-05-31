-- Add country and phone number fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS country_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_country_code TEXT;

-- Create index for phone number search
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON public.users(phone_number);

-- Update RLS policies to allow users to update their contact info
CREATE POLICY "Users can update their contact info"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        (
            (NEW.country_code IS NULL OR NEW.country_code ~ '^[A-Z]{2}$') AND
            (NEW.phone_number IS NULL OR NEW.phone_number ~ '^\+?[0-9\s-()]{6,20}$')
        )
    ); 