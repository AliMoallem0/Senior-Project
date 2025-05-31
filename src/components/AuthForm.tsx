/**
 * AuthForm Component
 * 
 * A reusable authentication form component that handles both login and signup functionality.
 * Features:
 * - Email/password authentication
 * - Social login (Google, Microsoft)
 * - Form validation
 * - Error handling
 * - Loading states
 * - Supabase integration
 * - Responsive design
 * - Dark mode support
 */

import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Provider } from '@supabase/supabase-js';
import { Icons } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { Tilt } from "react-tilt";

interface AuthFormProps {
  type: 'login' | 'signup';  // Determines if the form is for login or signup
}

const AuthForm = ({ type }: AuthFormProps) => {
  // State management for form visibility and loading
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get authentication methods from context
  const { signIn, signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  
  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // React Spring animations
  const fadeIn = useSpring({
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { tension: 280, friction: 20 },
  });

  // Handle input changes and clear errors
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Supabase configuration
    if (!isConfigured) {
      setError("Supabase is not properly configured. Please check your environment variables.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Form validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill all required fields');
      }
      
      if (type === 'signup' && !formData.name) {
        throw new Error('Please enter your name');
      }
      
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Authenticate with Supabase
      if (type === 'login') {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.name);
      }
      
      // Redirect on success
      navigate('/city-search');
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign-in (Google, Microsoft)
  const handleOAuthSignIn = async (provider: Provider) => {
    if (!isConfigured) {
      setError("Supabase is not properly configured. Please check your environment variables.");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/city-search`,
        },
      });
      
      if (error) throw error;
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setIsLoading(false);
    }
  };

  // Warning message for missing Supabase configuration
  const configurationWarning = !isConfigured ? (
    <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-start gap-2 text-sm animate-fade-in mb-4">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>
        Supabase configuration is missing. Social login and authentication may not work properly.
        Please set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
      </span>
    </div>
  ) : null;

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#083874] via-[#083874] to-[#083874]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      <div className="relative hidden h-full flex-col bg-muted p-10 text-black lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-[#083874] via-[#083874] to-[#083874]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#083874]/50 to-transparent" />
          
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#083874]/20 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-[#083874]/20 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <animated.div style={fadeIn} className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center text-lg font-medium"
          >
            <img src="/OSAT-image.png" alt="OSAT Logo" className="mr-2 h-8 w-8 object-contain" />
            <span className="text-xl font-bold">UrbanSim AI</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-auto"
          >
            <blockquote className="space-y-2">
              <p className="text-lg">
                "UrbanSim AI has revolutionized how we approach urban planning and development."
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </motion.div>
        </animated.div>
      </div>

      <div className="lg:p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#083874]/10 to-white dark:from-gray-900 dark:to-gray-800" />
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
          >
            <Tilt
              options={{
                max: 15,
                scale: 1.05,
                speed: 1000,
              }}
            >
              <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#083874] to-[#083874]">
                      {type === "login" ? "Welcome Back" : "Create Account"}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {type === "login" 
                        ? "Enter your credentials to access your account"
                        : "Sign up for an account to get started"}
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent>
                    {configurationWarning}
                    
                    {error && (
                      <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-start gap-2 text-sm animate-fade-in">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    {type === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            className="pl-10"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                          />
                          <User 
                            size={18} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isLoading}
                          required
                        />
                        <Mail 
                          size={18} 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {type === 'login' && (
                          <Link 
                            to="/forgot-password" 
                            className="text-xs text-osat-500 hover:text-osat-600 transition-colors"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                          required
                        />
                        <Lock 
                          size={18} 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      className="w-full space-y-4"
                    >
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25" 
                        type="submit" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Icons.spinner className="mr-2 h-4 w-4" />
                          </motion.div>
                        ) : null}
                        {isLoading 
                          ? type === "login" ? "Signing in..." : "Creating account..." 
                          : type === "login" ? "Sign in" : "Create account"
                        }
                      </Button>

                      {type === "login" && (
                        <Button
                          variant="ghost"
                          className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300"
                          asChild
                        >
                          <Link to="/forgot-password">Forgot password?</Link>
                        </Button>
                      )}

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                          onClick={() => handleOAuthSignIn('google')}
                          disabled={isLoading || !isConfigured}
                        >
                          <Icons.google className="mr-2 h-4 w-4" />
                          Google
                        </Button>
                        <Button 
                          variant="outline" 
                          className="bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                          onClick={() => handleOAuthSignIn('azure')}
                          disabled={isLoading || !isConfigured}
                        >
                          <Icons.microsoft className="mr-2 h-4 w-4" />
                          Microsoft
                        </Button>
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        {type === "login" ? (
                          <>
                            Don't have an account?{" "}
                            <Link 
                              to="/signup" 
                              className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              Sign up
                            </Link>
                          </>
                        ) : (
                          <>
                            Already have an account?{" "}
                            <Link 
                              to="/login" 
                              className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              Sign in
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </CardFooter>
                </form>
              </Card>
            </Tilt>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthForm;
