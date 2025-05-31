import { supabaseAdmin } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

async function createAdminUser(email: string, password: string, name: string) {
  try {
    console.log('Creating admin user...');

    // First create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user data returned from signup');

    // Create database entry with admin role
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    console.log('Admin user created successfully:', email);
    toast({
      title: "Success",
      description: "Admin user created successfully. Please check your email for verification.",
    });

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to create admin user",
    });
    return { success: false, error };
  }
}

// Example usage:
// createAdminUser('admin@example.com', 'your-secure-password', 'Admin User'); 