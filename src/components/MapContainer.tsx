import React from 'react';
import GoogleMap from './GoogleMap';

interface MapContainerProps {
  className?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ className }) => {
  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {/* Map Container */}
      <div id="cesiumContainer" className="w-full h-full">
        <GoogleMap className="w-full h-full" />
      </div>

      {/* Search Card */}
      <div className="pac-card absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-4 max-w-sm w-full backdrop-blur-sm" id="pac-card">
        <div id="title" className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Fly to a place
        </div>
        <div id="pac-container" className="relative">
          <input
            className="pac-input w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            type="text"
            id="pac-input"
            name="pac-input"
            placeholder="Enter a location..."
          />
        </div>
      </div>
    </div>
  );
};

export default MapContainer; 