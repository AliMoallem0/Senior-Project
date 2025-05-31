import axios from 'axios';

const WEATHER_API_KEY = '3472b565cdbd420395b154922251304'; // This key might be expired
const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  usingFallback?: boolean;
}

// Fallback weather data for when the API request fails
const FALLBACK_WEATHER_DATA: Record<string, WeatherData> = {
  default: {
    temperature: 24,
    humidity: 65,
    windSpeed: 12,
    condition: "Partly cloudy",
    icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    usingFallback: true
  },
  dubai: {
    temperature: 35,
    humidity: 58,
    windSpeed: 14,
    condition: "Sunny",
    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
    usingFallback: true
  },
  london: {
    temperature: 15,
    humidity: 78,
    windSpeed: 18,
    condition: "Light rain",
    icon: "//cdn.weatherapi.com/weather/64x64/day/296.png",
    usingFallback: true
  },
  nyc: {
    temperature: 22,
    humidity: 62,
    windSpeed: 16,
    condition: "Partly cloudy", 
    icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    usingFallback: true
  },
  tokyo: {
    temperature: 26,
    humidity: 70,
    windSpeed: 10,
    condition: "Overcast",
    icon: "//cdn.weatherapi.com/weather/64x64/day/122.png",
    usingFallback: true
  },
  paris: {
    temperature: 18,
    humidity: 68,
    windSpeed: 12,
    condition: "Clear",
    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
    usingFallback: true
  }
};

export const getWeatherData = async (city: string): Promise<WeatherData> => {
  // Try to get the city's lowercase name without spaces for matching with fallback data
  const normalizedCity = city.toLowerCase().replace(/\s+/g, '');
  const cityKey = Object.keys(FALLBACK_WEATHER_DATA).find(key => 
    normalizedCity.includes(key) || key.includes(normalizedCity)
  ) || "default";
  
  try {
    // Use specific coordinates for Dubai to get more accurate results
    const location = city.toLowerCase() === 'dubai' ? '25.2048,55.2708' : city;
    
    console.log('Weather API Request:', {
      url: WEATHER_API_URL,
      location: location,
      apiKey: WEATHER_API_KEY ? 'Present' : 'Missing'
    });
    
    // Set a shorter timeout for presentation purposes
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        key: WEATHER_API_KEY,
        q: location,
        aqi: 'no'
      },
      timeout: 2000 // 2 second timeout for faster fallback
    });

    console.log('Weather API Raw Response:', {
      location: response.data.location,
      current: response.data.current
    });
    
    const weatherData = {
      temperature: response.data.current.temp_c,
      humidity: response.data.current.humidity,
      windSpeed: response.data.current.wind_kph,
      condition: response.data.current.condition.text,
      icon: response.data.current.condition.icon
    };
    
    console.log('Processed Weather Data:', weatherData);
    return weatherData;
    
  } catch (error) {
    console.error('Weather API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    console.log(`Using fallback weather data for ${city} (matched with ${cityKey})`);
    return FALLBACK_WEATHER_DATA[cityKey];
  }
}; 