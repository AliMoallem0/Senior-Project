import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Map,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';

const navItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Features",
    href: "/features",
  },
  {
    title: "Cities",
    href: "/city-search",
  },
];

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src="/OSAT-image.png" 
                  alt="OSAT Logo" 
                  className="h-8 w-auto"
                />
              </motion.div>
            </Link>
          </div>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="flex space-x-8">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <Link to={item.href}>
                    <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                      <NavigationMenuLink className={cn(
                        "text-base font-medium text-gray-600 hover:text-gray-900 transition-colors",
                        "px-3 py-2"
                      )}>
                        {item.title}
                      </NavigationMenuLink>
                    </motion.div>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/profile">
                <Avatar className="h-8 w-8 ring-2 ring-purple-100">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.user_metadata?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 