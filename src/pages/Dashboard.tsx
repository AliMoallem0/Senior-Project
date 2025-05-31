import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  AreaChart, 
  Cloud, 
  ThermometerSun, 
  Droplets, 
  Wind, 
  Timer, 
  Users, 
  Building, 
  Car, 
  Bus,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  LifeBuoy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CustomProgress } from "@/components/ui/custom-progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from '@/components/Navbar';
import Google3DMap from '@/components/Google3DMap';
import { SimulationPanel } from '@/components/SimulationPanel';
import { EnvironmentPanel } from '@/components/EnvironmentPanel';
import { cn } from "@/lib/utils";
import { getWeatherData, WeatherData } from '@/services/weatherService';
import { TrafficData, NEW_YORK_HOTSPOTS, DUBAI_HOTSPOTS, getCityHotspots } from '@/services/trafficService';
import { getGoogleTrafficData, initializeGoogleTrafficUpdates } from '@/services/googleTrafficService';
import TrafficMap from '@/components/TrafficMap';
import { useAuth } from '@/hooks/useAuth';
import { Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { Particles } from "@tsparticles/react";
import type { Container } from "@tsparticles/engine";
import CityModel from '@/components/CityModel';
import GoogleTrafficMap from '@/components/GoogleTrafficMap';

const CITY_DATA = {
  "nyc": {
    name: "New York City",
    population: 8419000,
    trafficIndex: 75,
    airQuality: 60,
    weather: { temperature: 25, humidity: 60, windSpeed: 15 },
    transportMode: { car: 40, publicTransport: 50, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Times Square", congestion: 85 },
      { id: 2, name: "Central Park Area", congestion: 60 },
      { id: 3, name: "Financial District", congestion: 70 },
      { id: 4, name: "Brooklyn Bridge", congestion: 90 },
    ],
  },
  "london": {
    name: "London",
    population: 8900000,
    trafficIndex: 70,
    airQuality: 65,
    weather: { temperature: 18, humidity: 70, windSpeed: 12 },
    transportMode: { car: 35, publicTransport: 55, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Oxford Circus", congestion: 80 },
      { id: 2, name: "Piccadilly Circus", congestion: 75 },
      { id: 3, name: "London Bridge", congestion: 65 },
      { id: 4, name: "Canary Wharf", congestion: 70 },
    ],
  },
  "tokyo": {
    name: "Tokyo",
    population: 14000000,
    trafficIndex: 60,
    airQuality: 55,
    weather: { temperature: 22, humidity: 65, windSpeed: 10 },
    transportMode: { car: 30, publicTransport: 60, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Shibuya Crossing", congestion: 85 },
      { id: 2, name: "Shinjuku Station", congestion: 80 },
      { id: 3, name: "Tokyo Tower", congestion: 60 },
      { id: 4, name: "Akihabara", congestion: 70 },
    ],
  },
  "singapore": {
    name: "Singapore",
    population: 5600000,
    trafficIndex: 55,
    airQuality: 70,
    weather: { temperature: 30, humidity: 80, windSpeed: 8 },
    transportMode: { car: 25, publicTransport: 65, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Orchard Road", congestion: 75 },
      { id: 2, name: "Marina Bay Sands", congestion: 70 },
      { id: 3, name: "Changi Airport", congestion: 60 },
      { id: 4, name: "Sentosa", congestion: 65 },
    ],
  },
  "barcelona": {
    name: "Barcelona",
    population: 1600000,
    trafficIndex: 50,
    airQuality: 60,
    weather: { temperature: 26, humidity: 55, windSpeed: 14 },
    transportMode: { car: 40, publicTransport: 50, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "La Rambla", congestion: 70 },
      { id: 2, name: "Plaça de Catalunya", congestion: 65 },
      { id: 3, name: "Sagrada Família", congestion: 60 },
      { id: 4, name: "Barceloneta Beach", congestion: 55 },
    ],
  },
  "sydney": {
    name: "Sydney",
    population: 5300000,
    trafficIndex: 58,
    airQuality: 68,
    weather: { temperature: 20, humidity: 60, windSpeed: 13 },
    transportMode: { car: 50, publicTransport: 40, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Sydney Opera House", congestion: 80 },
      { id: 2, name: "Harbour Bridge", congestion: 75 },
      { id: 3, name: "Bondi Beach", congestion: 60 },
      { id: 4, name: "Darling Harbour", congestion: 65 },
    ],
  },
  "sanfrancisco": {
    name: "San Francisco",
    population: 884000,
    trafficIndex: 65,
    airQuality: 62,
    weather: { temperature: 17, humidity: 75, windSpeed: 15 },
    transportMode: { car: 45, publicTransport: 45, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Golden Gate Bridge", congestion: 85 },
      { id: 2, name: "Market Street", congestion: 70 },
      { id: 3, name: "Union Square", congestion: 65 },
      { id: 4, name: "Fisherman's Wharf", congestion: 60 },
    ],
  },
  "1": {
    name: "New York",
    population: 8419000,
    trafficIndex: 75,
    airQuality: 60,
    weather: { temperature: 25, humidity: 60, windSpeed: 15 },
    transportMode: { car: 40, publicTransport: 50, bicycle: 10 },
    trafficHotspots: [
      { id: 1, name: "Times Square", congestion: 85 },
      { id: 2, name: "Central Park Area", congestion: 60 },
      { id: 3, name: "Financial District", congestion: 70 },
      { id: 4, name: "Brooklyn Bridge", congestion: 90 },
    ],
  },
  "2": {
    name: "Los Angeles",
    population: 3971000,
    trafficIndex: 82,
    airQuality: 70,
    weather: { temperature: 28, humidity: 65, windSpeed: 10 },
    transportMode: { car: 60, publicTransport: 30, bicycle: 10 },
    trafficHotspots: [
      { id: 5, name: "Hollywood", congestion: 92 },
      { id: 6, name: "Downtown LA", congestion: 78 },
      { id: 7, name: "Santa Monica", congestion: 65 },
      { id: 8, name: "Beverly Hills", congestion: 88 },
    ],
  },
  "3": {
    name: "Chicago",
    population: 2706000,
    trafficIndex: 68,
    airQuality: 55,
    weather: { temperature: 22, humidity: 55, windSpeed: 20 },
    transportMode: { car: 35, publicTransport: 55, bicycle: 10 },
    trafficHotspots: [
      { id: 9, name: "The Loop", congestion: 75 },
      { id: 10, name: "Magnificent Mile", congestion: 62 },
      { id: 11, name: "Lincoln Park", congestion: 58 },
      { id: 12, name: "West Loop", congestion: 70 },
    ],
  },
  "4": {
    name: "Houston",
    population: 2325000,
    trafficIndex: 78,
    airQuality: 65,
    weather: { temperature: 30, humidity: 70, windSpeed: 8 },
    transportMode: { car: 70, publicTransport: 20, bicycle: 10 },
    trafficHotspots: [
      { id: 13, name: "Downtown Houston", congestion: 80 },
      { id: 14, name: "Texas Medical Center", congestion: 72 },
      { id: 15, name: "Energy Corridor", congestion: 68 },
      { id: 16, name: "Galleria", congestion: 85 },
    ],
  },
  "5": {
    name: "Phoenix",
    population: 1681000,
    trafficIndex: 62,
    airQuality: 50,
    weather: { temperature: 35, humidity: 40, windSpeed: 12 },
    transportMode: { car: 75, publicTransport: 15, bicycle: 10 },
    trafficHotspots: [
      { id: 17, name: "Downtown Phoenix", congestion: 65 },
      { id: 18, name: "Scottsdale", congestion: 58 },
      { id: 19, name: "Tempe", congestion: 60 },
      { id: 20, name: "Mesa", congestion: 62 },
    ],
  },
  "dubai": {
    name: "Dubai",
    population: 3300000,
    trafficIndex: 75,
    airQuality: 55,
    weather: { temperature: 38, humidity: 45, windSpeed: 22 },
    transportMode: { car: 45, publicTransport: 40, bicycle: 5 },
    trafficHotspots: [
      { id: 1, name: "Sheikh Zayed Road", congestion: 88 },
      { id: 2, name: "Dubai Mall", congestion: 82 },
      { id: 3, name: "Palm Jumeirah", congestion: 65 },
      { id: 4, name: "Dubai Marina", congestion: 72 },
    ],
  }
};

