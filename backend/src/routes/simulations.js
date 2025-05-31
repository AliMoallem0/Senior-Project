const express = require('express');
const router = express.Router();
const {
  saveSimulationResult,
  getSimulationResults
} = require('../services/dbService');

// Save simulation result
router.post('/', async (req, res) => {
  try {
    const id = await saveSimulationResult(req.body);
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error saving simulation result:', error);
    res.status(500).json({ error: 'Failed to save simulation result' });
  }
});

// Get simulation results by project ID
router.get('/:projectId', async (req, res) => {
  try {
    const results = await getSimulationResults(req.params.projectId);
    res.json(results);
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    res.status(500).json({ error: 'Failed to fetch simulation results' });
  }
});

module.exports = router; 