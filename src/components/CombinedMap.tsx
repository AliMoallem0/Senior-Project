import React, { useState } from 'react';
import CesiumMap from './CesiumMap';
import GoogleMap from './GoogleMap';

interface CombinedMapProps {
  className?: string;
}

const CombinedMap: React.FC<CombinedMapProps> = ({ className }) => {
  const [activeMap, setActiveMap] = useState<'cesium' | 'google'>('google');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`relative ${className || ''}`}>
      {/* Map Container */}
      <div className="relative w-full h-full">
        {/* Google Maps */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeMap === 'google' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <GoogleMap onExpand={() => setIsExpanded(!isExpanded)} />
        </div>
        
        {/* Cesium */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeMap === 'cesium' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <CesiumMap onExpand={() => setIsExpanded(!isExpanded)} />
        </div>
      </div>

      {/* Map Toggle */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-2 backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMap('google')}
            className={`px-3 py-1 rounded ${
              activeMap === 'google'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Google Maps
          </button>
          <button
            onClick={() => setActiveMap('cesium')}
            className={`px-3 py-1 rounded ${
              activeMap === 'cesium'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Cesium 3D
          </button>
        </div>
      </div>

      {/* Search Card */}
      <div className="pac-card absolute top-16 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-4 max-w-sm w-full backdrop-blur-sm" id="pac-card">
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

export default CombinedMap; 