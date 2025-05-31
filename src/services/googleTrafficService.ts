import { toast } from "@/components/ui/use-toast";
import { TrafficData as OriginalTrafficData, getCityHotspots } from "./trafficService";

/**
 * Traffic API server URL - points to our Node.js proxy server
 */
const TRAFFIC_API_URL = "http://localhost:3001/api/traffic";

/**
 * Traffic data interfaces to maintain compatibility with existing code
 */
export interface TrafficData extends OriginalTrafficData {
  isSimulated?: boolean;        // Flag indicating if data is simulated
  errorMessage?: string;        // Error message if API call failed
}

/**
 * Get traffic data from our proxy server which calls the Google Maps API
 * Falls back to simulation if server is unavailable
 */
export const getGoogleTrafficData = async (cityName: string): Promise<TrafficData> => {
  try {
    console.log(`Fetching traffic data for ${cityName} from server...`);
    
    // Call our proxy server
    const response = await fetch(`${TRAFFIC_API_URL}/${encodeURIComponent(cityName)}`);
    
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if server returned simulated data
    if (data.isSimulated) {
      console.warn('Server returned simulated data:', data.errorMessage);
      toast({
        title: "Traffic Data Notice",
        description: "Using simulated traffic data. Server message: " + data.errorMessage,
        variant: "default"
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('Error connecting to traffic server:', error);
    // Removing the toast notification to prevent it from popping up
    // console.log('Using local traffic simulation instead');
    
    // Fall back to local simulation
    return generateSimulatedTrafficData(cityName);
  }
};

/**
 * Generate simulated traffic data based on time of day and city characteristics
 * Used as a fallback when server is unavailable
 */
const generateSimulatedTrafficData = (cityName: string): TrafficData => {
  const hotspots = getCityHotspots(cityName);
  console.log(`Generating local traffic simulation for ${cityName}...`);
  
  // Time-based traffic patterns
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
    congestionMultiplier = 1.5; // 50% more congestion during rush hours
  } else if (isWeekday && (hour >= 10 && hour <= 15)) {
    congestionMultiplier = 0.8; // 20% less congestion during midday
  } else if (!isWeekday) {
    congestionMultiplier = 0.7; // 30% less congestion on weekends
  }
  
  // City-specific adjustments
  if (cityName.toLowerCase().includes('new york')) {
    congestionMultiplier *= 1.3;
  } else if (cityName.toLowerCase().includes('london')) {
    congestionMultiplier *= 1.2;
  } else if (cityName.toLowerCase().includes('tokyo')) {
    congestionMultiplier *= 1.1;
  }
  
  // Generate data for each hotspot
  const hotspotsData = hotspots.map((hotspot, index) => {
    const baseFreeFlowSpeed = 50 + Math.floor(Math.random() * 30);
    const baseCongestion = 20 + Math.floor(Math.random() * 20);
    const congestion = Math.min(Math.round(baseCongestion * congestionMultiplier), 100);
    
    const speedReductionFactor = 1 - (congestion / 100);
    const currentSpeed = Math.round(baseFreeFlowSpeed * speedReductionFactor);
    const freeFlowSpeed = baseFreeFlowSpeed;
    
    const baseJourneyTime = 600; // seconds (10 minutes)
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
  
  // Generate incidents based on congestion
  const incidentCount = Math.floor((avgCongestion / 20) * (1 + Math.random()));
  const roadClosures = Math.floor(incidentCount / 3);
  
  // Create incident details
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
  
  return {
    congestion: avgCongestion,
    delay: avgDelay,
    freeFlowSpeed: avgFreeFlowSpeed,
    currentSpeed: avgCurrentSpeed,
    roadClosures: roadClosures,
    incidents: incidentCount,
    lastUpdated: new Date().toISOString(),
    hotspots: hotspotsData,
    incidentDetails: incidentDetails,
    isSimulated: true
  };
};

/**
 * Initialize real-time traffic updates for a specific city
 */
export const initializeGoogleTrafficUpdates = (cityName: string, onUpdate: (data: TrafficData) => void) => {
  let stopped = false;
  let interval: number | null = null;
  
  const fetchAndUpdate = async () => {
    try {
      const data = await getGoogleTrafficData(cityName);
      if (!stopped) onUpdate(data);
    } catch (error) {
      console.error('Error updating traffic data:', error);
    }
  };

  // Show a toast to inform the user about the traffic service
  toast({
    title: "Real-Time Traffic Active",
    description: "Fetching traffic data from our server. Updates every 30 seconds.",
  });

  fetchAndUpdate(); // Initial fetch
  
  // Set up interval for regular updates (every 30 seconds)
  interval = window.setInterval(fetchAndUpdate, 30000);
  
  // Return an object with a disconnect method to clean up
  return {
    disconnect: () => {
      stopped = true;
      if (interval !== null) {
        clearInterval(interval);
      }
    }
  };
};
