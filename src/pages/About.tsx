import { useState } from 'react';
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import { Building, Cloud, Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const About = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "01 What is OSAT's Digital Twin?",
      answer: "OSAT's Digital Twin platform replicates urban environments in a virtual space, providing real-time monitoring and actionable insights. With 3D visualizations and predictive analytics, our platform supports informed decision-making and efficient resource allocation."
    },
    {
      question: "02 How does OSAT provide weather updates?",
      answer: "OSAT integrates reliable APIs to deliver accurate, up-to-the-minute weather information. This helps cities proactively manage events, transportation, and public safety."
    },
    {
      question: "03 How does AI enhance OSAT's capabilities?",
      answer: "AI powers OSAT's predictive analytics, enabling cities to anticipate challenges and respond effectively. From forecasting traffic patterns to optimizing emergency responses, AI helps create smarter solutions for urban management."
    }
  ];

  const capabilities = [
    "Seamless integration of APIs for real-time data exchange.",
    "Comprehensive 3D modeling to visualize urban infrastructure effectively.",
    "AI-driven analysis for accurate predictions and insights.",
    "Customizable features to meet the unique needs of every city."
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
            ABOUT
          </h2>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "3rem" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="h-1 bg-[#083874] mx-auto mb-8"
          />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-12 items-center">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-1"
          >
            <h3 className="text-3xl font-bold text-black mb-6">
              Your Gateway to Smarter Cities
            </h3>
            <p className="text-gray-700 mb-8">
              OSAT is transforming urban landscapes with its advanced Digital Twin technology. By integrating APIs, 3D modeling, and AI-driven insights, OSAT delivers real-time data and powerful predictions to optimize city management and planning. Join us in building smarter, more efficient cities for the future.
            </p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              {faqItems.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-[#083874]/20"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full px-6 py-4 text-left font-medium transition-colors",
                      openIndex === index 
                        ? "bg-[#083874] text-white" 
                        : "bg-white/5 text-black hover:bg-white/10"
                    )}
                    onClick={() => handleToggle(index)}
                  >
                    {item.question}
                  </motion.button>
                  {openIndex === index && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="px-6 py-4 bg-white/5 border-t border-[#083874]/20"
                    >
                      <p className="text-gray-700">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-1 flex justify-center items-center"
          >
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              src="/why-us.png" 
              alt="Digital Twin Visualization" 
              className="max-w-full h-auto rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex-1"
            >
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                src="/skills.png" 
                alt="OSAT Skills" 
                className="max-w-full h-auto rounded-lg shadow-2xl"
              />
            </motion.div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex-1"
            >
              <h3 className="text-3xl font-bold text-black mb-4">
                Empowering Cities with Advanced Capabilities
              </h3>
              <p className="text-gray-700 italic mb-6">
                OSAT equips cities with a suite of innovative tools designed to streamline operations and enhance decision-making.
              </p>
              
              <motion.ul className="space-y-4 mb-6">
                {capabilities.map((capability, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="flex items-start space-x-3 text-gray-700"
                  >
                    <CheckCircle className="h-5 w-5 text-[#083874] mt-1" />
                    <span>{capability}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/contact">
                  <Button className="bg-[#083874] hover:bg-[#083874]/90 text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default About; 