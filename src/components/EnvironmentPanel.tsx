import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BarChart3, 
  CloudRain, 
  ThermometerSun, 
  Droplets, 
  Wind, 
  Leaf, 
  PieChart,
  RefreshCw,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  Info,
  Volume2,
  Building,
  Trash2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Import our custom components
import EnvironmentMap from './EnvironmentMap';
import { 
  HistoricalTrendChart, 
  EnvironmentBarChart, 
  EnvironmentPieChart, 
  EnvironmentAreaChart,
  EnvironmentIndicatorCard
} from './EnvironmentCharts';

// Import the weather service
import { getWeatherData, WeatherData } from '@/services/weatherService';

interface EnvironmentalData {
  city: string;
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
    history: Array<{date: string; aqi: number}>
  };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    forecast: Array<{
      date: string;
      highTemp: number;
      lowTemp: number;
      condition: string;
    }>;
    alerts: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
  };
  urbanHeat: {
    averageTemperature: number;
    hotspots: Array<{
      lat: number;
      lng: number;
      temp: number;
      area: string;
    }>;
    greenSpaceImpact: number;
  };
  waterQuality: {
    drinkingWaterIndex: number;
    coastalWaterIndex?: number;
    treatmentFacilities: Array<{
      name: string;
      status: string;
      capacity: number;
    }>;
  };
  noise: {
    averageDecibels: number;
    timePatterns: Array<{
      time: string;
      level: number;
    }>;
    hotspots: Array<{
      lat: number;
      lng: number;
      level: number;
      area: string;
    }>;
  };
  sustainability: {
    carbonEmissions: number;
    renewablePercentage: number;
    wasteRecycling: number;
    landfillUsage: number;
  };
  greenSpace: {
    parksCoverage: number;
    treeCanopy: number;
    biodiversityIndex: number;
    parks: Array<{
      name: string;
      area: number;
      lat: number;
      lng: number;
    }>;
  };
}

