const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SimulationResult = require('../models/SimulationResult');
const { protect, authorize } = require('../middleware/auth');
const {
  createUser,
  findUserByEmail,
  updateUserLastLogin
} = require('../services/dbService');

// Test route to create a test user
router.post('/test/create', async (req, res) => {
  try {
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
      role: 'user'
    });

    res.json({
      success: true,
      data: testUser
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test user'
    });
  }
});

// Test route to view all collections (formatted)
router.get('/test/formatted', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    const simulations = await SimulationResult.find();
    
    // Format user data
    const formattedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    // Format simulation data
    const formattedSimulations = simulations.map(sim => ({
      cityName: sim.cityName,
      parameters: {
        roads: sim.parameters.roads + '%',
        population: sim.parameters.population + ' thousand',
        housing: sim.parameters.housing + ' units',
        publicTransport: sim.parameters.publicTransport + '%'
      },
      results: {
        congestion: sim.results.congestion + '%',
        satisfaction: sim.results.satisfaction + '%',
        emissions: sim.results.emissions + ' tons',
        transitUsage: sim.results.transitUsage + '%'
      },
      createdAt: sim.createdAt
    }));

    res.json({
      users: formattedUsers,
      simulations: formattedSimulations
    });
  } catch (error) {
    console.error('Error fetching formatted data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching formatted data'
    });
  }
});

// Protected route to get current user's data
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// Test route to create a test simulation
router.post('/test/simulation', async (req, res) => {
  try {
    const testSimulation = await SimulationResult.create({
      projectId: 'test-project-1',
      userId: 'test-user-1',
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

    res.json({
      success: true,
      data: testSimulation
    });
  } catch (error) {
    console.error('Error creating test simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test simulation'
    });
  }
});

// Admin route to view all users (protected and admin-only)
router.get('/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Find user by email
router.get('/email/:email', async (req, res) => {
  try {
    const user = await findUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ error: 'Failed to find user' });
  }
});

// Update user's last login
router.put('/:id/last-login', async (req, res) => {
  try {
    await updateUserLastLogin(req.params.id);
    res.status(200).json({ message: 'Last login updated successfully' });
  } catch (error) {
    console.error('Error updating last login:', error);
    res.status(500).json({ error: 'Failed to update last login' });
  }
});

module.exports = router; 