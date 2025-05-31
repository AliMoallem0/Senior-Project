import { testConnection, closeConnection } from '@/services/dbService';
import { signup } from '@/services/authService';
import { saveSimulationResult } from '@/services/cityService';
import { getWeatherData } from '@/services/weatherService';
import { getCities, createProject } from '@/services/cityService';

export async function createTestData() {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connection successful');

    // Create test users
    const users = [
      {
        email: 'admin@urbansim.com',
        password: 'Admin123!',
        name: 'Admin User',
        role: 'admin' as const
      },
      {
        email: 'user@urbansim.com',
        password: 'User123!',
        name: 'Regular User',
        role: 'user' as const
      }
    ];

    for (const user of users) {
      const signupResult = await signup(user);
      console.log(`Created user: ${user.email}`);
    }

    // Create test simulation project
    const project = {
      user_id: 'test-user-id',
      city_id: 'test-city-1',
      name: 'Test Simulation Project',
      type: 'traffic',
      description: 'Test project for database verification',
      location: 'Test City',
      goals: 'Test goals',
      parameters: {
        roads: 100,
        population: 100000,
        housing: 50000,
        publicTransport: 50
      }
    };

    const projectResult = await createProject(project);
    console.log('Created simulation project');

    // Create test simulation result
    const simulationResult = {
      project_id: projectResult.id,
      congestion: 0.5,
      satisfaction: 0.8,
      emissions: 0.3,
      transitUsage: 0.6
    };

    const result = await saveSimulationResult(simulationResult);
    console.log('Created simulation result');

    // Get weather data for test city
    const weatherData = await getWeatherData('Test City');
    console.log('Retrieved weather data:', weatherData);

    // Get cities list
    const cities = await getCities();
    console.log('Retrieved cities:', cities);

    // Close the database connection
    const closed = await closeConnection();
    if (!closed) {
      console.warn('Warning: Database connection may not have closed properly');
    }

    console.log('\nTest data creation completed successfully!');
    return true;
  } catch (error) {
    console.error('Test data creation failed:', error);
    return false;
  }
}

// Run the test data creation
console.log('Starting test data creation...\n');
createTestData(); 