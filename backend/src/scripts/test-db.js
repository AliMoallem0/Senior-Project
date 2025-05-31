require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');

async function testDatabase() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Database connection successful!');

    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
      role: 'user'
    });
    console.log('Test user created:', testUser);

    // Create a test simulation
    const testSimulation = await SimulationResult.create({
      projectId: 'test-project-1',
      userId: testUser._id,
      cityName: 'Test City',
      parameters: {
        roads: 75,
        population: 60,
        housing: 80,
        publicTransport: 70
      },
      results: {
        congestion: 30,
        satisfaction: 85,
        emissions: 25,
        transitUsage: 65
      }
    });
    console.log('Test simulation created:', testSimulation);

    // Fetch and display all data
    const users = await User.find({}, { password: 0 });
    const simulations = await SimulationResult.find();
    
    console.log('\nAll Users:');
    console.log(users);
    console.log('\nAll Simulations:');
    console.log(simulations);

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDatabase(); 