// Mock data for development
const MOCK_ENVIRONMENTAL_DATA: Record<string, EnvironmentalData> = {
  "london": {
    city: "London",
    airQuality: {
      aqi: 45,
      pm25: 9.5,
      pm10: 18.2,
      o3: 40,
      no2: 38,
      so2: 6,
      co: 0.4,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aqi: 30 + Math.floor(Math.random() * 30)
      }))
    },
    weather: {
      temperature: 15,
      humidity: 78,
      windSpeed: 14,
      windDirection: "SW",
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        highTemp: 15 + Math.floor(Math.random() * 5),
        lowTemp: 8 + Math.floor(Math.random() * 5),
        condition: ["Rainy", "Overcast", "Partly Cloudy", "Cloudy"][Math.floor(Math.random() * 4)]
      })),
      alerts: [{
        type: "Rain",
        severity: "Moderate",
        description: "Periods of rain expected throughout the week"
      }]
    },
    urbanHeat: {
      averageTemperature: 14.5,
      hotspots: [
        { lat: 51.5074, lng: -0.1278, temp: 17.5, area: "City of London" },
        { lat: 51.5072, lng: -0.1275, temp: 16.8, area: "Westminster" },
        { lat: 51.5099, lng: -0.1337, temp: 16.2, area: "Covent Garden" }
      ],
      greenSpaceImpact: -1.8
    },
    waterQuality: {
      drinkingWaterIndex: 96,
      coastalWaterIndex: 72,
      treatmentFacilities: [
        { name: "Thames Water Treatment Works", status: "Operational", capacity: 92 },
        { name: "Lee Valley Treatment Plant", status: "Operational", capacity: 89 },
        { name: "Beckton Facility", status: "Upgrade in progress", capacity: 78 }
      ]
    },
    noise: {
      averageDecibels: 65,
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        level: i < 6 ? 45 + Math.floor(Math.random() * 8) : 
               i < 9 ? 67 + Math.floor(Math.random() * 12) : 
               i < 18 ? 62 + Math.floor(Math.random() * 10) : 
               i < 22 ? 68 + Math.floor(Math.random() * 12) : 
               50 + Math.floor(Math.random() * 10)
      })),
      hotspots: [
        { lat: 51.5074, lng: -0.1278, level: 78, area: "City of London" },
        { lat: 51.5007, lng: -0.1246, level: 75, area: "Heathrow Flight Path" },
        { lat: 51.5346, lng: -0.0743, level: 71, area: "Liverpool Street Station" }
      ]
    },
    sustainability: {
      carbonEmissions: 8.2,
      renewablePercentage: 39,
      wasteRecycling: 43,
      landfillUsage: 31
    },
    greenSpace: {
      parksCoverage: 47,
      treeCanopy: 21,
      biodiversityIndex: 5.8,
      parks: [
        { name: "Hyde Park", area: 142, lat: 51.5073, lng: -0.1657 },
        { name: "Regent's Park", area: 166, lat: 51.5313, lng: -0.1570 },
        { name: "Richmond Park", area: 955, lat: 51.4462, lng: -0.2696 }
      ]
    }
  },
  "paris": {
    city: "Paris",
    airQuality: {
      aqi: 52,
      pm25: 11.2,
      pm10: 19.5,
      o3: 46,
      no2: 42,
      so2: 5,
      co: 0.5,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aqi: 40 + Math.floor(Math.random() * 25)
      }))
    },
    weather: {
      temperature: 18,
      humidity: 65,
      windSpeed: 10,
      windDirection: "NE",
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        highTemp: 18 + Math.floor(Math.random() * 5),
        lowTemp: 10 + Math.floor(Math.random() * 4),
        condition: ["Sunny", "Partly Cloudy", "Light Rain", "Clear"][Math.floor(Math.random() * 4)]
      })),
      alerts: []
    },
    urbanHeat: {
      averageTemperature: 17.8,
      hotspots: [
        { lat: 48.8566, lng: 2.3522, temp: 21.5, area: "Le Marais" },
        { lat: 48.8738, lng: 2.2950, temp: 22.8, area: "La Défense" },
        { lat: 48.8339, lng: 2.3222, temp: 20.2, area: "Saint-Germain-des-Prés" }
      ],
      greenSpaceImpact: -2.5
    },
    waterQuality: {
      drinkingWaterIndex: 94,
      coastalWaterIndex: undefined,
      treatmentFacilities: [
        { name: "Usine de Choisy-le-Roi", status: "Operational", capacity: 93 },
        { name: "Usine d'Orly", status: "Operational", capacity: 90 },
        { name: "Ivry-sur-Seine Plant", status: "Operational", capacity: 85 }
      ]
    },
    noise: {
      averageDecibels: 66,
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        level: i < 6 ? 46 + Math.floor(Math.random() * 8) : 
               i < 9 ? 68 + Math.floor(Math.random() * 10) : 
               i < 18 ? 65 + Math.floor(Math.random() * 8) : 
               i < 22 ? 70 + Math.floor(Math.random() * 10) : 
               52 + Math.floor(Math.random() * 8)
      })),
      hotspots: [
        { lat: 48.8566, lng: 2.3522, level: 80, area: "Centre-ville" },
        { lat: 48.8739, lng: 2.2950, level: 76, area: "Champs-Élysées" },
        { lat: 48.8589, lng: 2.2943, level: 72, area: "Tour Eiffel" }
      ]
    },
    sustainability: {
      carbonEmissions: 7.8,
      renewablePercentage: 32,
      wasteRecycling: 45,
      landfillUsage: 28
    },
    greenSpace: {
      parksCoverage: 38,
      treeCanopy: 22,
      biodiversityIndex: 5.2,
      parks: [
        { name: "Jardin du Luxembourg", area: 25, lat: 48.8462, lng: 2.3372 },
        { name: "Bois de Boulogne", area: 846, lat: 48.8652, lng: 2.2361 },
        { name: "Parc des Buttes-Chaumont", area: 25, lat: 48.8768, lng: 2.3819 }
      ]
    }
  },
  "tokyo": {
    city: "Tokyo",
    airQuality: {
      aqi: 58,
      pm25: 12.4,
      pm10: 21.6,
      o3: 50,
      no2: 45,
      so2: 8,
      co: 0.6,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aqi: 45 + Math.floor(Math.random() * 30)
      }))
    },
    weather: {
      temperature: 22,
      humidity: 70,
      windSpeed: 8,
      windDirection: "SE",
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        highTemp: 22 + Math.floor(Math.random() * 4),
        lowTemp: 15 + Math.floor(Math.random() * 3),
        condition: ["Sunny", "Partly Cloudy", "Light Rain", "Humid"][Math.floor(Math.random() * 4)]
      })),
      alerts: [{
        type: "Humidity",
        severity: "Low",
        description: "High humidity levels expected"
      }]
    },
    urbanHeat: {
      averageTemperature: 23.2,
      hotspots: [
        { lat: 35.6762, lng: 139.6503, temp: 27.5, area: "Shinjuku" },
        { lat: 35.6735, lng: 139.7636, temp: 26.8, area: "Akihabara" },
        { lat: 35.6598, lng: 139.7003, temp: 25.5, area: "Shibuya" }
      ],
      greenSpaceImpact: -2.8
    },
    waterQuality: {
      drinkingWaterIndex: 95,
      coastalWaterIndex: 76,
      treatmentFacilities: [
        { name: "Kanamachi Water Plant", status: "Operational", capacity: 96 },
        { name: "Asaka Purification Plant", status: "Operational", capacity: 92 },
        { name: "Misato Water Facility", status: "Maintenance", capacity: 75 }
      ]
    },
    noise: {
      averageDecibels: 68,
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        level: i < 6 ? 48 + Math.floor(Math.random() * 10) : 
               i < 9 ? 72 + Math.floor(Math.random() * 12) : 
               i < 18 ? 65 + Math.floor(Math.random() * 10) : 
               i < 22 ? 73 + Math.floor(Math.random() * 10) : 
               55 + Math.floor(Math.random() * 10)
      })),
      hotspots: [
        { lat: 35.6762, lng: 139.6503, level: 82, area: "Shinjuku Station" },
        { lat: 35.6581, lng: 139.7017, level: 79, area: "Shibuya Crossing" },
        { lat: 35.7100, lng: 139.8107, level: 75, area: "Akihabara District" }
      ]
    },
    sustainability: {
      carbonEmissions: 9.2,
      renewablePercentage: 23,
      wasteRecycling: 52,
      landfillUsage: 25
    },
    greenSpace: {
      parksCoverage: 36,
      treeCanopy: 18,
      biodiversityIndex: 4.8,
      parks: [
        { name: "Shinjuku Gyoen", area: 58, lat: 35.6851, lng: 139.7100 },
        { name: "Yoyogi Park", area: 54, lat: 35.6715, lng: 139.6950 },
        { name: "Ueno Park", area: 53, lat: 35.7142, lng: 139.7714 }
      ]
    }
  },
  "dubai": {
    city: "Dubai",
    airQuality: {
      aqi: 75,
      pm25: 18.5,
      pm10: 42.3,
      o3: 63.7,
      no2: 35.1,
      so2: 12.8,
      co: 0.9,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aqi: 65 + Math.floor(Math.random() * 30)
      }))
    },
    weather: {
      temperature: 35,
      humidity: 55,
      windSpeed: 12,
      windDirection: "NE",
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        highTemp: 34 + Math.floor(Math.random() * 4),
        lowTemp: 24 + Math.floor(Math.random() * 4),
        condition: ["Sunny", "Partly Cloudy", "Clear", "Hazy"][Math.floor(Math.random() * 4)]
      })),
      alerts: [{
        type: "Heat",
        severity: "Moderate",
        description: "High temperatures expected to continue through the weekend"
      }]
    },
    urbanHeat: {
      averageTemperature: 33.2,
      hotspots: [
        { lat: 25.2048, lng: 55.2708, temp: 38.5, area: "Downtown Dubai" },
        { lat: 25.0657, lng: 55.1713, temp: 39.2, area: "Jebel Ali Industrial Area" },
        { lat: 25.2285, lng: 55.3273, temp: 37.8, area: "Deira" }
      ],
      greenSpaceImpact: -3.5
    },
    waterQuality: {
      drinkingWaterIndex: 92,
      coastalWaterIndex: 78,
      treatmentFacilities: [
        { name: "Jebel Ali Desalination Plant", status: "Operational", capacity: 95 },
        { name: "Al Qusais Treatment Plant", status: "Operational", capacity: 88 },
        { name: "Palm Jumeirah Filtration", status: "Maintenance", capacity: 65 }
      ]
    },
    noise: {
      averageDecibels: 62,
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        level: i < 6 ? 45 + Math.floor(Math.random() * 10) : 
               i < 9 ? 65 + Math.floor(Math.random() * 15) : 
               i < 18 ? 60 + Math.floor(Math.random() * 10) : 
               i < 22 ? 70 + Math.floor(Math.random() * 10) : 
               50 + Math.floor(Math.random() * 10)
      })),
      hotspots: [
        { lat: 25.2048, lng: 55.2708, level: 75, area: "Downtown Dubai" },
        { lat: 25.2532, lng: 55.3657, level: 72, area: "Dubai International Airport" },
        { lat: 25.0972, lng: 55.1367, level: 68, area: "Marina District" }
      ]
    },
    sustainability: {
      carbonEmissions: 20.7, // tons per capita per year
      renewablePercentage: 7,
      wasteRecycling: 25,
      landfillUsage: 75
    },
    greenSpace: {
      parksCoverage: 12.5,
      treeCanopy: 8.3,
      biodiversityIndex: 48,
      parks: [
        { name: "Zabeel Park", area: 47.5, lat: 25.2407, lng: 55.3089 },
        { name: "Al Safa Park", area: 22.7, lat: 25.1937, lng: 55.2524 },
        { name: "Dubai Creek Park", area: 96, lat: 25.2327, lng: 55.3289 }
      ]
    }
  },
  "nyc": {
    city: "New York City",
    airQuality: {
      aqi: 50,
      pm25: 10.2,
      pm10: 22.8,
      o3: 45.3,
      no2: 38.4,
      so2: 5.2,
      co: 0.7,
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        aqi: 40 + Math.floor(Math.random() * 30)
      }))
    },
    weather: {
      temperature: 18,
      humidity: 65,
      windSpeed: 8,
      windDirection: "SW",
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        highTemp: 17 + Math.floor(Math.random() * 4),
        lowTemp: 12 + Math.floor(Math.random() * 4),
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Rain"][Math.floor(Math.random() * 4)]
      })),
      alerts: []
    },
    urbanHeat: {
      averageTemperature: 19.8,
      hotspots: [
        { lat: 40.7128, lng: -74.0060, temp: 23.5, area: "Manhattan Midtown" },
        { lat: 40.6782, lng: -73.9442, temp: 22.7, area: "Brooklyn Industrial Zone" },
        { lat: 40.7614, lng: -73.9776, temp: 22.2, area: "Midtown East" }
      ],
      greenSpaceImpact: -2.8
    },
    waterQuality: {
      drinkingWaterIndex: 90,
      coastalWaterIndex: 72,
      treatmentFacilities: [
        { name: "Newtown Creek Treatment", status: "Operational", capacity: 93 },
        { name: "Hunts Point Treatment", status: "Operational", capacity: 91 },
        { name: "North River Treatment", status: "Operational", capacity: 88 }
      ]
    },
    noise: {
      averageDecibels: 72,
      timePatterns: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        level: i < 6 ? 60 + Math.floor(Math.random() * 10) : 
               i < 9 ? 75 + Math.floor(Math.random() * 10) : 
               i < 18 ? 80 + Math.floor(Math.random() * 10) : 
               i < 22 ? 85 + Math.floor(Math.random() * 10) : 
               65 + Math.floor(Math.random() * 10)
      })),
      hotspots: [
        { lat: 40.7580, lng: -73.9855, level: 85, area: "Times Square" },
        { lat: 40.7527, lng: -73.9772, level: 82, area: "Grand Central" },
        { lat: 40.7128, lng: -74.0060, level: 79, area: "Financial District" }
      ]
    },
    sustainability: {
      carbonEmissions: 12.5, // tons per capita per year
      renewablePercentage: 19,
      wasteRecycling: 33,
      landfillUsage: 67
    },
    greenSpace: {
      parksCoverage: 14,
      treeCanopy: 21,
      biodiversityIndex: 52,
      parks: [
        { name: "Central Park", area: 341, lat: 40.7812, lng: -73.9665 },
        { name: "Prospect Park", area: 237, lat: 40.6602, lng: -73.9690 },
        { name: "Bryant Park", area: 3.9, lat: 40.7536, lng: -73.9832 }
      ]
    }
  }
};

