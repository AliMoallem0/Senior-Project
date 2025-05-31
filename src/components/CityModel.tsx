/**
 * CityModel Component
 * 
 * A 3D visualization component that renders a city model using MapLibre GL JS.
 * Features:
 * - 3D terrain and buildings from OpenFreeMap
 * - Interactive camera controls
 * - Building visualization with categories
 * - Terrain analysis
 * - Responsive design
 * - Dark mode support
 * - Expandable/collapsible view
 */

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Locate } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface CityModelProps {
  cityName: string;     // Name of the city to display
  expanded?: boolean;   // Whether the model is in expanded view
  onToggleExpand?: () => void;  // Callback for expanding/collapsing
}

// Function to geocode a city name to coordinates
const geocodeCity = async (cityName: string): Promise<{ lat: number; lon: number } | null> => {
  // Special handling for Dubai to focus on Burj Khalifa
  if (cityName.toLowerCase() === 'dubai') {
    return {
      lat: 25.197197,  // Burj Khalifa latitude
      lon: 55.274376   // Burj Khalifa longitude
    };
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'OSAT Urban Simulator'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

const CityModel = ({ cityName, expanded = false, onToggleExpand }: CityModelProps) => {
  // Refs for DOM elements and state management
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  // Geocode the city name
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      const coords = await geocodeCity(cityName);
      setCoordinates(coords);
      setLoading(false);
    };
    
    fetchCoordinates();
  }, [cityName]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapContainer.current) return;

    const isDubai = cityName.toLowerCase() === 'dubai';
    
    // Create MapLibre map instance with special settings for Dubai
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: coordinates ? [coordinates.lon, coordinates.lat] : [-122.4194, 37.7749],
      zoom: isDubai ? 17 : 15,  // Higher zoom for Burj Khalifa
      pitch: isDubai ? 70 : 60, // Higher pitch for Burj Khalifa
      bearing: isDubai ? 45 : 0  // Angled view for Burj Khalifa
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add 3D terrain
    mapInstance.on('load', () => {
      // Enable terrain with higher exaggeration for Dubai
      mapInstance.setTerrain({ 
        source: 'mapbox-dem', 
        exaggeration: isDubai ? 2.0 : 1.5 
      });

      // Enhance building heights for Dubai
      const heightMultiplier = isDubai ? 1.5 : 1.0;  // Increase building heights for Dubai

      // Add building layers with more realistic appearance
      mapInstance.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'match',
            ['get', 'building'],
            'residential', [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#4a90e2',
              50, '#3a7bc8',
              100, '#2a66ae',
              200, '#1a5194',
              '#4a90e2'
            ],
            'commercial', [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#e25c5c',
              50, '#c84a4a',
              100, '#ae3838',
              200, '#942626',
              '#e25c5c'
            ],
            'industrial', [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#f2c94c',
              50, '#d4b13e',
              100, '#b69930',
              200, '#988122',
              '#f2c94c'
            ],
            'office', [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#27ae60',
              50, '#219653',
              100, '#1b7e46',
              200, '#156639',
              '#27ae60'
            ],
            '#95a5a6'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, [
              '*',
              heightMultiplier,
              [
                'max',
                ['get', 'height'],
                ['get', 'min_height']
              ]
            ]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.85
        }
      });

      // Add building roofs for more realism
      mapInstance.addLayer({
        id: 'building-roofs',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#ffffff',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, [
              'max',
              ['get', 'height'],
              ['get', 'min_height']
            ]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, [
              'max',
              ['get', 'height'],
              ['get', 'min_height']
            ]
          ],
          'fill-extrusion-opacity': 0.3
        }
      });

      // Add building shadows
      mapInstance.addLayer({
        id: 'building-shadows',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, [
              'max',
              ['get', 'height'],
              ['get', 'min_height']
            ]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, 0
          ],
          'fill-extrusion-opacity': 0.2
        }
      });

      // Add click handler for buildings
      mapInstance.on('click', '3d-buildings', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          setSelectedBuilding(feature.properties?.building || 'Unknown');
        }
      });

      // Change cursor on hover
      mapInstance.on('mouseenter', '3d-buildings', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', '3d-buildings', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });

    // Store map reference
    map.current = mapInstance;

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [coordinates, cityName]);  // Added cityName to dependencies

  // Handle camera reset with special handling for Dubai
  const resetView = () => {
    if (!map.current || !coordinates) return;
    
    const isDubai = cityName.toLowerCase() === 'dubai';
    
    map.current.flyTo({
      center: [coordinates.lon, coordinates.lat],
      zoom: isDubai ? 17 : 15,
      pitch: isDubai ? 70 : 60,
      bearing: isDubai ? 45 : 0,
      duration: 2000
    });
  };

  // Resize map when expanded/collapsed
  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [expanded]);

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden border transition-all duration-500",
        "border-gray-200 dark:border-gray-800 bg-white dark:bg-black",
        expanded ? "h-[80vh]" : "h-[350px]"
      )}
    >
      {/* MapLibre Container */}
      <div 
        ref={mapContainer}
        className="w-full h-full"
      />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-t-osat-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Loading 3D view...</p>
          </div>
        </div>
      )}

      {/* Building Info */}
      {selectedBuilding && (
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 p-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Building Type: {selectedBuilding}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="bg-white/30 dark:bg-black/30 backdrop-blur-sm"
          onClick={resetView}
        >
          <Locate size={16} />
        </Button>
        {onToggleExpand && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="bg-white/30 dark:bg-black/30 backdrop-blur-sm"
            onClick={onToggleExpand}
          >
            {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CityModel;
