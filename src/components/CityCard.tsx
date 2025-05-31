/**
 * CityCard Component
 * 
 * A reusable card component that displays city information in a visually appealing way.
 * Features:
 * - City image with loading state
 * - City details (name, country, population, area)
 * - Sample data indicator
 * - Hover effects and animations
 * - Responsive design
 * - Dark mode support
 * - Loading skeleton state
 */

import { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityCardProps {
  id: string;          // Unique identifier for the city
  name: string;        // Name of the city
  country: string;     // Country where the city is located
  image: string;       // URL of the city's image
  population: string;  // City's population
  area: string;        // City's area in square kilometers
  isLoading?: boolean; // Whether to show loading state
}

const CityCard: FC<CityCardProps> = ({
  id,
  name,
  country,
  image,
  population,
  area,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="relative group">
        <div className="rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-[#083874]/30 shadow-xl animate-pulse">
          <div className="aspect-[4/3] bg-[#083874]/20" />
          <div className="p-4">
            <div className="h-6 w-3/4 bg-[#083874]/20 rounded mb-2" />
            <div className="h-4 w-1/2 bg-[#083874]/20 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-[#083874]/20 rounded" />
              <div className="h-4 w-3/4 bg-[#083874]/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/dashboard/${id}`} className="block">
      <motion.div
        whileHover={{ y: -4 }}
        className="relative group rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-[#083874] shadow-xl transition duration-300 hover:border-[#083874]/80 hover:shadow-[#083874]/10"
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={image || '/placeholder-city.jpg'}
            alt={name}
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#083874]/80 to-transparent" />
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-semibold text-[#083874] mb-1 line-clamp-1">
            {name}
          </h3>
          <p className="text-[#083874]/80 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-1 inline-block text-[#083874]" />
            {country}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-[#083874]/70">
              <Users className="w-4 h-4 mr-1.5 text-[#083874]" />
              <span className="text-sm">{population}</span>
            </div>
            <div className="flex items-center text-[#083874]/70">
              <Ruler className="w-4 h-4 mr-1.5 text-[#083874]" />
              <span className="text-sm">{area}</span>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 pointer-events-none transition duration-300 group-hover:bg-[#083874]/5" />
      </motion.div>
    </Link>
  );
};

export default CityCard;
