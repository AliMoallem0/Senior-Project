const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  cityName: {
    type: String,
    required: true
  },
  parameters: {
    roads: {
      type: Number,
      required: true
    },
    population: {
      type: Number,
      required: true
    },
    housing: {
      type: Number,
      required: true
    },
    publicTransport: {
      type: Number,
      required: true
    }
  },
  results: {
    congestion: {
      type: Number,
      required: true
    },
    satisfaction: {
      type: Number,
      required: true
    },
    emissions: {
      type: Number,
      required: true
    },
    transitUsage: {
      type: Number,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SimulationResult', simulationResultSchema); 