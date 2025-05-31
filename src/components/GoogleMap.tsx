import React, { useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface MapProps {
  className?: string;
  onExpand?: () => void;
}

const MapComponent: React.FC<MapProps> = ({ className, onExpand }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapIds: ['YOUR_MAP_ID_HERE'], // You'll need to create a Map ID in Google Cloud Console
    libraries: ['places']
  });

  const mapOptions = {
    tilt: 45,
    heading: 0,
    mapId: 'YOUR_MAP_ID_HERE', // Same Map ID as above
    disableDefaultUI: true,
    mapTypeId: 'satellite',
    center: { lat: 25.2048, lng: 55.2708 }, // Dubai coordinates
    zoom: 18,
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    const input = document.getElementById('pac-input') as HTMLInputElement;
    const searchBox = new google.maps.places.SearchBox(input);

    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      places.forEach(place => {
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });

      map.fitBounds(bounds);
      // Adjust zoom level for single location
      if (places.length === 1) {
        map.setZoom(18);
      }
    });
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-red-900/20 rounded-lg p-4">
        <p className="text-red-400">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900/20 rounded-lg p-4">
        <p className="text-gray-400">Loading maps...</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      <GoogleMap
        mapContainerClassName="w-full h-full rounded-lg overflow-hidden"
        options={mapOptions}
        onLoad={onMapLoad}
      />
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
        >
          <span className="sr-only">Expand</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-2V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MapComponent; 