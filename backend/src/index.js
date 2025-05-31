require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./services/dbService');
const userRoutes = require('./routes/users');
const simulationRoutes = require('./routes/simulations');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/simulations', simulationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Urban Simulation API is running' });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 