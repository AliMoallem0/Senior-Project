import { toast } from "@/components/ui/use-toast";

// API keys for traffic services
export const TOMTOM_API_KEY = 'NyZAxGq694j1vqAnZAHriQmElnsG94IC';

// NOTE: Google Maps API integration has been moved to googleTrafficService.ts
// Keeping these variables for backward compatibility
export const USE_GOOGLE_MAPS_API = true;
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Check if API keys are valid
if (!TOMTOM_API_KEY) {
  console.error('TomTom API key is not configured');
  toast({
    title: "Configuration Error",
    description: "TomTom API key is not configured. Traffic data may not be available.",
    variant: "destructive"
  });
}

// TomTom API endpoints
export const API_BASE_URL = 'https://api.tomtom.com/traffic';
export const API_VERSION = '4';

export const TOMTOM_ENDPOINTS = {
  flowSegment: (lat: number, lon: number) => 
    `${API_BASE_URL}/services/${API_VERSION}/flowSegmentData/relative/10/json?key=${TOMTOM_API_KEY}&point=${lat},${lon}`,
  incidents: (lat: number, lon: number) =>
    `${API_BASE_URL}/services/${API_VERSION}/incidentDetails/s3/${lat},${lon}/10.json?key=${TOMTOM_API_KEY}`,
  trafficFlow: (z: string | number, x: string | number, y: string | number) =>
    `${API_BASE_URL}/map/${API_VERSION}/tile/flow/absolute/${z}/${x}/${y}.png?key=${TOMTOM_API_KEY}&style=relative&tileSize=256`,
  trafficIncidents: (z: string | number, x: string | number, y: string | number) =>
    `${API_BASE_URL}/map/${API_VERSION}/tile/incidents/s1/${z}/${x}/${y}.png?key=${TOMTOM_API_KEY}`
};

// Define Dubai's major hotspots
export const DUBAI_HOTSPOTS = [
  {
    id: 1,
    name: "Sheikh Zayed Road",
    coordinates: { lat: 25.2048, lon: 55.2708 }
  },
  {
    id: 2,
    name: "Dubai Mall",
    coordinates: { lat: 25.1972, lon: 55.2796 }
  },
  {
    id: 3,
    name: "Palm Jumeirah",
    coordinates: { lat: 25.1124, lon: 55.1390 }
  },
  {
    id: 4,
    name: "Dubai Marina",
    coordinates: { lat: 25.0805, lon: 55.1403 }
  },
  {
    id: 5,
    name: "Burj Khalifa Boulevard",
    coordinates: { lat: 25.1916, lon: 55.2764 }
  },
  {
    id: 6,
    name: "Al Khail Road",
    coordinates: { lat: 25.1551, lon: 55.2640 }
  },
  {
    id: 7,
    name: "Deira City Centre",
    coordinates: { lat: 25.2532, lon: 55.3311 }
  },
  {
    id: 8,
    name: "Business Bay",
    coordinates: { lat: 25.1865, lon: 55.2806 }
  }
];

// Define New York City's major hotspots
export const NEW_YORK_HOTSPOTS = [
  {
    id: 1,
    name: "Times Square",
    coordinates: { lat: 40.7580, lon: -73.9855 }
  },
  {
    id: 2,
    name: "Brooklyn Bridge",
    coordinates: { lat: 40.7061, lon: -73.9969 }
  },
  {
    id: 3,
    name: "Central Park",
    coordinates: { lat: 40.7812, lon: -73.9665 }
  },
  {
    id: 4,
    name: "Grand Central",
    coordinates: { lat: 40.7527, lon: -73.9772 }
  },
  {
    id: 5,
    name: "Lincoln Tunnel",
    coordinates: { lat: 40.7588, lon: -74.0156 }
  },
  {
    id: 6,
    name: "Queens Midtown Tunnel",
    coordinates: { lat: 40.7432, lon: -73.9421 }
  },
  {
    id: 7,
    name: "FDR Drive",
    coordinates: { lat: 40.7712, lon: -73.9713 }
  },
  {
    id: 8,
    name: "Wall Street",
    coordinates: { lat: 40.7066, lon: -74.0090 }
  }
];