// Function to get color based on AQI value
const getAqiColor = (aqi: number): string => {
  if (aqi <= 50) return "bg-green-500"; // Good
  if (aqi <= 100) return "bg-yellow-500"; // Moderate
  if (aqi <= 150) return "bg-orange-500"; // Unhealthy for Sensitive Groups
  if (aqi <= 200) return "bg-red-500"; // Unhealthy
  if (aqi <= 300) return "bg-purple-500"; // Very Unhealthy
  return "bg-rose-900"; // Hazardous
};

// Function to get AQI status text
const getAqiStatus = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

interface EnvironmentPanelProps {
  cityId?: string;
}

// City coordinates mapping
const getCityCoordinates = (cityId: string) => {
  switch (cityId) {
    case 'nyc':
      return { lat: 40.7128, lng: -74.0060 };
    case 'london':
      return { lat: 51.5074, lng: -0.1278 };
    case 'paris':
      return { lat: 48.8566, lng: 2.3522 };
    case 'tokyo':
      return { lat: 35.6762, lng: 139.6503 };
    case 'dubai':
    default:
      return { lat: 25.2048, lng: 55.2708 };
  }
};

// City downtown area name mapping
const getCityDowntownName = (cityId: string) => {
  switch (cityId) {
    case 'nyc':
      return 'Midtown Manhattan';
    case 'london':
      return 'City of London';
    case 'paris':
      return 'Le Marais';
    case 'tokyo':
      return 'Shinjuku';
    case 'dubai':
    default:
      return 'Downtown Dubai';
  }
};

