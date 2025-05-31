import React, { useEffect, useRef } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCXvxLimBjci5y8kORJjoQgpq0kRW6Bj5g'; 

interface GoogleTrafficMapProps {
  center?: string | [number, number]; // e.g., '40.7128, -74.0060' or [40.7128, -74.0060]
}

const GoogleTrafficMap: React.FC<GoogleTrafficMapProps> = ({ center }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse center
    let lat = 40.7128, lng = -74.0060; // Default: New York
    if (center) {
      if (typeof center === 'string') {
        const [latStr, lngStr] = center.split(',').map(s => s.trim());
        lat = parseFloat(latStr);
        lng = parseFloat(lngStr);
      } else if (Array.isArray(center)) {
        lat = center[0];
        lng = center[1];
      }
    }

    // Load Google Maps script if not already loaded
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !(window as any).google) return;
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 13,
        mapTypeId: 'roadmap',
      });

      // Add the traffic layer
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(map);
    }
  }, [center]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 12, overflow: 'hidden' }}
    />
  );
};

export default GoogleTrafficMap; 