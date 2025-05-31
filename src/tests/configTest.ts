import { signup } from '@/services/authService';

export async function testConfigurations() {
  try {
    // Test user signup
    const testUser = {
      email: 'test@example.com',
      password: 'testPassword123',
      name: 'Test User',
      role: 'user' as const
    };

    const signupResult = await signup(testUser);
    console.log('User signup test successful:', signupResult);

    return true;
  } catch (error) {
    console.error('Configuration test failed:', error);
    return false;
  }
}

// Run the tests
console.log('Starting configuration tests...\n');
testConfigurations(); 