// Define London's major hotspots
export const LONDON_HOTSPOTS = [
  {
    id: 1,
    name: "Piccadilly Circus",
    coordinates: { lat: 51.510, lon: -0.1350 }
  },
  {
    id: 2,
    name: "Tower Bridge",
    coordinates: { lat: 51.5055, lon: -0.0754 }
  },
  {
    id: 3,
    name: "Trafalgar Square",
    coordinates: { lat: 51.5080, lon: -0.1281 }
  },
  {
    id: 4,
    name: "Oxford Circus",
    coordinates: { lat: 51.5154, lon: -0.1416 }
  },
  {
    id: 5,
    name: "London Bridge",
    coordinates: { lat: 51.5079, lon: -0.0877 }
  },
  {
    id: 6,
    name: "Waterloo Bridge",
    coordinates: { lat: 51.5079, lon: -0.1171 }
  },
  {
    id: 7,
    name: "Hyde Park Corner",
    coordinates: { lat: 51.5026, lon: -0.1523 }
  },
  {
    id: 8,
    name: "Canary Wharf",
    coordinates: { lat: 51.5057, lon: -0.0253 }
  }
];

// Define Tokyo's major hotspots
export const TOKYO_HOTSPOTS = [
  { id: 1, name: "Shibuya Crossing", coordinates: { lat: 35.6591, lon: 139.7005 } },
  { id: 2, name: "Tokyo Station", coordinates: { lat: 35.6812, lon: 139.7671 } },
  { id: 3, name: "Shinjuku Station", coordinates: { lat: 35.6896, lon: 139.7006 } },
  { id: 4, name: "Roppongi", coordinates: { lat: 35.6627, lon: 139.7307 } },
  { id: 5, name: "Rainbow Bridge", coordinates: { lat: 35.6376, lon: 139.76 } },
  { id: 6, name: "Ueno Station", coordinates: { lat: 35.7141, lon: 139.7774 } },
  { id: 7, name: "Ginza", coordinates: { lat: 35.6721, lon: 139.7636 } },
  { id: 8, name: "Imperial Palace", coordinates: { lat: 35.6852, lon: 139.7528 } }
];

// Define Singapore's major hotspots
export const SINGAPORE_HOTSPOTS = [
  { id: 1, name: "Marina Bay Sands", coordinates: { lat: 1.2838, lon: 103.8591 } },
  { id: 2, name: "Orchard Road", coordinates: { lat: 1.3038, lon: 103.8318 } },
  { id: 3, name: "Raffles Place", coordinates: { lat: 1.2847, lon: 103.8514 } },
  { id: 4, name: "Sentosa Gateway", coordinates: { lat: 1.2540, lon: 103.8240 } },
  { id: 5, name: "Changi Airport", coordinates: { lat: 1.3644, lon: 103.9915 } },
  { id: 6, name: "Woodlands Checkpoint", coordinates: { lat: 1.4507, lon: 103.7677 } },
  { id: 7, name: "Tuas Checkpoint", coordinates: { lat: 1.3416, lon: 103.6351 } },
  { id: 8, name: "Bugis Junction", coordinates: { lat: 1.3001, lon: 103.8555 } }
];

// Define Barcelona's major hotspots
export const BARCELONA_HOTSPOTS = [
  { id: 1, name: "Sagrada Familia", coordinates: { lat: 41.4036, lon: 2.1744 } },
  { id: 2, name: "La Rambla", coordinates: { lat: 41.3797, lon: 2.1746 } },
  { id: 3, name: "Plaça Catalunya", coordinates: { lat: 41.3874, lon: 2.1686 } },
  { id: 4, name: "Park Güell", coordinates: { lat: 41.4145, lon: 2.1527 } },
  { id: 5, name: "Barceloneta Beach", coordinates: { lat: 41.3803, lon: 2.1893 } },
  { id: 6, name: "Camp Nou", coordinates: { lat: 41.3809, lon: 2.1228 } },
  { id: 7, name: "Montjuïc", coordinates: { lat: 41.3641, lon: 2.1578 } },
  { id: 8, name: "Gothic Quarter", coordinates: { lat: 41.3833, lon: 2.1769 } }
];

