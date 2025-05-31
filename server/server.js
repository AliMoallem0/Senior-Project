const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Load city hotspots data
const cityHotspotsPath = path.join(__dirname, 'cityHotspots.json');
let cityHotspots = {};

if (fs.existsSync(cityHotspotsPath)) {
  try {
    const data = fs.readFileSync(cityHotspotsPath, 'utf8');
    cityHotspots = JSON.parse(data);
  } catch (error) {
    console.error('Error loading city hotspots data:', error);
  }
} else {
  // Default city hotspots if file doesn't exist
  cityHotspots = {
    'Barcelona': [
      { id: 'bcn-1', name: 'Sagrada Familia', coordinates: { lat: 41.4036, lon: 2.1744 } },
      { id: 'bcn-2', name: 'La Rambla', coordinates: { lat: 41.3797, lon: 2.1746 } },
      { id: 'bcn-3', name: 'Plaça Catalunya', coordinates: { lat: 41.3874, lon: 2.1686 } },
      { id: 'bcn-4', name: 'Park Güell', coordinates: { lat: 41.4145, lon: 2.1527 } },
      { id: 'bcn-5', name: 'Barceloneta Beach', coordinates: { lat: 41.3807, lon: 2.1892 } },
      { id: 'bcn-6', name: 'Camp Nou', coordinates: { lat: 41.3809, lon: 2.1228 } },
      { id: 'bcn-7', name: 'Montjuïc', coordinates: { lat: 41.3641, lon: 2.1587 } },
      { id: 'bcn-8', name: 'Gothic Quarter', coordinates: { lat: 41.3833, lon: 2.1777 } }
    ],
    // Add more cities as needed
  };
  
  // Save the default data
  fs.writeFileSync(cityHotspotsPath, JSON.stringify(cityHotspots, null, 2));
}

// Helper function to get city hotspots
const getCityHotspots = (cityName) => {
  const city = Object.keys(cityHotspots).find(
    city => city.toLowerCase() === cityName.toLowerCase()
  );
  
  if (city && cityHotspots[city]) {
    return cityHotspots[city];
  }
  
  // Return Barcelona as default
  return cityHotspots['Barcelona'] || [];
};

