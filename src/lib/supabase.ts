import { createClient } from '@supabase/supabase-js';

// Hardcoded configuration for debugging
const supabaseUrl = 'https://ibequhbgpdbjipilquoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZXF1aGJncGRiamlwaWxxdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNTU0ODksImV4cCI6MjA2MDgzMTQ4OX0.IWmRZuOliwWVNVC6rU8c2cDlbtM9lN7pvVMw8ktWGhY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZXF1aGJncGRiamlwaWxxdW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI1NTQ4OSwiZXhwIjoyMDYwODMxNDg5fQ.25vrcqZodPVSjVAgexqhWAhUq2o1IsAqOQyERjgNG-I';

// Detailed debug logging
console.log('Supabase Direct Configuration:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  keyLength: supabaseAnonKey.length,
  keyStart: supabaseAnonKey.substring(0, 20),
  keyEnd: supabaseAnonKey.substring(supabaseAnonKey.length - 20)
});

// Create regular Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window?.localStorage, // Use localStorage for session persistence
    storageKey: 'urban-sim-auth-token' // Custom storage key for the session
  }
});

// Create admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test both connections
const testConnections = async () => {
  try {
    // Test regular client
    const { data: regularData, error: regularError } = await supabase.auth.getSession();
    console.log('Regular Client Test:', {
      success: !regularError,
      hasSession: !!regularData?.session,
      error: regularError?.message
    });

    // Test admin client
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.getSession();
    console.log('Admin Client Test:', {
      success: !adminError,
      hasSession: !!adminData?.session,
      error: adminError?.message
    });

  } catch (err) {
    console.error('Connection Test Error:', err);
  }
};

// Run connection tests
testConnections();

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const configured = !!supabaseUrl && !!supabaseAnonKey && !!supabaseServiceKey;
  console.log('Supabase Configuration Status:', {
    configured,
    timestamp: new Date().toISOString()
  });
  return configured;
};

// Helper to check if a table exists
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
};
