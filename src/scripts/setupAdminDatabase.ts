import { setupAdminDatabase } from '../lib/adminDatabase';

const runSetup = async () => {
  console.log('Starting admin database setup...');
  
  try {
    const success = await setupAdminDatabase();
    
    if (success) {
      console.log('✅ Admin database setup completed successfully');
    } else {
      console.error('❌ Admin database setup failed');
    }
  } catch (error) {
    console.error('❌ Error during admin database setup:', error);
  }
};

// Run the setup
runSetup(); 