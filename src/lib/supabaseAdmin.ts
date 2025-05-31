import { createClient } from '@supabase/supabase-js';

// Use the same hardcoded values as in supabase.ts
const supabaseUrl = 'https://ibequhbgpdbjipilquoj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZXF1aGJncGRiamlwaWxxdW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTI1NTQ4OSwiZXhwIjoyMDYwODMxNDg5fQ.25vrcqZodPVSjVAgexqhWAhUq2o1IsAqOQyERjgNG-I';

// Detailed debug logging
console.log('Supabase Admin Configuration:', {
  url: supabaseUrl,
  serviceKeyLength: supabaseServiceKey.length,
  serviceKeyStart: supabaseServiceKey.substring(0, 20),
  serviceKeyEnd: supabaseServiceKey.substring(supabaseServiceKey.length - 20)
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 