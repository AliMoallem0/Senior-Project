/**
 * Navbar Component
 * 
 * The main navigation component that provides access to different sections of the application.
 * Features:
 * - Responsive design (mobile and desktop layouts)
 * - Dynamic transparency based on scroll position
 * - User authentication state management
 * - Dropdown menu for user actions
 * - Mobile menu with hamburger toggle
 * - Dark mode support
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, dbUser, signOut } = useAuth();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Set admin status in localStorage based on dbUser role
  useEffect(() => {
    if (user && dbUser) {
      console.log('Current user:', user);
      console.log('Database user:', dbUser);
      console.log('User role:', dbUser?.role);
      
      // Check if user is admin and set localStorage accordingly
      if (dbUser.role === 'admin') {
        console.log('Setting is_admin to true in localStorage');
        localStorage.setItem('is_admin', 'true');
      } else {
        console.log('Setting is_admin to false in localStorage');
        localStorage.setItem('is_admin', 'false');
      }
      
      console.log('Is admin (localStorage):', localStorage.getItem('is_admin'));
    }
  }, [user, dbUser]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Cities', path: '/city-search' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  if (isAuthPage) return null;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-3 
      ${isScrolled || location.pathname === '/contact' ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Link 
          to="/" 
          className="flex items-center space-x-2"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/OSAT-image.png" alt="OSAT Logo" className="h-8 w-8 object-contain" />
          </motion.div>
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:inline-block font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#073763] to-[#073763]"
          >
            OSAT
          </motion.span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <motion.div
              key={link.name}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <Link
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 hover:text-[#073763]
                ${location.pathname === link.path 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#073763] to-[#073763] font-semibold' 
                  : 'text-gray-600 dark:text-gray-300'}`}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* User Menu / Authentication Section */}
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20 flex items-center space-x-2"
                >
                  <User size={18} className="text-[#073763]" />
                  <span className="text-gray-700 dark:text-gray-300">Account</span>
                  <ChevronDown size={16} className="text-[#073763]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-[#073763]/10 dark:border-[#073763]/40">
                <DropdownMenuItem className="hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20">
                  <Link to="/profile" className="flex items-center w-full">
                    <User size={16} className="mr-2 text-[#073763]" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20">
                  <Settings size={16} className="mr-2 text-[#073763]" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {dbUser?.role === 'admin' && (
                  <DropdownMenuItem className="hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20">
                    <Link to="/admin" className="flex items-center w-full">
                      <LayoutDashboard size={16} className="mr-2 text-[#073763]" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#073763]/10 dark:bg-[#073763]/40" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20"
                >
                  <LogOut size={16} className="mr-2 text-[#073763]" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-[#073763] hover:bg-[#073763]/10 dark:hover:bg-[#073763]/20"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  size="sm" 
                  className="bg-[#073763] hover:bg-[#05294a] text-white shadow-lg hover:shadow-[#073763]/25"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <motion.div 
          className="md:hidden"
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#073763]"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-lg border-t border-[#073763]/10 dark:border-[#073763]/40"
          >
            <div className="flex flex-col p-5 space-y-4">
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ x: 0 }}
                >
                  <Link
                    to={link.path}
                    className={`text-base font-medium py-2 transition-colors 
                    ${location.pathname === link.path 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#073763] to-[#073763] font-semibold' 
                      : 'text-gray-600 dark:text-gray-300'}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              {user ? (
                <>
                  <motion.div whileHover={{ x: 4 }} className="flex items-center space-x-3 py-2 text-[#073763]">
                    <Link to="/profile" className="flex items-center w-full">
                      <User size={18} />
                      <span>Profile</span>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }} className="flex items-center space-x-3 py-2 text-[#073763]">
                    <Settings size={18} />
                    <span>Settings</span>
                  </motion.div>
                  {dbUser?.role === 'admin' && (
                    <motion.div whileHover={{ x: 4 }} className="flex items-center space-x-3 py-2 text-[#073763]">
                      <Link to="/admin" className="flex items-center w-full">
                        <LayoutDashboard size={18} className="mr-2" />
                        <span>Admin Panel</span>
                      </Link>
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ x: 4 }}
                    onClick={handleLogout}
                    className="flex items-center space-x-3 py-2 text-[#073763]"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </motion.button>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link 
                    to="/login" 
                    className="py-2 text-[#073763] hover:text-[#073763]/10 dark:hover:text-[#073763]/20"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="py-2 px-4 bg-[#073763] text-white rounded-md text-center shadow-lg hover:shadow-[#073763]/25"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
