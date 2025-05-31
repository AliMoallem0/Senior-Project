import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  Share2, 
  Sun, 
  Moon,
  Clock,
  Building,
  Landmark,
  Car,
  ShoppingBag
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Popular Dubai locations for suggestions
const POPULAR_LOCATIONS = [
  { label: 'Burj Khalifa', category: 'Landmark', icon: <Landmark className="h-4 w-4" />, coords: [25.1972, 55.2744] as [number, number] },
  { label: 'Dubai Mall', category: 'Shopping', icon: <ShoppingBag className="h-4 w-4" />, coords: [25.1985, 55.2796] as [number, number] },
  { label: 'Palm Jumeirah', category: 'Area', icon: <MapPin className="h-4 w-4" />, coords: [25.1124, 55.1390] as [number, number] },
  { label: 'Dubai Marina', category: 'Area', icon: <Building className="h-4 w-4" />, coords: [25.0819, 55.1367] as [number, number] },
  { label: 'Dubai International Airport', category: 'Transport', icon: <Car className="h-4 w-4" />, coords: [25.2532, 55.3657] as [number, number] },
  { label: 'JBR Beach', category: 'Leisure', icon: <MapPin className="h-4 w-4" />, coords: [25.0777, 55.1328] as [number, number] },
  { label: 'Business Bay', category: 'Business', icon: <Building className="h-4 w-4" />, coords: [25.1857, 55.2766] as [number, number] },
  { label: 'Mall of the Emirates', category: 'Shopping', icon: <ShoppingBag className="h-4 w-4" />, coords: [25.1181, 55.2002] as [number, number] },
  { label: 'Dubai Creek', category: 'Landmark', icon: <Landmark className="h-4 w-4" />, coords: [25.2285, 55.3273] as [number, number] },
  { label: 'Jumeirah Beach Road', category: 'Road', icon: <Car className="h-4 w-4" />, coords: [25.2048, 55.2708] as [number, number] }
];

interface TrafficControlsProps {
  onSearch: (query: string, coords?: [number, number]) => void;
  onTimeChange: (time: string) => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLocationClick: () => void;
  theme: 'light' | 'dark';
}

const TrafficControls = ({
  onSearch,
  onTimeChange,
  onThemeChange,
  onLocationClick,
  theme
}: TrafficControlsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(POPULAR_LOCATIONS);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter locations based on search query
    const filtered = POPULAR_LOCATIONS.filter(location =>
      location.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchQuery]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (location: typeof POPULAR_LOCATIONS[0]) => {
    setSearchQuery(location.label);
    onSearch(location.label,);
    setShowSuggestions(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Current Traffic Conditions',
        text: 'Check out the current traffic conditions in my area!',
        url: window.location.href
      });
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Could not share the current traffic conditions.",
        variant: "destructive"
      });
    }
  };

  const timeOptions = [
    { value: 'now', label: 'Current Traffic' },
    { value: 'in1hour', label: 'In 1 Hour' },
    { value: 'in2hours', label: 'In 2 Hours' },
    { value: 'tomorrow', label: 'Tomorrow' }
  ];

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-[300px]">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={searchContainerRef}>
          <Input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pr-8 bg-white/90 backdrop-blur-sm shadow-md rounded-lg border-0 w-full"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => {
              onSearch(searchQuery);
              setShowSuggestions(false);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden z-[1100]">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location, index) => (
                  <button
                    key={index}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => handleSuggestionClick(location)}
                  >
                    {location.icon}
                    <div>
                      <div className="font-medium">{location.label}</div>
                      <div className="text-xs text-gray-500">{location.category}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficControls; 