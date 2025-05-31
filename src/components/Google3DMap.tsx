// Optimization: The Google Maps JS API script should be loaded globally in public/index.html for best performance.
// This component will show a loading spinner until the <gmp-map-3d> element is defined.

import React, { useEffect, useRef } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCXvxLimBjci5y8kORJjoQgpq0kRW6Bj5g';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface Google3DMapProps {
  expanded?: boolean;
  center?: string;
  range?: string;
  tilt?: string;
  heading?: string;
}

const Google3DMap: React.FC<Google3DMapProps> = ({ expanded, center, range, tilt, heading }) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current) {
      // Dispatch a resize event to the gmp-map-3d element
      setTimeout(() => {
        mapRef.current.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [expanded]);

  useEffect(() => {
    const handleFlyAnimations = async () => {
      const map = mapRef.current as HTMLElement & { flyCameraTo?: Function; flyCameraAround?: Function; addEventListener?: Function };
      if (!map) return;
      // Wait for the custom element to be defined and Google Maps library to be loaded
      if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.importLibrary) return;
      await (window as any).google.maps.importLibrary('maps3d');
      const flyToCamera = {
        center: center ? {
          lat: parseFloat(center.split(',')[0]),
          lng: parseFloat(center.split(',')[1])
        } : { lat: 25.2048, lng: 55.2708 },
        tilt: tilt ? parseFloat(tilt) : 67.5,
        range: range ? parseFloat(range) : 1000
      };
      // Fly to Dubai
      map.flyCameraTo && map.flyCameraTo({
        endCamera: flyToCamera,
        durationMillis: 5000
      });
      // When fly-to ends, rotate around
      map.addEventListener && map.addEventListener('gmp-animation-end', () => {
        map.flyCameraAround && map.flyCameraAround({
          camera: flyToCamera,
          durationMillis: 10000,
          rounds: 1
        });
      }, { once: true });
    };
    // Wait a bit for the map to be defined
    const timeout = setTimeout(handleFlyAnimations, 1000);
    return () => clearTimeout(timeout);
  }, [center, range, tilt, heading]);

  return (
    <gmp-map-3d
      ref={mapRef}
      {...{
        mode: 'hybrid',
        center: center || '25.2048, 55.2708',
        range: range || '2000',
        tilt: tilt || '75',
        heading: heading || '330',
        style: { width: '100%', height: '100%', display: 'block' }
      } as any}
    />
  );
};

export default Google3DMap; 