const getTrafficColor = (value: number) => {
  if (value > 70) return 'text-red-500 dark:text-red-400';
  if (value > 50) return 'text-orange-500 dark:text-orange-400';
  return 'text-green-500 dark:text-green-400';
};

const getAirQualityColor = (value: number) => {
  if (value > 70) return 'text-red-500 dark:text-red-400';
  if (value > 50) return 'text-orange-500 dark:text-orange-400';
  return 'text-green-500 dark:text-green-400';
};

const getProgressColor = (value: number) => {
  if (value > 70) return 'bg-red-500';
  if (value > 50) return 'bg-orange-500';
  return 'bg-green-500';
};

const getStatusText = (value: number) => {
  if (value > 70) return 'High Congestion';
  if (value > 50) return 'Moderate Congestion';
  return 'Low Congestion';
};

const getAirQualityText = (value: number) => {
  if (value > 70) return 'Poor Air Quality';
  if (value > 50) return 'Moderate Air Quality';
  return 'Good Air Quality';
};

const Dashboard = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('now');
  const [expandModel, setExpandModel] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const prevCongestionRef = useRef<number | null>(null);
  
  // Compute trend and prediction
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  let prediction = 'Stable traffic expected';
  if (trafficData) {
    const prev = prevCongestionRef.current;
    if (prev !== null) {
      if (trafficData.congestion < prev) trend = 'improving';
      else if (trafficData.congestion > prev) trend = 'worsening';
      else trend = 'stable';
    }
    // Simple prediction logic
    if (trend === 'improving') prediction = 'Improving conditions expected';
    else if (trend === 'worsening') prediction = 'Heavy congestion expected';
    else prediction = 'Moderate congestion expected';
  }

  useEffect(() => {
    if (trafficData) {
      prevCongestionRef.current = trafficData.congestion;
    }
  }, [trafficData]);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = useMemo(() => ({
    background: {
      color: "#111",
    },
    particles: {
      number: {
        value: 10,
        density: {
          enable: true,
        },
      },
      shape: {
        type: "star",
      },
      opacity: {
        value: 0.5,
      },
      size: {
        value: 3,
      },
      links: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 1,
          },
        },
        push: {
          quantity: 4,
        },
      },
    },
  }), []);

  useEffect(() => {
    console.log('Auth state:', { user, authLoading });
    console.log('City ID:', cityId);
    
    const fetchCityData = () => {
      setLoading(true);
      try {
        console.log("Fetching city with ID:", cityId);
        
        setTimeout(() => {
          let data = CITY_DATA[cityId as keyof typeof CITY_DATA];
          
          if (!data && typeof cityId === 'string') {
            const cityKey = Object.keys(CITY_DATA).find(key => 
              CITY_DATA[key as keyof typeof CITY_DATA].name.toLowerCase() === cityId.toLowerCase()
            );
            
            if (cityKey) {
              data = CITY_DATA[cityKey as keyof typeof CITY_DATA];
            }
          }
          
          if (data) {
            console.log('City data found:', data);
            setCity(data);
          } else {
            console.log('No city data found for ID:', cityId);
            toast({
              title: "City Not Found",
              description: `Could not find city with ID: ${cityId}`,
            });
          }
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching city data:', error);
        toast({
          title: "Error",
          description: "Failed to load city data.",
        });
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchCityData();
    }
  }, [cityId, toast, authLoading]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (city?.name) {
        console.log('Attempting to fetch weather for city:', city.name);
        try {
          console.log('Making API call to weather service...');
          const weatherData = await getWeatherData(city.name);
          console.log('Weather API Response:', {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            condition: weatherData.condition
          });
          setWeather(weatherData);
        } catch (error) {
          console.error('Weather API Error:', error);
          toast({
            title: "Weather Error",
            description: "Failed to fetch weather data.",
            variant: "destructive"
          });
        }
      }
    };

    fetchWeather();
    // Update weather every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city?.name, toast]);

  useEffect(() => {
    let isMounted = true;
    const fetchTraffic = async () => {
      setTrafficLoading(true);
      try {
        let cityForTraffic = city?.name || '';
        if (cityId === 'nyc' || cityForTraffic.toLowerCase() === 'new york city') {
          cityForTraffic = 'New York City';
        }
        const data = await getGoogleTrafficData(cityForTraffic);
        if (isMounted) setTrafficData(data);
      } catch (error) {
        console.error('Error fetching initial traffic data:', error);
      } finally {
        if (isMounted) setTrafficLoading(false);
      }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 30000); // Poll every 30 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cityId, city?.name]);
  
  const handleTimeChange = (time: string) => {
    // This would typically fetch predicted traffic data for the selected time
    toast({
      title: "Time Selection",
      description: `Showing traffic prediction for ${time}`,
    });
  };

  const handleSearch = (query: string, coords?: [number, number]) => {
    // Handle search operations
    console.log('Searching for:', query, coords);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-white"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 rounded-full bg-[#083874]"
          />
          <motion.div 
            animate={{ 
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-4 w-32 bg-[#083874] rounded"
          />
        </motion.div>
      </motion.div>
    );
  }
  
  if (!city) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-[#111]"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md p-6 bg-purple-900/80 backdrop-blur-sm border-purple-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-100">City Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-400">
              The city you're looking for doesn't exist in our database.
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      <Navbar />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-[#083874]">{city.name}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="h-8 rounded-md border-[#083874] hover:bg-[#083874]/10">
                    {timeframe === 'now' ? 'Now' : timeframe}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-purple-900 border-purple-800">
                <DropdownMenuItem onClick={() => setTimeframe('now')} className="hover:bg-purple-800">Now</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe('pastWeek')} className="hover:bg-purple-800">Past Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe('pastMonth')} className="hover:bg-purple-800">Past Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe('pastYear')} className="hover:bg-purple-800">Past Year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="default" className="bg-[#083874] text-white hover:bg-[#083874]/90">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Get Help
            </Button>
          </motion.div>
        </motion.div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 bg-[#083874] backdrop-blur-sm p-1 rounded-lg border border-[#083874]">
            <TabsTrigger value="overview" className="rounded-md py-2 data-[state=active]:bg-[#083874] text-white data-[state=active]:text-yellow-400">Overview</TabsTrigger>
            <TabsTrigger value="traffic" className="rounded-md py-2 data-[state=active]:bg-[#083874] text-white data-[state=active]:text-yellow-400">Traffic</TabsTrigger>
            <TabsTrigger value="simulations" className="rounded-md py-2 data-[state=active]:bg-[#083874] text-white data-[state=active]:text-yellow-400">Simulations</TabsTrigger>
            <TabsTrigger value="environment" className="rounded-md py-2 data-[state=active]:bg-[#083874] text-white data-[state=active]:text-yellow-400">Environment</TabsTrigger>
            <TabsTrigger value="infrastructure" className="rounded-md py-2 data-[state=active]:bg-[#083874] text-white data-[state=active]:text-yellow-400">Infrastructure</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center text-gray-100">
                        <Car className="h-4 w-4 mr-2 text-gray-400" />
                        Traffic Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {trafficLoading ? (
                        <div className="flex items-center justify-center h-24">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100"></div>
                        </div>
                      ) : trafficData ? (
                        <>
                          <div className="space-y-4">
                            <div className="flex items-baseline">
                              <span className={`text-3xl font-bold ${getTrafficColor(trafficData.congestion)}`}>
                                {trafficData.congestion !== null ? Math.round(trafficData.congestion) + '%' : 'N/A'}
                              </span>
                              <span className="ml-2 text-gray-400">
                                congestion level
                              </span>
                            </div>
                            <div>
                              {trafficData.congestion !== null && (
                                <CustomProgress 
                                  value={trafficData.congestion} 
                                  className="h-2" 
                                  indicatorClassName={getProgressColor(trafficData.congestion)} 
                                />
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Current Speed:</span>
                                <span className="ml-2 font-medium text-gray-100">{trafficData.currentSpeed !== null ? Math.round(trafficData.currentSpeed) + ' km/h' : 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Free Flow:</span>
                                <span className="ml-2 font-medium text-gray-100">{trafficData.freeFlowSpeed !== null ? Math.round(trafficData.freeFlowSpeed) + ' km/h' : 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Delay:</span>
                                <span className="ml-2 font-medium text-gray-100">{trafficData.delay !== null ? Math.round(trafficData.delay / 60) + ' min' : 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Incidents:</span>
                                <span className="ml-2 font-medium text-gray-100">{trafficData.incidents}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-4">
                          Failed to load traffic data
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center text-gray-100">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        Population
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-blue-400">
                          {city.population.toLocaleString()}
                        </span>
                        <span className="ml-2 text-gray-400">
                          residents
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        A vibrant and growing urban center
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center text-gray-100">
                        <Cloud className="h-4 w-4 mr-2 text-gray-400" />
                        Air Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className={`text-3xl font-bold ${getAirQualityColor(city.airQuality)}`}>
                          {city.airQuality !== null ? city.airQuality + '%' : 'N/A'}
                        </span>
                        <span className="ml-2 text-gray-400">
                          quality index
                        </span>
                      </div>
                      <div className="mt-2">
                        {city.airQuality !== null && (
                          <CustomProgress value={city.airQuality} className="h-2" indicatorClassName={getProgressColor(city.airQuality)} />
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        {city.airQuality !== null ? getAirQualityText(city.airQuality) : 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-gray-100">3D City Model</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setExpandModel(!expandModel)} className="hover:bg-[#083874]/90">
                      {expandModel ? (
                        <>
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Expand
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className={cn(expandModel ? "h-[600px]" : "h-[400px]", "relative")}>
                    {city.name && city.name.toLowerCase() === 'dubai' ? (
                      <CityModel cityName="Dubai" expanded={expandModel} onToggleExpand={() => setExpandModel(!expandModel)} />
                    ) : cityId === 'nyc' ? (
                      <Google3DMap expanded={expandModel} center="40.7128, -74.0060" />
                    ) : cityId === 'london' ? (
                      <Google3DMap expanded={expandModel} center="51.5074, -0.1278" />
                    ) : cityId === 'tokyo' ? (
                      <Google3DMap expanded={expandModel} center="35.6895, 139.6917" />
                    ) : cityId === 'singapore' ? (
                      <Google3DMap expanded={expandModel} center="1.3521, 103.8198" />
                    ) : cityId === 'barcelona' ? (
                      <Google3DMap expanded={expandModel} center="41.3851, 2.1734" />
                    ) : cityId === 'sydney' ? (
                      <Google3DMap expanded={expandModel} center="-33.8688, 151.2093" />
                    ) : cityId === 'sanfrancisco' ? (
                      <Google3DMap expanded={expandModel} center="37.7749, -122.4194" />
                    ) : (
                      <Google3DMap expanded={expandModel} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-100">Weather Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <ThermometerSun className="mr-2 h-5 w-5 text-orange-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">
                              {weather ? `${weather.temperature}°C` : 'Loading...'}
                            </span>
                            <p className="text-sm text-gray-400">Temperature</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="mr-2 h-5 w-5 text-blue-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">
                              {weather ? `${weather.humidity}%` : 'Loading...'}
                            </span>
                            <p className="text-sm text-gray-400">Humidity</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Wind className="mr-2 h-5 w-5 text-gray-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">
                              {weather ? `${weather.windSpeed} km/h` : 'Loading...'}
                            </span>
                            <p className="text-sm text-gray-400">Wind Speed</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Cloud className="mr-2 h-5 w-5 text-green-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">
                              {weather ? weather.condition : 'Loading...'}
                            </span>
                            <p className="text-sm text-gray-400">Condition</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-gray-100">Mode of Transport</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Car className="mr-2 h-5 w-5 text-gray-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">{city.transportMode.car !== null ? city.transportMode.car + '%' : 'N/A'}</span>
                            <p className="text-sm text-gray-400">Car</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Bus className="mr-2 h-5 w-5 text-blue-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">{city.transportMode.publicTransport !== null ? city.transportMode.publicTransport + '%' : 'N/A'}</span>
                            <p className="text-sm text-gray-400">Public Transport</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <AreaChart className="mr-2 h-5 w-5 text-green-400" />
                          <div>
                            <span className="text-lg font-semibold text-gray-100">{city.transportMode.bicycle !== null ? city.transportMode.bicycle + '%' : 'N/A'}</span>
                            <p className="text-sm text-gray-400">Bicycle</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874] hover:border-[#083874]/90 transition-colors duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-100">Traffic Hotspots</CardTitle>
                    <div className="text-sm text-gray-400">
                      Last updated: {trafficData ? new Date(trafficData.lastUpdated).toLocaleTimeString() : 'N/A'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {trafficData?.hotspots.map((hotspot) => (
                        <div 
                          key={hotspot.id} 
                          className="border border-gray-800 rounded-lg p-4 bg-gray-900/50 backdrop-blur-sm hover:border-gray-700 transition-colors duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-white">{hotspot.name}</h3>
                            <span className={cn(
                              "text-sm px-2 py-0.5 rounded-full",
                              hotspot.congestion !== null && hotspot.congestion > 80 
                                ? "bg-red-900/20 text-red-300" 
                                : hotspot.congestion !== null && hotspot.congestion > 60 
                                  ? "bg-amber-900/20 text-amber-300" 
                                  : "bg-green-900/20 text-green-300" 
                            )}>
                              {hotspot.congestion !== null ? Math.round(hotspot.congestion) + '%' : 'N/A'}
                            </span>
                          </div>
                          <div className="mt-2">
                            {hotspot.congestion !== null && (
                              <CustomProgress 
                                value={hotspot.congestion} 
                                className="h-1.5" 
                                indicatorClassName={getProgressColor(hotspot.congestion)} 
                              />
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-400 grid grid-cols-2 gap-2">
                            <div>Speed: {hotspot.currentSpeed !== null ? Math.round(hotspot.currentSpeed) + ' km/h' : 'N/A'}</div>
                            <div>Delay: {hotspot.delay !== null ? Math.round(hotspot.delay / 60) + ' min' : 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
          
          <TabsContent value="traffic">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Live Traffic Map</CardTitle>
                </CardHeader>
                <CardContent>
                  {trafficLoading ? (
                    <div className="flex items-center justify-center h-[600px]">
                      <span className="loading loading-ring loading-lg"></span>
                    </div>
                  ) : (
                    <GoogleTrafficMap 
                      center={
                        cityId === 'london' ? '51.5074, -0.1278' :
                        cityId === 'tokyo' ? '35.6895, 139.6917' :
                        cityId === 'singapore' ? '1.3521, 103.8198' :
                        cityId === 'barcelona' ? '41.3851, 2.1734' :
                        cityId === 'sydney' ? '-33.8688, 151.2093' :
                        cityId === 'sanfrancisco' ? '37.7749, -122.4194' :
                        cityId === 'dubai' ? '25.2048, 55.2708' :
                        '40.7128, -74.0060'
                      }
                    />
                  )}
                </CardContent>
              </Card>

              {/* Traffic Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874]">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Traffic Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Peak Hours</span>
                        <span className="text-sm font-medium text-white">8:00 AM - 10:00 AM, 5:00 PM - 7:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Current Trend</span>
                        <span className={trend === 'improving' ? 'text-green-400' : trend === 'worsening' ? 'text-red-400' : 'text-yellow-400'}>
                          {trend.charAt(0).toUpperCase() + trend.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Predicted Next Hour</span>
                        <span className={trend === 'worsening' ? 'text-red-400' : trend === 'improving' ? 'text-green-400' : 'text-yellow-400'}>
                          {prediction}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Alerts Panel */}
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874]">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Live Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trafficData && trafficData.incidentDetails && trafficData.incidentDetails.length > 0 ? (
                        trafficData.incidentDetails.map((incident, index) => (
                          <div key={incident.id || index} className="flex items-start space-x-4 p-3 rounded-lg bg-red-900/20 border border-red-900/30">
                            <div className="h-2 w-2 mt-2 rounded-full bg-red-500" />
                            <div>
                              <h4 className="font-medium text-red-300">{incident.type.replace(/_/g, ' ')}</h4>
                              <p className="text-sm text-gray-400">{incident.description || 'Incident reported'}{incident.roadNumbers ? ` on ${incident.roadNumbers.join(', ')}` : ''}</p>
                              {incident.from && incident.to && (
                                <p className="text-xs text-gray-500">From: {incident.from} To: {incident.to}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-4">
                          No active alerts at this time
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Route Analysis */}
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874]">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Popular Routes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trafficData?.hotspots.map((hotspot, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{hotspot.name}</span>
                            <span className={cn(
                              "text-sm px-2 py-0.5 rounded-full",
                              hotspot.congestion !== null && hotspot.congestion > 80 ? "bg-red-900/20 text-red-300" :
                              hotspot.congestion !== null && hotspot.congestion > 60 ? "bg-amber-900/20 text-amber-300" :
                              "bg-green-900/20 text-green-300"
                            )}>
                              {hotspot.currentSpeed !== null ? Math.round(hotspot.currentSpeed) + ' km/h' : 'N/A'}
                            </span>
                          </div>
                          {hotspot.congestion !== null && (
                            <CustomProgress 
                              value={hotspot.congestion} 
                              className="h-1.5" 
                              indicatorClassName={getProgressColor(hotspot.congestion)} 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Traffic Cameras */}
                <Card className="bg-[#083874] backdrop-blur-sm border-[#083874]">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white">Traffic Cameras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {trafficData?.hotspots.slice(0, 4).map((hotspot, index) => (
                        <div key={index} className="relative aspect-video rounded-lg bg-gray-900 overflow-hidden group">
                          {/* Animated background elements */}
                          <div className="absolute inset-0 opacity-80">
                            <div 
                              className={`absolute w-full h-full bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-indigo-900/40 opacity-70`}
                              style={{ transform: 'scale(1.1)' }}
                            />
                            <div 
                              className="absolute w-32 h-32 rounded-full bg-blue-500/20 blur-lg"
                              style={{ 
                                top: '10%', 
                                left: '20%',
                                animation: `float-slow ${12 + index * 2}s ease-in-out infinite` 
                              }}
                            />
                            <div 
                              className="absolute w-24 h-24 rounded-full bg-purple-500/20 blur-lg"
                              style={{ 
                                bottom: '20%', 
                                right: '10%',
                                animation: `float-reverse ${14 + index}s ease-in-out infinite` 
                              }}
                            />
                          </div>
                          
                          {/* Camera icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full w-10 h-10 border-2 border-gray-400/30 flex items-center justify-center mb-16 group-hover:scale-110 transition-transform">
                              <div className="rounded-full w-5 h-5 bg-gray-400/30 group-hover:bg-blue-400/50 transition-colors"></div>
                            </div>
                          </div>
                          
                          {/* Future work text with animation - matching infrastructure page style */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative text-center px-3 py-2 transform -translate-y-1">
                              {/* Recreate the exact infrastructure page animation style */}
                              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-1"
                                style={{ 
                                  animation: `pulse-slow 3s ease-in-out infinite`,
                                  backgroundSize: '300% 300%',
                                  backgroundPosition: `0% 50%`
                                }}
                              >
                                FUTURE WORK
                              </h3>
                              <p className="text-xs text-muted-foreground animate-pulse-slow opacity-90">
                                Coming Soon
                              </p>
                            </div>
                          </div>
                          
                          {/* Location name with animation */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                          >
                            <div className="text-sm text-white font-medium">{hotspot.name}</div>
                            <div className="text-xs text-blue-300 mt-0.5">Coming Soon</div>
                          </div>
                          
                          {/* Minimal label when not hovering */}
                          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded group-hover:opacity-0 transition-opacity">
                            {hotspot.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="simulations">
            <div className="space-y-6">
              <SimulationPanel projectId="default" />
            </div>
          </TabsContent>
          
          <TabsContent value="environment">
            <div className="space-y-6">
              <EnvironmentPanel />
            </div>
          </TabsContent>
          
          <TabsContent value="infrastructure">
            <div className="flex flex-col items-center justify-center min-h-[70vh] overflow-hidden relative">
              {/* Simplified background - reduced number of elements */}
              <div className="absolute inset-0 opacity-50">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl transform animate-float-slow" />
                <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl transform animate-float-reverse" />
              </div>
              
              {/* Main content container */}
              <div className="text-center relative z-10 px-4">
                {/* More efficient wavy text implementation */}
                <h2 className="relative mb-6 pb-2 overflow-hidden">
                  <span className="sr-only">FUTURE WORK</span>
                  <div className="flex justify-center items-center">
                    {["F", "U", "T", "U", "R", "E", " ", "W", "O", "R", "K"].map((letter, index) => (
                      <div 
                        key={index} 
                        className={`relative inline-block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight ${letter === " " ? "w-8 md:w-12" : ""}`}
                        style={{ 
                          animation: letter !== " " ? `wave-${index % 5} 2.5s ease-in-out infinite` : '',
                          animationDelay: `${index * 0.08}s`
                        }}
                      >
                        {letter !== " " && (
                          <span 
                            className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 will-change-transform"
                            style={{ 
                              display: 'inline-block',
                              animationDelay: `${index * 0.08}s`,
                              animationDuration: '0.8s',
                              animationFillMode: 'both',
                              animationName: 'fadeIn',
                              backgroundSize: '200% 200%',
                              backgroundPosition: `${index * 10 % 100}% 50%`
                            }}
                          >
                            {letter}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </h2>
                
                {/* Simplified coming soon animation */}
                <div 
                  className="text-2xl sm:text-3xl text-muted-foreground font-semibold animate-pulse-slow"
                >
                  Coming Soon
                </div>
              </div>
              
              {/* Description with simpler animation */}
              <div 
                className="mt-20 max-w-xl text-center relative z-10 px-4 animate-fade-in-up"
              >
                <p className="text-lg text-muted-foreground">
                  Our team is working on advanced infrastructure visualization and management tools for {city.name}.
                  Check back soon for updates on this exciting new feature.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
