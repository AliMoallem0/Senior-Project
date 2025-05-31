import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Building, 
  BarChart3, 
  Waves, 
  Map, 
  MapPin, 
  Users, 
  Brain,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from '@/components/icons';
import Navbar from '@/components/Navbar';
import { cn } from "@/lib/utils";

const Index = () => {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    benefits: false,
    cta: false
  });
  
  const observerRefs = {
    hero: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    benefits: useRef<HTMLDivElement>(null),
    cta: useRef<HTMLDivElement>(null)
  };
  
  // React Spring animations
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 },
  });
  
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    };
    
    const observers: IntersectionObserver[] = [];
    
    Object.entries(observerRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(prev => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);
        
        observer.observe(ref.current);
        observers.push(observer);
      }
    });
    
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);
  
  const features = [
    {
      title: "Urban Planning",
      description: "Design and optimize city layouts with AI-powered insights",
      icon: Building,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Data Analytics",
      description: "Analyze urban data to make informed decisions",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Traffic Simulation",
      description: "Simulate traffic patterns to reduce congestion",
      icon: Waves,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Geographic Mapping",
      description: "Visualize city data on interactive maps",
      icon: Map,
      color: "from-red-500 to-red-600"
    }
  ];
  
  const benefits = [
    {
      title: "Improved Planning",
      description: "Make data-driven decisions for better urban development",
      icon: MapPin
    },
    {
      title: "Community Engagement",
      description: "Involve citizens in the planning process",
      icon: Users
    },
    {
      title: "AI-Powered Insights",
      description: "Leverage artificial intelligence for smarter solutions",
      icon: Brain
    }
  ];
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-white to-[#083874]/10 dark:from-gray-950 dark:to-[#083874]/80">
      <Navbar />
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#083874]/20 to-[#083874]/10 blur-sm"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ 
              x: [
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
              ],
              y: [
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
              ],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          />
        ))}

        {/* Larger floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-[#083874]/10 to-[#083874]/5 blur-xl"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ 
              x: [
                Math.random() * 150 - 75,
                Math.random() * 150 - 75,
                Math.random() * 150 - 75
              ],
              y: [
                Math.random() * 150 - 75,
                Math.random() * 150 - 75,
                Math.random() * 150 - 75
              ],
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center">
          <div 
            ref={observerRefs.hero}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center"
              >
                <img src="/OSAT-image.png" alt="OSAT Logo" className="h-12 w-12 object-contain" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-4"
              >
                <span className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-[#083874]/10 text-[#083874] dark:bg-[#083874]/30 dark:text-[#083874]">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#083874]/60 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#083874]"></span>
                  </span>
                  Transforming Urban Planning with AI & Data
                </span>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-black">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#083874] to-[#083874]">
                    Optimize Cities
                  </span>{" "}
                  with Smart Simulation
                </h1>

                <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                  OSAT helps urban planners, policymakers, and citizens create more sustainable, 
                  efficient, and livable cities through advanced simulation and data analytics.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="bg-[#083874] hover:bg-[#05244a] text-white font-medium px-8 shadow-lg hover:shadow-[#083874]/25"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link to="/city-search">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-[#083874]/20 text-[#083874] hover:bg-[#083874]/10 dark:border-[#083874]/40 dark:text-[#083874] dark:hover:bg-[#083874]/20"
                  >
                    Explore Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="relative max-w-5xl mx-auto mt-16"
              >
                <Card className="overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#083874]/20 via-transparent to-[#083874]/20 dark:from-[#083874]/10 dark:to-[#083874]/5 z-10 pointer-events-none" />
                    <img 
                      src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2244&q=80" 
                      alt="Smart City Dashboard" 
                      className="w-full h-auto object-cover"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#083874]/10 to-white dark:from-[#083874]/80 dark:to-gray-950" />
          <div 
            ref={observerRefs.features}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#083874] to-[#083874]">
                Powerful Features
              </h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                Discover how our platform revolutionizes urban planning with cutting-edge technology
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 space-y-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-[#083874]`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-[#083874]/10 dark:from-gray-950 dark:to-[#083874]/80" />
          <div 
            ref={observerRefs.benefits}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#083874] to-[#083874]">
                Why Choose Us
              </h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                Experience the advantages of our comprehensive urban planning solution
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 space-y-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#083874]">
                        <benefit.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div 
            ref={observerRefs.cta}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-12 relative">
                  <div className="absolute inset-0 bg-[#083874]/10 pointer-events-none" />
                  <div className="relative space-y-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#083874] to-[#083874]">
                      Ready to Transform Your City?
                    </h2>
                    <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                      Join thousands of urban planners already using our platform to create smarter, 
                      more sustainable cities. Get started today and see the difference.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link to="/signup">
                        <Button 
                          size="lg" 
                          className="bg-[#083874] hover:bg-[#05244a] text-white font-medium px-8 shadow-lg hover:shadow-[#083874]/25"
                        >
                          Start Free Trial
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/contact">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="border-[#083874]/20 text-[#083874] hover:bg-[#083874]/10 dark:border-[#083874]/40 dark:text-[#083874] dark:hover:bg-[#083874]/20"
                        >
                          Contact Sales
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
