import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer, Marker, InfoWindow, LoadScript, Libraries } from '@react-google-maps/api';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MapLocation {
  lat: number;
  lng: number;
}

interface MapPoint extends MapLocation {
  weight?: number;
  area?: string;
  value?: number;
  label?: string;
  details?: {
    [key: string]: string | number;
  };
}

interface EnvironmentMapProps {
  center: MapLocation;
  zoom?: number;
  points: MapPoint[];
  mapType: 'heatmap' | 'markers';
  mapLabel: string;
  colorGradient?: string[];
  legendItems?: Array<{
    color: string;
    label: string;
  }>;
}

const defaultOptions = {
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

export const EnvironmentMap = ({
  center,
  zoom = 12,
  points,
  mapType,
  mapLabel,
  colorGradient = [
    'rgba(0, 255, 0, 0)',
    'rgba(0, 255, 0, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(255, 128, 0, 1)',
    'rgba(255, 0, 0, 1)'
  ],
  legendItems
}: EnvironmentMapProps) => {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  
  const libraries: Libraries = ['visualization'];
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });
  
  const onMapClick = useCallback(() => {
    setSelectedPoint(null);
  }, []);
  
  // Create heatmap data only when Google Maps is available
  const createHeatmapData = useCallback(() => {
    if (!window.google?.maps) return [];
    
    try {
      return points.map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        weight: point.weight || 1.0
      }));
    } catch (error) {
      console.error('Error creating heatmap data:', error);
      return [];
    }
  }, [points]);
  
  // This state will hold the heatmap data once Google Maps is loaded
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  
  // Update heatmap data when Google Maps is loaded
  const onGoogleApiLoaded = useCallback(() => {
    console.log('Google Maps API loaded successfully');
    setHeatmapData(createHeatmapData());
  }, [createHeatmapData]);

  const heatmapOptions = useMemo(() => {
    return {
      radius: 20,
      opacity: 0.7,
      gradient: colorGradient,
      maxIntensity: 1.0,
      dissipating: true
    };
  }, [colorGradient]);



  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Fallback component for map errors
  const renderFallback = () => (
    <div className="space-y-2">
      <div className="font-medium text-sm">{mapLabel}</div>
      <div className="rounded-lg overflow-hidden border bg-gray-100 p-4 text-center h-[400px] flex flex-col items-center justify-center">
        <div className="text-muted-foreground mb-2">Unable to load map visualization</div>
        <div className="text-sm text-muted-foreground">Please check your internet connection or API key configuration</div>
      </div>
    </div>
  );

  // If API key is missing or empty
  if (!apiKey) {
    return renderFallback();
  }

  return (
    <div className="space-y-2">
      <div className="font-medium text-sm">{mapLabel}</div>
      <div className="rounded-lg overflow-hidden border">
        <LoadScript
          googleMapsApiKey={apiKey}
          libraries={libraries}
          onLoad={onGoogleApiLoaded}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            options={defaultOptions}
            onClick={onMapClick}
          >
            {mapType === 'heatmap' && heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={heatmapOptions}
              />
            )}
            {mapType === 'markers' && points.map((point, index) => (
              <Marker
                key={index}
                position={{ lat: point.lat, lng: point.lng }}
                onClick={() => setSelectedPoint(point)}
              />
            ))}
            {selectedPoint && (
              <InfoWindow
                position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
                onCloseClick={() => setSelectedPoint(null)}
              >
                <div className="p-2">
                  {selectedPoint.area && <div className="font-medium">{selectedPoint.area}</div>}
                  {selectedPoint.value && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span>{selectedPoint.label || 'Value'}:</span>
                      <span className="font-medium">{selectedPoint.value}</span>
                    </div>
                  )}
                  {selectedPoint.details && Object.entries(selectedPoint.details).map(([key, value], i) => (
                    <div key={i} className="text-sm flex gap-1.5 mt-0.5">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
      
      {legendItems && (
        <div className="flex items-center text-xs space-x-4 pt-2">
          <span className="font-medium">Legend:</span>
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 mr-1" 
                style={{ backgroundColor: item.color, borderRadius: '50%' }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnvironmentMap;
