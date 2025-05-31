-- Function to create admin_logs table
CREATE OR REPLACE FUNCTION create_admin_logs_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Enable RLS
  ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Admins can view all logs"
    ON public.admin_logs
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );

  CREATE POLICY "Admins can insert logs"
    ON public.admin_logs
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs(admin_id);
  CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs(created_at);

  -- Grant access
  GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
END;
$$;

-- Function to create admin_settings table
CREATE OR REPLACE FUNCTION create_admin_settings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Enable RLS
  ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Admins can view all settings"
    ON public.admin_settings
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );

  CREATE POLICY "Admins can update settings"
    ON public.admin_settings
    FOR UPDATE
    USING (
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );

  CREATE POLICY "Admins can insert settings"
    ON public.admin_settings
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );

  -- Create index
  CREATE INDEX IF NOT EXISTS admin_settings_key_idx ON public.admin_settings(key);

  -- Grant access
  GRANT SELECT, INSERT, UPDATE ON public.admin_settings TO authenticated;
END;
$$;

-- Function to add admin columns to users table
CREATE OR REPLACE FUNCTION add_admin_columns_to_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_admin_action TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;
END;
$$; 