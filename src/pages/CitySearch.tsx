import { useState, useEffect } from 'react';
import { SearchIcon, Map, RefreshCw, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Navbar from '@/components/Navbar';
import CityCard from '@/components/CityCard';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

// Mock city data
const MOCK_CITIES = [
  {
    id: 'nyc',
    name: 'New York City',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2370&q=80',
    population: '8.4 million',
    area: '783.8',
    sampleData: true
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    image: '/London.webp',
    population: '8.9 million',
    area: '1,572',
    sampleData: true
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2536&q=80',
    population: '14 million',
    area: '2,194',
    sampleData: true
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    image: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2371&q=80',
    population: '5.6 million',
    area: '728.6',
    sampleData: true
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2370&q=80',
    population: '1.6 million',
    area: '101.9',
    sampleData: true
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2370&q=80',
    population: '3.3 million',
    area: '4,114',
    sampleData: true
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2370&q=80',
    population: '5.3 million',
    area: '12,368',
    sampleData: true
  },
  {
    id: 'sanfrancisco',
    name: 'San Francisco',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80',
    population: '884,000',
    area: '121.4',
    sampleData: true
  }
];

const CitySearch = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<typeof MOCK_CITIES>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setCities(MOCK_CITIES);
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setCities(MOCK_CITIES);
      return;
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const results = MOCK_CITIES.filter(
      city => 
        city.name.toLowerCase().includes(normalizedQuery) || 
        city.country.toLowerCase().includes(normalizedQuery)
    );
    
    setCities(results);
    
    if (results.length === 0) {
      toast({
        title: "No cities found",
        description: `No results for "${searchQuery}". Try another search term.`,
        variant: "destructive",
      });
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setCities(MOCK_CITIES);
  };
  
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full bg-white" />
      
      <Navbar />
      
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-8"
        >
          <div className="inline-flex mb-3 bg-white/10 backdrop-blur-lg text-[#083874] px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            <Map className="w-4 h-4 mr-1.5" />
            <span>City Explorer</span>
          </div>
          
          <h2 className="text-4xl font-bold text-black mb-4">
            Find and Explore Smart Cities
          </h2>
          
          <p className="text-gray-700 text-lg">
            Search for cities to access detailed data, simulations, and 3D visualizations.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search cities by name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-6 pl-12 pr-12 text-base rounded-xl bg-white/10 backdrop-blur-lg border-[#083874]/20 text-[#083874] placeholder:text-[#083874]/50 shadow-lg hover:bg-white/15 transition-colors focus:ring-2 focus:ring-[#083874] focus:border-transparent"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#083874] h-5 w-5" />
            
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-[72px] top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-[#083874] hover:text-white hover:bg-white/10"
                  onClick={handleClearSearch}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              </motion.div>
            )}
            
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#083874] hover:bg-[#083874]/90 text-white shadow-lg hover:shadow-[#083874]/25"
            >
              Search
            </Button>
          </form>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            // Loading state
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array(8).fill(null).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <CityCard
                    id=""
                    name=""
                    country=""
                    image=""
                    population=""
                    area=""
                    isLoading
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {cities.map((city, i) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <CityCard {...city} />
                </motion.div>
              ))}
              
              {cities.length === 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full text-center py-12"
                >
                  <Building className="mx-auto h-12 w-12 text-[#083874]/50" />
                  <h3 className="mt-4 text-lg font-medium text-[#083874]">No cities found</h3>
                  <p className="mt-2 text-[#083874]/70">Try adjusting your search terms.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CitySearch;
