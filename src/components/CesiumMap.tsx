import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzNmZGFhOC04MWE3LTQ4OWItOWJkNi0wYTBjM2QyNTU2ZjkiLCJpZCI6Mjk4OTEzLCJpYXQiOjE3NDYxNTQxMDR9.a-UKtptQbSQH-7uaMH8YMU8ZQbVO1lunFvcpJ5Q_zio';

interface CesiumMapProps {
  className?: string;
  onExpand?: () => void;
}

const CesiumMap: React.FC<CesiumMapProps> = ({ className, onExpand }) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewer = useRef<Cesium.Viewer | null>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    const initViewer = async () => {
      try {
        // Enable simultaneous requests
        (Cesium.RequestScheduler as any).requestsByServer["tile.googleapis.com:443"] = 18;

        // Create viewer with minimal configuration exactly as in docs
        viewer.current = new Cesium.Viewer(cesiumContainer.current as Element, {
          baseLayerPicker: false,
          geocoder: false,
          requestRenderMode: true
        });

        // Add 3D Tiles tileset exactly as in docs
        const tileset = viewer.current.scene.primitives.add(
          new Cesium.Cesium3DTileset({
            url: 'https://tile.googleapis.com/v1/3dtiles/maps/d13389310f2eab3/root.json?key=AIzaSyCXvxLimBjci5y8kORJjoQgpq0kRW6Bj5g',
            showCreditsOnScreen: true
          } as any)
        );

        // Log tileset loading status
        tileset.readyPromise
          .then(() => {
            console.log('Tileset loaded successfully');
            
            // Set initial camera position to Dubai after tileset is loaded
            viewer.current?.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(55.2708, 25.2048, 500),
              orientation: {
                heading: Cesium.Math.toRadians(45),
                pitch: Cesium.Math.toRadians(-35),
                roll: 0
              }
            });
          })
          .catch((error: Error) => {
            console.error('Error loading tileset:', error);
          });

        // Initialize Google Places Autocomplete
        if (autocompleteRef.current && window.google) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
            types: ['geocode'],
            fields: ['name', 'geometry']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.viewport) return;

            const bounds = place.geometry.viewport;
            
            viewer.current?.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
                (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
                500
              ),
              orientation: {
                heading: Cesium.Math.toRadians(45),
                pitch: Cesium.Math.toRadians(-35),
                roll: 0
              },
              duration: 3
            });
          });
        }

      } catch (error) {
        console.error('Error initializing Cesium viewer:', error);
      }
    };

    initViewer();

    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className || ''}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={cesiumContainer} className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <div className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Fly to a place
        </div>
        <input
          ref={autocompleteRef}
          type="text"
          placeholder="Enter a location..."
          className="w-64 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
        >
          <span className="sr-only">Expand</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-2V4m0 0h-4m4 0l5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default CesiumMap; 