// City industrial area name mapping
const getCityIndustrialName = (cityId: string) => {
  switch (cityId) {
    case 'nyc':
      return 'Brooklyn';
    case 'london':
      return 'Stratford';
    case 'paris':
      return 'La Défense';
    case 'tokyo':
      return 'Kawasaki';
    case 'dubai':
    default:
      return 'Jebel Ali Industrial Area';
  }
};

export const EnvironmentPanel = ({ cityId: propCityId }: EnvironmentPanelProps) => {
  const { cityId: urlCityId = "dubai" } = useParams<{ cityId: string }>();
  // Use prop cityId if provided, otherwise use the URL param
  const actualCityId = propCityId || urlCityId;
  const [activeTab, setActiveTab] = useState("air-quality");
  const [loading, setLoading] = useState(true);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const { toast } = useToast();

  // Fetch weather data using the Weather API
  const fetchWeatherData = useCallback(async () => {
    if (!actualCityId) return;
    
    setWeatherLoading(true);
    try {
      // Get actual city name from the actualCityId
      let cityName = actualCityId;
      if (MOCK_ENVIRONMENTAL_DATA[actualCityId]) {
        cityName = MOCK_ENVIRONMENTAL_DATA[actualCityId].city;
      }
      
      const data = await getWeatherData(cityName);
      console.log('Weather API response for Environment panel:', data);
      
      // Check if using fallback data and notify user if needed
      if (data.usingFallback) {
        console.info('Using fallback weather data for', cityName);
        // Only show toast for fallback if we're not already in a loading state
        if (!loading) {
          toast({
            title: "Using Cached Weather Data",
            description: "We're using cached weather data for this city.",
            variant: "default",
          });
        }
      }
      
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      toast({
        title: "Weather Data Error",
        description: "Failed to load weather data. Using mock data instead.",
        variant: "destructive",
      });
    } finally {
      setWeatherLoading(false);
    }
  }, [actualCityId, toast, loading]);

  // Fetch environmental data
  const fetchEnvironmentalData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from APIs
      // For demo purposes, load immediately without artificial delay
      // Removed setTimeout to improve loading performance
        let cityData: EnvironmentalData;
        // Get city coordinates
        const cityCoords = getCityCoordinates(actualCityId);
        
        // If we have data for this city, use it as a base but ensure coordinates are updated
        if (MOCK_ENVIRONMENTAL_DATA[actualCityId]) {
          cityData = structuredClone(MOCK_ENVIRONMENTAL_DATA[actualCityId]);
          
          // Ensure the urban heat data is using the correct city coordinates
          cityData.urbanHeat.hotspots = cityData.urbanHeat.hotspots.map((hotspot, index) => {
            let latOffset = 0, lngOffset = 0;
            
            if (index === 0) { // Downtown
              latOffset = 0;
              lngOffset = 0;
            } else if (index === 1) { // Industrial area
              latOffset = -0.0391;
              lngOffset = 0.0205;
            } else { // Eastern district
              latOffset = 0.0237;
              lngOffset = 0.0565;
            }
            
            return {
              ...hotspot,
              lat: cityCoords.lat + latOffset,
              lng: cityCoords.lng + lngOffset,
              area: index === 0 ? getCityDowntownName(actualCityId) :
                    index === 1 ? getCityIndustrialName(actualCityId) :
                    `${cityData.city} Eastern District`
            };
          });
          
          // Also update noise hotspots
          cityData.noise.hotspots = cityData.noise.hotspots.map((hotspot, index) => {
            let latOffset = 0, lngOffset = 0;
            
            if (index === 0) { // Downtown
              latOffset = 0;
              lngOffset = 0;
            } else if (index === 1) { // Airport
              latOffset = 0.0484;
              lngOffset = 0.0949;
            } else { // Marina
              latOffset = -0.1076;
              lngOffset = -0.1341;
            }
            
            return {
              ...hotspot,
              lat: cityCoords.lat + latOffset,
              lng: cityCoords.lng + lngOffset,
              area: index === 0 ? getCityDowntownName(actualCityId) :
                    index === 1 ? `${cityData.city} Airport` :
                    `${cityData.city} Marina District`
            };
          });
          
          // Update parks too
          cityData.greenSpace.parks = cityData.greenSpace.parks.map((park, index) => {
            let latOffset = 0, lngOffset = 0;
            
            if (index === 0) { // Central Park
              latOffset = 0.0125;
              lngOffset = -0.0379;
            } else if (index === 1) { // Botanical Gardens
              latOffset = 0.0240;
              lngOffset = 0.0108;
            } else { // Nature Reserve
              latOffset = -0.0482;
              lngOffset = -0.0214;
            }
            
            return {
              ...park,
              lat: cityCoords.lat + latOffset,
              lng: cityCoords.lng + lngOffset,
              name: index === 0 ? `${cityData.city} Central Park` :
                   index === 1 ? `${cityData.city} Botanical Gardens` :
                   `${cityData.city} Nature Reserve`
            };
          });
          
        } else {
          // Otherwise, use Dubai data but override all city-specific data
          const baseData = structuredClone(MOCK_ENVIRONMENTAL_DATA["dubai"]);
          
          // Set proper city name
          baseData.city = actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1);
          
          // Update urban heat hotspots with correct coordinates
          baseData.urbanHeat.hotspots = [
            { 
              lat: cityCoords.lat, 
              lng: cityCoords.lng, 
              temp: baseData.urbanHeat.averageTemperature + 5.3, 
              area: getCityDowntownName(actualCityId) 
            },
            { 
              lat: cityCoords.lat - 0.0391, 
              lng: cityCoords.lng + 0.0205, 
              temp: baseData.urbanHeat.averageTemperature + 6.0, 
              area: getCityIndustrialName(actualCityId) 
            },
            { 
              lat: cityCoords.lat + 0.0237, 
              lng: cityCoords.lng + 0.0565, 
              temp: baseData.urbanHeat.averageTemperature + 4.6, 
              area: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Eastern District" 
            }
          ];
          
          // Update noise hotspots too
          baseData.noise.hotspots = [
            { 
              lat: cityCoords.lat, 
              lng: cityCoords.lng, 
              level: 75, 
              area: getCityDowntownName(actualCityId) 
            },
            { 
              lat: cityCoords.lat + 0.0484, 
              lng: cityCoords.lng + 0.0949, 
              level: 72, 
              area: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Airport" 
            },
            { 
              lat: cityCoords.lat - 0.1076, 
              lng: cityCoords.lng - 0.1341, 
              level: 68, 
              area: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Marina District" 
            }
          ];
          
          // Update parks with correct coordinates
          baseData.greenSpace.parks = [
            { 
              name: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Central Park", 
              area: 142, 
              lat: cityCoords.lat + 0.0125, 
              lng: cityCoords.lng - 0.0379 
            },
            { 
              name: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Botanical Gardens", 
              area: 86, 
              lat: cityCoords.lat + 0.0240, 
              lng: cityCoords.lng + 0.0108 
            },
            { 
              name: actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + " Nature Reserve", 
              area: 215, 
              lat: cityCoords.lat - 0.0482, 
              lng: cityCoords.lng - 0.0214 
            }
          ];
          
          // Adjust the water treatment facilities names
          if (baseData.waterQuality && baseData.waterQuality.treatmentFacilities) {
            baseData.waterQuality.treatmentFacilities.forEach((facility, index) => {
              facility.name = actualCityId.charAt(0).toUpperCase() + actualCityId.slice(1) + 
                              (index === 0 ? " Main Water Plant" : 
                               index === 1 ? " Secondary Treatment Facility" : 
                                            " Tertiary Filtration Center");
            });
          }
          
          cityData = baseData;
        }
        
        setEnvironmentalData(cityData);
        setLoading(false);
    } catch (error) {
      console.error("Failed to fetch environmental data:", error);
      toast({
        title: "Error",
        description: "Failed to load environmental data. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [actualCityId, toast]);

  useEffect(() => {
    fetchEnvironmentalData();
    fetchWeatherData();
  }, [fetchEnvironmentalData, fetchWeatherData]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!environmentalData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No environmental data available for this city.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Environmental Dashboard: {environmentalData.city}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchEnvironmentalData} 
          className="gap-1"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Environment Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Air Quality Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{environmentalData.airQuality.aqi}</div>
            <Badge className={getAqiColor(environmentalData.airQuality.aqi)}>
              {getAqiStatus(environmentalData.airQuality.aqi)}
            </Badge>
            <Progress 
              value={Math.min(environmentalData.airQuality.aqi / 3, 100)} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThermometerSun className="h-4 w-4" /> Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36 mt-2" />
              </div>
            ) : weatherData ? (
              <>
                <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
                <div className="text-xs text-muted-foreground">
                  Humidity: {weatherData.humidity}%
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <Wind className="h-4 w-4 mr-1" /> 
                  {weatherData.windSpeed} km/h {environmentalData.weather.windDirection}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{environmentalData.weather.temperature}°C</div>
                <div className="text-xs text-muted-foreground">
                  Humidity: {environmentalData.weather.humidity}%
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <Wind className="h-4 w-4 mr-1" /> 
                  {environmentalData.weather.windSpeed} km/h {environmentalData.weather.windDirection}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Water Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{environmentalData.waterQuality.drinkingWaterIndex}/100</div>
            <Badge className={
              environmentalData.waterQuality.drinkingWaterIndex > 90 ? "bg-green-500" : 
              environmentalData.waterQuality.drinkingWaterIndex > 70 ? "bg-yellow-500" : "bg-red-500"
            }>
              {environmentalData.waterQuality.drinkingWaterIndex > 90 ? "Excellent" : 
               environmentalData.waterQuality.drinkingWaterIndex > 70 ? "Good" : "Needs Improvement"}
            </Badge>
            <Progress 
              value={environmentalData.waterQuality.drinkingWaterIndex} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Leaf className="h-4 w-4" /> Green Space
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{environmentalData.greenSpace.parksCoverage}%</div>
            <div className="text-xs text-muted-foreground">
              Tree Canopy: {environmentalData.greenSpace.treeCanopy}%
            </div>
            <div className="flex items-center mt-2 text-xs">
              <PieChart className="h-4 w-4 mr-1" /> 
              Biodiversity Index: {environmentalData.greenSpace.biodiversityIndex}/100
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 lg:grid-cols-7">
          <TabsTrigger value="air-quality">Air Quality</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="urban-heat">Urban Heat</TabsTrigger>
          <TabsTrigger value="water">Water</TabsTrigger>
          <TabsTrigger value="noise">Noise</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="green-space">Green Space</TabsTrigger>
        </TabsList>

        {/* Tab content will go here - we'll add detailed implementations for each tab */}
        <TabsContent value="air-quality" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Air Quality Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Current Air Quality Index (AQI) is <span className="font-bold">{environmentalData.airQuality.aqi}</span>, which is considered{" "}
            <span className={`font-bold ${
              environmentalData.airQuality.aqi <= 50 ? "text-green-500" : 
              environmentalData.airQuality.aqi <= 100 ? "text-yellow-500" : 
              environmentalData.airQuality.aqi <= 150 ? "text-orange-500" : 
              environmentalData.airQuality.aqi <= 200 ? "text-red-500" : 
              environmentalData.airQuality.aqi <= 300 ? "text-purple-500" : "text-rose-900"
            }`}>
              {getAqiStatus(environmentalData.airQuality.aqi)}
            </span>.
          </p>
          
          {/* Pollutant Levels */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">PM2.5</CardTitle>
                <CardDescription>Fine Particulate Matter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.pm25} µg/m³</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.pm25 / 0.35, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">PM10</CardTitle>
                <CardDescription>Coarse Particulate Matter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.pm10} µg/m³</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.pm10 / 1.5, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">O₃</CardTitle>
                <CardDescription>Ozone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.o3} ppb</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.o3 / 0.7, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">NO₂</CardTitle>
                <CardDescription>Nitrogen Dioxide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.no2} ppb</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.no2 / 0.53, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">SO₂</CardTitle>
                <CardDescription>Sulfur Dioxide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.so2} ppb</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.so2 / 0.3, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">CO</CardTitle>
                <CardDescription>Carbon Monoxide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{environmentalData.airQuality.co} ppm</div>
                <Progress 
                  value={Math.min(environmentalData.airQuality.co / 0.035, 100)} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Air Quality Map using Google Maps API */}
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Air Quality Map</CardTitle>
                <CardDescription>Real-time air quality data visualization</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <EnvironmentMap
                  center={{
                    lat: getCityCoordinates(actualCityId).lat,
                    lng: getCityCoordinates(actualCityId).lng
                  }}
                  zoom={11}
                  points={[
                    // Convert AQI data to map points with weights based on pollution levels
                    ...environmentalData.airQuality.history.slice(-10).map((item, index) => ({
                      lat: getCityCoordinates(actualCityId).lat + (Math.random() * 0.05 - 0.025),
                      lng: getCityCoordinates(actualCityId).lng + (Math.random() * 0.05 - 0.025),
                      weight: item.aqi / 50, // Normalize the weight
                      area: `Monitoring Station ${index + 1}`,
                      value: item.aqi,
                      label: 'AQI',
                      details: {
                        'Air Quality Index': item.aqi,
                        'Date': new Date(item.date).toLocaleDateString(),
                        'PM2.5': `${environmentalData.airQuality.pm25} µg/m³`,
                        'PM10': `${environmentalData.airQuality.pm10} µg/m³`
                      }
                    })),
                    // Add special hotspots for high pollution areas
                    {
                      lat: getCityCoordinates(actualCityId).lat + 0.0166,
                      lng: getCityCoordinates(actualCityId).lng + 0.0026,
                      weight: environmentalData.airQuality.pm25 / 10,
                      area: getCityDowntownName(actualCityId),
                      value: Math.round(environmentalData.airQuality.aqi * 1.2), // Slightly higher value for urban center
                      label: 'AQI',
                      details: {
                        'Air Quality Index': Math.round(environmentalData.airQuality.aqi * 1.2),
                        'PM2.5': `${Math.round(environmentalData.airQuality.pm25 * 1.3)} µg/m³`,
                        'PM10': `${Math.round(environmentalData.airQuality.pm10 * 1.2)} µg/m³`,
                        'CO': `${environmentalData.airQuality.co} ppm`
                      }
                    },
                    {
                      lat: getCityCoordinates(actualCityId).lat - 0.0346,
                      lng: getCityCoordinates(actualCityId).lng + 0.0618,
                      weight: environmentalData.airQuality.pm10 / 20,
                      area: getCityIndustrialName(actualCityId),
                      value: Math.round(environmentalData.airQuality.aqi * 1.3), // Industrial areas have higher values
                      label: 'AQI',
                      details: {
                        'Air Quality Index': Math.round(environmentalData.airQuality.aqi * 1.3),
                        'PM2.5': `${Math.round(environmentalData.airQuality.pm25 * 1.5)} µg/m³`,
                        'PM10': `${Math.round(environmentalData.airQuality.pm10 * 1.4)} µg/m³`,
                        'NO2': `${Math.round(environmentalData.airQuality.no2 * 1.6)} ppb`
                      }
                    }
                  ]}
                  mapType="heatmap"
                  mapLabel="Air Quality Index"
                  colorGradient={[
                    'rgba(0, 255, 0, 0)', // Transparent start
                    'rgba(0, 255, 0, 1)', // Good - Green
                    'rgba(255, 255, 0, 1)', // Moderate - Yellow
                    'rgba(255, 128, 0, 1)', // Unhealthy for sensitive groups - Orange
                    'rgba(255, 0, 0, 1)', // Unhealthy - Red
                    'rgba(128, 0, 128, 1)' // Very unhealthy - Purple
                  ]}
                  legendItems={[
                    { color: '#00ff00', label: 'Good (0-50)' },
                    { color: '#ffff00', label: 'Moderate (51-100)' },
                    { color: '#ff8000', label: 'Unhealthy for Sensitive Groups (101-150)' },
                    { color: '#ff0000', label: 'Unhealthy (151-200)' },
                    { color: '#800080', label: 'Very Unhealthy (201+)' }
                  ]}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Historical AQI Trends Chart */}
          <HistoricalTrendChart
            title="Historical AQI Trends"
            data={environmentalData.airQuality.history.map(item => ({
              date: item.date,
              value: item.aqi
            }))}
            dataKey="value"
            yAxisLabel="AQI"
            stroke={environmentalData.airQuality.aqi <= 50 ? '#4ade80' : 
                    environmentalData.airQuality.aqi <= 100 ? '#facc15' : 
                    environmentalData.airQuality.aqi <= 150 ? '#fb923c' : 
                    environmentalData.airQuality.aqi <= 200 ? '#ef4444' : '#a855f7'}
            timeRanges={[
              { label: '7 Days', value: '7d', days: 7 },
              { label: '14 Days', value: '14d', days: 14 },
              { label: '30 Days', value: '30d', days: 30 }
            ]}
          />
        </TabsContent>

        {/* Other tab contents will be similar in structure */}
        <TabsContent value="weather" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Weather Information</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Weather</CardTitle>
                <CardDescription>
                  {weatherData ? (
                    `Last updated: ${new Date().toLocaleTimeString()}`
                  ) : (
                    "Weather data not available"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : weatherData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {weatherData.icon && (
                        <img 
                          src={`https:${weatherData.icon}`} 
                          alt={weatherData.condition} 
                          className="w-16 h-16"
                        />
                      )}
                      <div>
                        <div className="text-3xl font-bold">{weatherData.temperature}°C</div>
                        <div className="text-lg">{weatherData.condition}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">Humidity</div>
                          <div className="font-medium">{weatherData.humidity}%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">Wind Speed</div>
                          <div className="font-medium">{weatherData.windSpeed} km/h</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                    <p>Weather data could not be loaded. Using mock data.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4" 
                      onClick={fetchWeatherData}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {environmentalData.weather.forecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <div className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-muted-foreground">{day.condition}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-rose-500">{day.highTemp}°C</div>
                        <div className="text-sm text-blue-500">{day.lowTemp}°C</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {environmentalData.weather.alerts.length > 0 && (
              <Card className="md:col-span-2 border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Weather Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {environmentalData.weather.alerts.map((alert, index) => (
                      <div 
                        key={index} 
                        className="p-3 rounded border border-orange-200 bg-white"
                      >
                        <div className="font-medium text-orange-800">{alert.type} - {alert.severity}</div>
                        <div className="text-sm mt-1">{alert.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="urban-heat" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Urban Heat Island Analysis</h3>
          
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThermometerSun className="h-5 w-5 text-rose-500" />
                  Average Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{environmentalData.urbanHeat.averageTemperature}°C</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Urban areas are {Math.abs(environmentalData.urbanHeat.greenSpaceImpact).toFixed(1)}°C 
                  {environmentalData.urbanHeat.greenSpaceImpact < 0 ? 'warmer' : 'cooler'} than surrounding areas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Green Space Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">{environmentalData.greenSpace.parksCoverage}%</div>
                  <div className="p-1.5 px-2 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                    Green Coverage
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Areas with 10% more green space show temperature reductions of up to 2.5°C
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Urban Heat Island Map using Google Maps API */}
          <div className="mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Urban Heat Map</CardTitle>
                <CardDescription>Temperature distribution across {environmentalData.city}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <EnvironmentMap 
                  center={{
                    lat: getCityCoordinates(actualCityId).lat, 
                    lng: getCityCoordinates(actualCityId).lng
                  }}
                  zoom={11}
                  points={[
                    // Convert the hotspots to map points
                    ...environmentalData.urbanHeat.hotspots.map(hotspot => ({
                      lat: hotspot.lat,
                      lng: hotspot.lng,
                      weight: (hotspot.temp - environmentalData.urbanHeat.averageTemperature + 5) / 10,
                      area: hotspot.area,
                      value: hotspot.temp,
                      label: 'Temperature',
                      details: {
                        'Temperature': `${hotspot.temp}°C`,
                        'Difference': `${(hotspot.temp - environmentalData.urbanHeat.averageTemperature).toFixed(1)}°C from average`,
                        'Area': hotspot.area,
                        'Green Space': `${Math.round(environmentalData.greenSpace.parksCoverage - (Math.random() * 5))}%`
                      }
                    })),
                    // Add more data points for a comprehensive heatmap
                    ...Array.from({ length: 15 }, (_, i) => {
                      const baseLat = getCityCoordinates(actualCityId).lat;
                      const baseLng = getCityCoordinates(actualCityId).lng;
                      const latOffset = (Math.random() * 0.1) - 0.05;
                      const lngOffset = (Math.random() * 0.1) - 0.05;
                      const tempOffset = Math.random() * 4 - 1; // -1 to +3 degrees from average
                      const urbanDensity = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
                      
                      return {
                        lat: baseLat + latOffset,
                        lng: baseLng + lngOffset,
                        weight: (tempOffset + 3) / 8, // Normalize to 0-1 range for heatmap
                        area: `Urban Area ${i+1}`,
                        value: environmentalData.urbanHeat.averageTemperature + tempOffset,
                        label: 'Temperature',
                        details: {
                          'Temperature': `${(environmentalData.urbanHeat.averageTemperature + tempOffset).toFixed(1)}°C`,
                          'Urban Density': `${Math.round(urbanDensity * 100)}%`,
                          'Green Cover': `${Math.round((1 - urbanDensity) * environmentalData.greenSpace.parksCoverage)}%`
                        }
                      };
                    })
                  ]}
                  mapType="heatmap"
                  mapLabel="Temperature (°C)"
                  colorGradient={[
                    'rgba(0, 255, 255, 0)', // Transparent cyan (cool)
                    'rgba(0, 255, 255, 1)', // Cyan (cool)
                    'rgba(0, 255, 0, 1)',   // Green
                    'rgba(255, 255, 0, 1)',  // Yellow
                    'rgba(255, 128, 0, 1)',  // Orange
                    'rgba(255, 0, 0, 1)',    // Red (hot)
                    'rgba(128, 0, 0, 1)'     // Dark red (very hot)
                  ]}
                  legendItems={[
                    { color: '#00ffff', label: 'Cool (< 30°C)' },
                    { color: '#00ff00', label: 'Moderate (30-32°C)' },
                    { color: '#ffff00', label: 'Warm (32-34°C)' },
                    { color: '#ff8000', label: 'Hot (34-36°C)' },
                    { color: '#ff0000', label: 'Very Hot (36-38°C)' },
                    { color: '#800000', label: 'Extreme (> 38°C)' }
                  ]}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <EnvironmentBarChart 
              title="Temperature by Urban Density"
              data={[
                { name: 'Downtown', value: environmentalData.urbanHeat.hotspots[0].temp },
                { name: 'Commercial', value: environmentalData.urbanHeat.hotspots[1].temp - 0.5 },
                { name: 'Residential', value: environmentalData.urbanHeat.averageTemperature },
                { name: 'Parks', value: environmentalData.urbanHeat.averageTemperature - 2.5 },
                { name: 'Suburbs', value: environmentalData.urbanHeat.averageTemperature - 1.8 }
              ]}
              dataKey="value"
              xAxisLabel="Zone"
              yAxisLabel="Temperature (°C)"
              barColor="#ef4444"
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impact of Green Space</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="p-1 bg-green-100 text-green-800 rounded-full mt-0.5">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Temperature Reduction:</span> Every 10% increase in green coverage reduces temperatures by up to 2.5°C
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="p-1 bg-blue-100 text-blue-800 rounded-full mt-0.5">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Cooling Effect:</span> Parks are on average {Math.abs(environmentalData.urbanHeat.greenSpaceImpact).toFixed(1)}°C cooler than surrounding urban areas
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="p-1 bg-orange-100 text-orange-800 rounded-full mt-0.5">
                      <Building className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Building Density:</span> High-density areas in {environmentalData.city} retain more heat, creating nighttime heat islands
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="p-1 bg-purple-100 text-purple-800 rounded-full mt-0.5">
                      <Wind className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Ventilation Corridors:</span> Strategic green corridors can improve air flow and reduce heat by up to 3°C
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="water" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Water Quality Monitoring</h3>
          {/* Water quality content will go here */}
          <p className="text-muted-foreground">Water quality data to be implemented</p>
        </TabsContent>

        <TabsContent value="noise" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Noise Pollution Data</h3>
          {/* Noise content will go here */}
          <p className="text-muted-foreground">Noise pollution analysis to be implemented</p>
        </TabsContent>

        <TabsContent value="sustainability" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Sustainability Metrics</h3>
          {/* Sustainability content will go here */}
          <p className="text-muted-foreground">Sustainability data to be implemented</p>
        </TabsContent>

        <TabsContent value="green-space" className="p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-4">Green Space Analysis</h3>
          {/* Green space content will go here */}
          <p className="text-muted-foreground">Green space distribution to be implemented</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnvironmentPanel;