// Define Sydney's major hotspots
export const SYDNEY_HOTSPOTS = [
  { id: 1, name: "Sydney Opera House", coordinates: { lat: -33.8568, lon: 151.2153 } },
  { id: 2, name: "Sydney Harbour Bridge", coordinates: { lat: -33.8523, lon: 151.2107 } },
  { id: 3, name: "Circular Quay", coordinates: { lat: -33.8609, lon: 151.2098 } },
  { id: 4, name: "Bondi Beach", coordinates: { lat: -33.8914, lon: 151.2766 } },
  { id: 5, name: "Darling Harbour", coordinates: { lat: -33.8731, lon: 151.1998 } },
  { id: 6, name: "The Rocks", coordinates: { lat: -33.8598, lon: 151.2093 } },
  { id: 7, name: "Manly Beach", coordinates: { lat: -33.7971, lon: 151.2879 } },
  { id: 8, name: "Taronga Zoo", coordinates: { lat: -33.8434, lon: 151.2428 } }
];

// Define San Francisco's major hotspots
export const SANFRANCISCO_HOTSPOTS = [
  { id: 1, name: "Golden Gate Bridge", coordinates: { lat: 37.8199, lon: -122.4783 } },
  { id: 2, name: "Market Street", coordinates: { lat: 37.7749, lon: -122.4194 } },
  { id: 3, name: "Union Square", coordinates: { lat: 37.7879, lon: -122.4074 } },
  { id: 4, name: "Fisherman's Wharf", coordinates: { lat: 37.8080, lon: -122.4177 } },
  { id: 5, name: "Bay Bridge", coordinates: { lat: 37.7983, lon: -122.3778 } },
  { id: 6, name: "Lombard Street", coordinates: { lat: 37.8021, lon: -122.4187 } },
  { id: 7, name: "Twin Peaks", coordinates: { lat: 37.7544, lon: -122.4477 } },
  { id: 8, name: "Chinatown", coordinates: { lat: 37.7941, lon: -122.4078 } }
];

// Traffic data interface
export interface TrafficIncident {
  id: string;
  type: string;
  roadNumbers?: string[];
  from?: string;
  to?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

export interface TrafficData {
  congestion: number;
  delay: number;
  freeFlowSpeed: number;
  currentSpeed: number;
  roadClosures: number;
  incidents: number;
  lastUpdated: string;
  hotspots: {
    id: number;
    name: string;
    congestion: number | null;
    currentSpeed: number | null;
    freeFlowSpeed: number | null;
    delay: number | null;
    coordinates: { lat: number; lon: number };
  }[];
  incidentDetails?: TrafficIncident[];
}

// Default mock data for testing (this will be replaced by real data from Google Maps)
export const mockTrafficData: TrafficData = {
  congestion: 50,
  delay: 300,
  freeFlowSpeed: 60,
  currentSpeed: 30,
  roadClosures: 2,
  incidents: 5,
  lastUpdated: new Date().toISOString(),
  hotspots: DUBAI_HOTSPOTS.map(spot => ({
    ...spot,
    congestion: Math.floor(Math.random() * 100),
    currentSpeed: 20 + Math.floor(Math.random() * 40),
    freeFlowSpeed: 50 + Math.floor(Math.random() * 30),
    delay: Math.floor(Math.random() * 500),
  })),
  incidentDetails: []
};

/**
 * Helper function to get city hotspots
 */
export const getCityHotspots = (cityName: string) => {
  let hotspots = DUBAI_HOTSPOTS;
  if (cityName.toLowerCase().includes('new york')) {
    hotspots = NEW_YORK_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('london')) {
    hotspots = LONDON_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('tokyo')) {
    hotspots = TOKYO_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('singapore')) {
    hotspots = SINGAPORE_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('barcelona')) {
    hotspots = BARCELONA_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('sydney')) {
    hotspots = SYDNEY_HOTSPOTS;
  } else if (cityName.toLowerCase().includes('san francisco')) {
    hotspots = SANFRANCISCO_HOTSPOTS;
  }
  return hotspots;
};
