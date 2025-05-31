import { supabaseAdmin } from '../lib/supabase';

async function createAdmin() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string) => new Promise<string>(resolve => readline.question(query, resolve));

  try {
    console.log('Creating admin user...');
    
    const email = await question('Enter email: ');
    const password = await question('Enter password: ');
    const name = await question('Enter name: ');

    // Create auth user
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

    console.log('✅ Admin user created successfully!');
    console.log('Please check your email for verification.');
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    readline.close();
  }
}

createAdmin(); 