import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Pre-fill form with user data if available
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        // First, set form data with basic user info
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || '',
          email: user.email || ''
        }));
        
        // Then try to get additional user data from the database
        try {
          // Fetch user data from the users table
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('email, phone_number, country')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
          if (userData) {
            // Update form with database user data
            setFormData(prev => ({
              ...prev,
              // Prioritize database email if available
              email: userData.email || user.email || ''
            }));
          }
        } catch (err) {
          console.error('Exception when fetching user data:', err);
        }
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Get user email from database if user is logged in
      let userDatabaseEmail = null;
      
      if (user) {
        try {
          // Try to get user email from database
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single();
            
          if (!userError && userData && userData.email) {
            userDatabaseEmail = userData.email;
          }
        } catch (err) {
          console.error('Error fetching user email from database:', err);
        }
      }
      
      // Insert the form data into the contact_submissions table
      const { data, error } = await supabaseAdmin
        .from('contact_submissions')
        .insert([
          { 
            user_id: user?.id || null,
            name: formData.name,
            email: formData.email, // Always save the form email
            user_email: userDatabaseEmail, // Save the database email separately
            subject: formData.subject,
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error submitting contact form:', error);
        setSubmitError('There was an error submitting your message. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Form submitted successfully:', data);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Exception when submitting contact form:', err);
      setSubmitError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <Navbar />
      
      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative pt-20 overflow-hidden bg-gradient-to-b from-[#083874] to-[#083874]/90"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </motion.div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-white drop-shadow-md"
              >
                Contact Us
              </motion.span>
            </h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-2xl mx-auto text-lg text-white mb-10"
            >
              We'd love to hear from you! Whether you have questions, need support, 
              or want to explore how OSAT can revolutionize your city's infrastructure, 
              our team is here to help. Reach out today!
            </motion.p>
          </motion.div>
        </div>
      </motion.section>
      
      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Contact Info & Map */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#083874]/20"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-[#083874]" />
                  Address
                </h3>
                <p className="text-gray-600">
                  BAU University, Debbieh Campus
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-[#083874]" />
                  Call Us
                </h3>
                <p className="text-gray-600">+961 81 067 995</p>
                <p className="text-gray-600">+961 03 681 235</p>
                <p className="text-gray-600">+961 71 934 739</p>
                <p className="text-gray-600">+961 71 443 405</p>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-[#083874]" />
                  Email Us
                </h3>
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=osat.official@gmail.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#083874] hover:text-[#083874]/80 font-medium"
                >
                  osat.official@gmail.com
                </motion.a>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="mt-8 rounded-lg overflow-hidden"
              >
                <iframe
                  title="Google Map"
                  src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=bau debbieh&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                  className="w-full h-64"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </motion.div>
            </motion.div>
            
            {/* Right Side - Contact Form */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#083874]/20"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Your Name
                    </label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name" 
                      className="w-full px-4 py-2 rounded-md border border-[#083874]/20 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#083874]"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Your Email
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email" 
                      className="w-full px-4 py-2 rounded-md border border-[#083874]/20 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#083874]"
                    />
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Subject
                  </label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject" 
                    className="w-full px-4 py-2 rounded-md border border-[#083874]/20 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#083874]"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Message
                  </label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter your message" 
                    rows={6}
                    className="w-full px-4 py-2 rounded-md border border-[#083874]/20 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#083874]"
                  ></textarea>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-[#083874] hover:bg-[#083874]/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-pulse">Sending...</span>
                        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
                
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md"
                  >
                    Thank you for your message! We'll get back to you soon.
                  </motion.div>
                )}
                
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md"
                  >
                    {submitError}
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src="/OSAT-image.png" 
                alt="OSAT Logo" 
                className="h-9 w-auto mr-3"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-900">OSAT</span>
            </div>
            
            <div className="flex gap-8">
              <Link to="/about" className="text-gray-600 hover:text-osat-500 dark:text-gray-400 dark:hover:text-osat-400">About</Link>
              <Link to="/features" className="text-gray-600 hover:text-osat-500 dark:text-gray-400 dark:hover:text-osat-400">Features</Link>
              <Link to="/contact" className="text-gray-600 hover:text-osat-500 dark:text-gray-400 dark:hover:text-osat-400">Contact</Link>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} OSAT. All rights reserved.
            </p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-osat-500 dark:hover:text-osat-400">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-osat-500 dark:hover:text-osat-400">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Contact; 