// Endpoint to get traffic data
app.get('/api/traffic/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const hotspots = getCityHotspots(city);
    
    // Create origins and destinations strings for the API
    const origins = hotspots.map(spot => `${spot.coordinates.lat},${spot.coordinates.lon}`);
    const destinations = [...origins]; // Same points for a full matrix
    
    // Call Google Maps Distance Matrix API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: origins.join('|'),
          destinations: destinations.join('|'),
          mode: 'driving',
          departure_time: 'now',
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    // Process the response
    const data = response.data;
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API returned status: ${data.status}`);
    }
    
    // Process the response data similar to our client-side logic
    const hotspotsData = hotspots.map((hotspot, index) => {
      const row = data.rows[index];
      
      // If we don't have data for this hotspot, return null values
      if (!row || !row.elements || !row.elements[index] || row.elements[index].status !== 'OK') {
        return {
          id: hotspot.id,
          name: hotspot.name,
          congestion: null,
          currentSpeed: null,
          freeFlowSpeed: null,
          delay: null,
          coordinates: hotspot.coordinates
        };
      }
      
      // Get the element for the hotspot's own location (diagonal in the matrix)
      const element = row.elements[index];
      
      // Calculate congestion based on duration_in_traffic vs duration
      const durationInTraffic = element.duration_in_traffic?.value || element.duration.value;
      const durationWithoutTraffic = element.duration.value;
      
      // Calculate congestion as a percentage increase in travel time
      let congestion = 0;
      if (durationWithoutTraffic > 0) {
        congestion = Math.round(((durationInTraffic - durationWithoutTraffic) / durationWithoutTraffic) * 100);
        // Cap congestion at 100%
        congestion = Math.min(congestion, 100);
      }
      
      // Calculate speeds based on distance and time
      const distance = element.distance.value; // meters
      
      // Calculate speed in km/h
      let currentSpeed = 0;
      let freeFlowSpeed = 0;
      
      if (durationInTraffic > 0) {
        currentSpeed = Math.round((distance / durationInTraffic) * 3.6); // convert m/s to km/h
      }
      
      if (durationWithoutTraffic > 0) {
        freeFlowSpeed = Math.round((distance / durationWithoutTraffic) * 3.6); // convert m/s to km/h
      }
      
      // Calculate delay in seconds
      const delay = durationInTraffic - durationWithoutTraffic;
      
      return {
        id: hotspot.id,
        name: hotspot.name,
        congestion: congestion,
        currentSpeed: currentSpeed,
        freeFlowSpeed: freeFlowSpeed,
        delay: delay,
        coordinates: hotspot.coordinates
      };
    });
    
    // Filter out hotspots with no valid data
    const validHotspots = hotspotsData.filter(h => h.congestion !== null);
    
    // Calculate average values for the city
    let avgCongestion = 0;
    let avgCurrentSpeed = 0;
    let avgFreeFlowSpeed = 0;
    let avgDelay = 0;
    
    if (validHotspots.length > 0) {
      avgCongestion = Math.round(validHotspots.reduce((sum, h) => sum + (h.congestion || 0), 0) / validHotspots.length);
      avgCurrentSpeed = Math.round(validHotspots.reduce((sum, h) => sum + (h.currentSpeed || 0), 0) / validHotspots.length);
      avgFreeFlowSpeed = Math.round(validHotspots.reduce((sum, h) => sum + (h.freeFlowSpeed || 0), 0) / validHotspots.length);
      avgDelay = Math.round(validHotspots.reduce((sum, h) => sum + (h.delay || 0), 0) / validHotspots.length);
    }
    
    // Get incident data from another API call or simulate based on congestion
    const incidentCount = Math.floor((avgCongestion / 20) * (1 + Math.random()));
    const roadClosures = Math.floor(incidentCount / 3);
    
    // Generate incident details
    const incidentTypes = ['ACCIDENT', 'CONSTRUCTION', 'LANE_RESTRICTION', 'DISABLED_VEHICLE', 'ROAD_CLOSURE'];
    const roadNames = ['Main St', 'Central Ave', 'Broadway', 'Park Rd', 'Highway 1', 'Elm St', '5th Ave'];
    
    const incidentDetails = Array(incidentCount).fill(0).map((_, i) => ({
      id: `incident-${Date.now()}-${i}`,
      type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
      roadNumbers: [roadNames[Math.floor(Math.random() * roadNames.length)]],
      description: `Traffic incident affecting normal flow`,
      startTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      endTime: new Date(Date.now() + Math.floor(Math.random() * 7200000)).toISOString()
    }));
    
    // Return the processed data
    res.json({
      congestion: avgCongestion,
      delay: avgDelay,
      freeFlowSpeed: avgFreeFlowSpeed,
      currentSpeed: avgCurrentSpeed,
      roadClosures: roadClosures,
      incidents: incidentCount,
      lastUpdated: new Date().toISOString(),
      hotspots: hotspotsData,
      incidentDetails: incidentDetails
    });
    
  } catch (error) {
    console.error('Error fetching traffic data:', error.message);
    
    // Fall back to simulated data
    const { city } = req.params;
    const hotspots = getCityHotspots(city);
    
    // Generate simulated traffic data
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Base multiplier for congestion
    let congestionMultiplier = 1.0;
    
    // Rush hour patterns
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMorningRush = hour >= 7 && hour <= 9;
    const isEveningRush = hour >= 16 && hour <= 19;
    
    if (isWeekday && (isMorningRush || isEveningRush)) {
      congestionMultiplier = 1.5;
    } else if (isWeekday && (hour >= 10 && hour <= 15)) {
      congestionMultiplier = 0.8;
    } else if (!isWeekday) {
      congestionMultiplier = 0.7;
    }
    
    // City-specific characteristics
    if (city.toLowerCase().includes('new york')) {
      congestionMultiplier *= 1.3;
    } else if (city.toLowerCase().includes('london')) {
      congestionMultiplier *= 1.2;
    } else if (city.toLowerCase().includes('tokyo')) {
      congestionMultiplier *= 1.1;
    }
    
    // Generate hotspot data
    const hotspotsData = hotspots.map((hotspot, index) => {
      const baseFreeFlowSpeed = 50 + Math.floor(Math.random() * 30);
      const baseCongestion = 20 + Math.floor(Math.random() * 20);
      const congestion = Math.min(Math.round(baseCongestion * congestionMultiplier), 100);
      
      const speedReductionFactor = 1 - (congestion / 100);
      const currentSpeed = Math.round(baseFreeFlowSpeed * speedReductionFactor);
      const freeFlowSpeed = baseFreeFlowSpeed;
      
      const baseJourneyTime = 600;
      const delay = Math.round(baseJourneyTime * (congestion / 100));
      
      const positionFactor = 1 + (index < 3 ? 0.2 : (index < 5 ? 0.1 : 0));
      const hotspotCongestion = Math.min(Math.round(congestion * positionFactor), 100);
      
      return {
        id: hotspot.id,
        name: hotspot.name,
        congestion: hotspotCongestion,
        currentSpeed: currentSpeed,
        freeFlowSpeed: freeFlowSpeed,
        delay: delay,
        coordinates: hotspot.coordinates
      };
    });
    
    // Calculate averages
    const avgCongestion = Math.round(hotspotsData.reduce((sum, h) => sum + h.congestion, 0) / hotspotsData.length);
    const avgCurrentSpeed = Math.round(hotspotsData.reduce((sum, h) => sum + h.currentSpeed, 0) / hotspotsData.length);
    const avgFreeFlowSpeed = Math.round(hotspotsData.reduce((sum, h) => sum + h.freeFlowSpeed, 0) / hotspotsData.length);
    const avgDelay = Math.round(hotspotsData.reduce((sum, h) => sum + h.delay, 0) / hotspotsData.length);
    
    // Generate incident information
    const incidentCount = Math.floor((avgCongestion / 20) * (1 + Math.random()));
    const roadClosures = Math.floor(incidentCount / 3);
    
    const incidentTypes = ['ACCIDENT', 'CONSTRUCTION', 'LANE_RESTRICTION', 'DISABLED_VEHICLE', 'ROAD_CLOSURE'];
    const roadNames = ['Main St', 'Central Ave', 'Broadway', 'Park Rd', 'Highway 1', 'Elm St', '5th Ave'];
    
    const incidentDetails = Array(incidentCount).fill(0).map((_, i) => ({
      id: `incident-${Date.now()}-${i}`,
      type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
      roadNumbers: [roadNames[Math.floor(Math.random() * roadNames.length)]],
      description: `Traffic incident affecting normal flow`,
      startTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      endTime: new Date(Date.now() + Math.floor(Math.random() * 7200000)).toISOString()
    }));
    
    // Return simulated data with a note
    res.json({
      congestion: avgCongestion,
      delay: avgDelay,
      freeFlowSpeed: avgFreeFlowSpeed,
      currentSpeed: avgCurrentSpeed,
      roadClosures: roadClosures,
      incidents: incidentCount,
      lastUpdated: new Date().toISOString(),
      hotspots: hotspotsData,
      incidentDetails: incidentDetails,
      isSimulated: true,
      errorMessage: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Traffic API server running on port ${PORT}`);
});
