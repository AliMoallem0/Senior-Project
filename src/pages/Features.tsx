import { useState } from 'react';
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import { Database, Brain, Map, Monitor, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Features = () => {
  const servicesData = [
    {
      icon: Database,
      title: "Real time data",
      description: "API integration provides real-time data monitoring for traffic, energy usage, and environmental metrics."
    },
    {
      icon: Brain,
      title: "Integrated AI",
      description: "AI-powered analytics deliver trend predictions, optimize city planning, and enable scenario simulations."
    },
    {
      icon: Map,
      title: "3D Modeling",
      description: "View the city layout in 3D, with layers for traffic, utilities, and infrastructure."
    },
    {
      icon: Monitor,
      title: "Friendly-GUI",
      description: "A real-time dashboard and 3D visualization tools offer actionable insights with instant alerts for critical events."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      <Navbar />
      
      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-black mb-4">
            FEATURES
          </h2>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "3rem" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="h-1 bg-[#083874] mx-auto mb-8"
          />
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl text-gray-700"
          >
            Our Web App Provides Advanced Services
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {servicesData.map((service, index) => (
            <motion.div 
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#083874]/20"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 rounded-lg bg-[#083874]/20 flex items-center justify-center mb-4 mx-auto"
              >
                <service.icon className="h-8 w-8 text-[#083874]" />
              </motion.div>
              <h3 className="text-xl font-semibold text-black mb-2 text-center">
                {service.title}
              </h3>
              <p className="text-black text-center">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="py-20 bg-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Experience the Future Today!
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="max-w-3xl mx-auto text-lg text-black-300 mb-10"
          >
            Imagine exploring a fully interactive 3D model of your city, predicting tomorrow's challenges, and solving them today. Dive into the world of smart cities and discover how technology shapes the urban landscape like never before.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/signup">
              <Button className="bg-[#083874] hover:bg-[#083874]/90 text-white">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-white -z-10"
        />
      </motion.section>
    </motion.div>
  );
};

export default Features; 