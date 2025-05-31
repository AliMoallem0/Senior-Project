import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TOMTOM_API_KEY, TOMTOM_ENDPOINTS, TrafficData, DUBAI_HOTSPOTS } from '@/services/trafficService';
import { toast } from "@/components/ui/use-toast";
import TrafficLegend from './TrafficLegend';
import TrafficControls from './TrafficControls';
import TrafficMetrics from './TrafficMetrics';

interface TrafficMapProps {
  cityName: string;
  center: [number, number];
  zoom?: number;
  trafficData?: TrafficData;
  onSearch: (query: string, coords?: [number, number]) => void;
}

const TrafficMap = ({ cityName, center, zoom = 13, trafficData, onSearch }: TrafficMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const errorShownRef = useRef(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [historicalData, setHistoricalData] = useState<{ time: string; congestion: number; }[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix for the default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(center, zoom);
      
      mapRef.current = map;
      setMap(map);

      // Add OpenStreetMap base layer
      const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add traffic flow layer
      const trafficFlow = L.tileLayer(TOMTOM_ENDPOINTS.trafficFlow('{z}', '{x}', '{y}'), {
        maxZoom: 22,
        opacity: 0.7,
        tileSize: 256,
        attribution: '© TomTom'
      }).addTo(map);

      // Add traffic incidents layer
      const trafficIncidents = L.tileLayer(TOMTOM_ENDPOINTS.trafficIncidents('{z}', '{x}', '{y}'), {
        maxZoom: 22,
        tileSize: 256,
        attribution: '© TomTom'
      }).addTo(map);

      // Add layer controls
      const overlayMaps = {
        "Traffic Flow": trafficFlow,
        "Traffic Incidents": trafficIncidents
      };

      L.control.layers({}, overlayMaps, {
        collapsed: false,
        position: 'topright'
      }).addTo(map);

      // Add scale control
      L.control.scale().addTo(map);

      // Error handling for traffic layers
      trafficFlow.on('tileerror', (error) => {
        console.error('Traffic flow layer error:', {
          url: error.tile.src,
          error: error,
          apiKey: TOMTOM_API_KEY ? 'configured' : 'missing'
        });
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          toast({
            title: "Traffic Layer Error",
            description: TOMTOM_API_KEY 
              ? "Failed to load traffic data. Please check your internet connection."
              : "TomTom API key is not configured. Please check your environment setup.",
            variant: "destructive"
          });
        }
      });

      trafficIncidents.on('tileerror', (error) => {
        console.error('Traffic incidents layer error:', {
          url: error.tile.src,
          error: error
        });
      });

      // Add click handler for road information
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await fetch(
            `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=${TOMTOM_API_KEY}&point=${lat},${lng}`
          );
          const data = await response.json();
          if (data.flowSegmentData) {
            L.popup()
              .setLatLng(e.latlng)
              .setContent(`
                <div class="font-bold">Road Information</div>
                <div>Current Speed: ${Math.round(data.flowSegmentData.currentSpeed)} km/h</div>
                <div>Free Flow Speed: ${Math.round(data.flowSegmentData.freeFlowSpeed)} km/h</div>
              `)
              .openOn(map);
          }
        } catch (error) {
          console.error('Error fetching road information:', error);
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Error",
        description: "Failed to initialize map. Please try refreshing the page.",
        variant: "destructive"
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [center, zoom]);

  // Handle search with coordinates
  const handleSearch = useCallback((query: string, coords?: [number, number]) => {
    if (mapRef.current && coords) {
      mapRef.current.setView(coords, 14);
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new marker
      const marker = L.marker(coords)
        .addTo(mapRef.current)
        .bindPopup(query)
        .openPopup();
      
      markersRef.current.push(marker);
    }
    onSearch(query, coords);
  }, [onSearch]);

  // Update markers when traffic data changes
  useEffect(() => {
    if (!mapRef.current || !trafficData) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers for each hotspot
      trafficData.hotspots.forEach((hotspot) => {
        const hotspotLocation = DUBAI_HOTSPOTS.find(h => h.name === hotspot.name);
        if (!hotspotLocation) {
          console.warn(`No location found for hotspot: ${hotspot.name}`);
          return;
        }

        const marker = L.marker([hotspotLocation.coordinates.lat, hotspotLocation.coordinates.lon])
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <div class="font-bold mb-1">${hotspot.name}</div>
              <div class="grid grid-cols-2 gap-1">
                <div>Congestion:</div>
                <div class="text-right">${hotspot.congestion}%</div>
                <div>Speed:</div>
                <div class="text-right">${hotspot.currentSpeed} km/h</div>
                <div>Delay:</div>
                <div class="text-right">${hotspot.delay} min</div>
              </div>
            </div>
          `);
        markersRef.current.push(marker);
      });

      // Update historical data
      setHistoricalData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          congestion: trafficData.congestion
        }].slice(-12); // Keep last 12 data points
        return newData;
      });
    } catch (error) {
      console.error('Error updating traffic markers:', error);
      toast({
        title: "Traffic Update Error",
        description: "Failed to update traffic markers on the map.",
        variant: "destructive"
      });
    }
  }, [trafficData]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clear all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  const handleLocationClick = () => {
    if (!map) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Could not get your current location.",
          variant: "destructive"
        });
      }
    );
  };

  const handleTimeChange = (time: string) => {
    // This would typically fetch predicted traffic data for the selected time
    toast({
      title: "Time Selection",
      description: `Showing traffic prediction for ${time}`,
    });
  };

  const isRushHour = () => {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  };

  return (
    <div className="relative flex flex-col gap-4">
      <div className="relative"> {/* Map container */}
        <div 
          ref={mapContainerRef} 
          style={{ 
            height: '600px', 
            width: '100%', 
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }} 
          className={theme === 'dark' ? 'map-dark' : ''}
        />
        
        <TrafficControls
          onSearch={handleSearch}
          onTimeChange={handleTimeChange}
          onThemeChange={setTheme}
          onLocationClick={handleLocationClick}
          theme={theme}
        />

        <TrafficLegend
          isRushHour={isRushHour()}
        />
      </div>

      {/* Animated metrics section */}
      {trafficData && (
        <div className="bg-gray-50/50 backdrop-blur-sm rounded-lg p-4">
          <TrafficMetrics
            congestion={trafficData.congestion}
            speed={trafficData.currentSpeed}
            delay={trafficData.delay}
            incidents={trafficData.incidents}
          />
        </div>
      )}
    </div>
  );
};

export default TrafficMap; 