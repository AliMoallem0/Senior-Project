import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import Lottie from "lottie-react";
import { Tilt } from 'react-tilt';
import signupAnimation from '@/assets/animations/signup-animation.json';
import { Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { CountrySelector } from '@/components/CountrySelector';
import { Country } from '@/data/countries';
import { phoneFormats } from '@/data/phoneFormats';
import { cn } from '@/lib/utils';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryCode, setCountryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // React Spring animations
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 },
  });

  const validatePhoneNumber = (number: string, countryCode: string): boolean => {
    const format = phoneFormats[countryCode];
    if (!format) return true; // If no format defined for the country, accept any valid number
    
    const cleanNumber = number.replace(/\D/g, '');
    const isValid = format.pattern.test(cleanNumber);
    
    if (!isValid) {
      setPhoneError(`Please enter a valid ${selectedCountry?.name} phone number. Format: ${format.description}`);
    } else {
      setPhoneError(null);
    }
    
    return isValid;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d\s-+()]/g, '');
    setPhoneNumber(value);
    
    if (selectedCountry) {
      validatePhoneNumber(value, selectedCountry.code);
    }
  };

  const handleCountryChange = (country: Country | null) => {
    setSelectedCountry(country);
    if (country) {
      setCountryCode(country.phoneCode);
      // Clear previous error and validate current number with new country format
      setPhoneError(null);
      if (phoneNumber) {
        validatePhoneNumber(phoneNumber, country.code);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !phoneNumber || !countryCode || !selectedCountry) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    // Validate phone number format for selected country
    if (!validatePhoneNumber(phoneNumber, selectedCountry.code)) {
      return;
    }

    try {
      setIsLoading(true);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phoneNumber: `${countryCode}${phoneNumber.replace(/\D/g, '')}`,
            country: selectedCountry.name,
            countryCode: selectedCountry.code,
            phoneCountryCode: countryCode,
          },
        },
      });

      if (authError) throw authError;

      // Then create the user in the database with all information
      if (authData.user) {
        // Log the data before insert
        console.log("Inserting user with:", {
          id: authData.user.id,
          email,
          name,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          country_code: selectedCountry.code,
          country_name: selectedCountry.name,
          phone_number: `${countryCode}${phoneNumber.replace(/\D/g, '')}`,
          phone_country_code: countryCode
        });

        const { error, data } = await supabase
          .from('users')
          .update({
            email,
            name,
            role: 'user',
            updated_at: new Date().toISOString(),
            country_code: selectedCountry.code,
            country_name: selectedCountry.name,
            phone_number: `${countryCode}${phoneNumber.replace(/\D/g, '')}`,
            phone_country_code: countryCode
          })
          .eq('id', authData.user.id)
          .select();

        console.log('Update result:', { error, data });
        if (error) {
          console.error('Database error:', error);
          throw error;
        } else {
          console.log('User updated successfully:', data);
        }
      }

      toast({
        title: "Success",
        description: "Please check your email to verify your account.",
      });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign up",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden">
      {/* Enhanced animated background particles */}
      <div className="absolute right-0 w-1/2 h-full overflow-hidden pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 blur-sm"
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
              transition: {
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }
            }}
          />
        ))}

        {/* Larger floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-purple-600/5 to-violet-600/5 blur-xl"
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
              transition: {
                duration: Math.random() * 30 + 20,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }
            }}
          />
        ))}
      </div>
      
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
            <img src="/OSAT white Logo.png" alt="OSAT Logo" className="mr-2 h-20 w-20 object-contain" />
            <span className="text-2xl font-bold text-white">OSAT</span>
          </motion.div>
          
          <div className="mt-20 flex justify-center">
            <Lottie 
              animationData={signupAnimation} 
              loop={true}
              className="w-64 h-64"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-auto space-y-8"
          >
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <motion.h2 
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Join Our Platform
              </motion.h2>
              
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="h-1 w-1 rounded-full bg-white/80"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.1 }}
                  />
                  <p className="text-lg text-white/80">
                    Powerful Simulation Tools
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="h-1 w-1 rounded-full bg-white/80"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.3 }}
                  />
                  <p className="text-lg text-white/80">
                    Collaborative Planning
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="h-1 w-1 rounded-full bg-white/80"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.5 }}
                  />
                  <p className="text-lg text-white/80">
                    AI-Driven Insights
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.7 }}
            >
              <motion.div
                className="absolute -left-2 top-0 text-4xl text-white/20"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.9 }}
              >
                "
              </motion.div>
              <blockquote className="pl-6 space-y-2">
                <motion.p 
                  className="text-lg text-white/90 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 2 }}
                >
                  Join thousands of urban planners using AI to create sustainable, livable cities of tomorrow.
                </motion.p>
                <motion.div
                  className="text-sm text-white/60 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 2.2 }}
                >
                  Future Cities Magazine
                </motion.div>
              </blockquote>
            </motion.div>
          </motion.div>
        </animated.div>
      </div>

      <div className="lg:p-8 relative z-10">
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
                      Create Account
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      Enter your details to get started
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="grid gap-4"
                    >
                      <div className="relative group">
                        <Input
                          id="name"
                          placeholder="Your name"
                          type="text"
                          autoCapitalize="none"
                          autoComplete="name"
                          autoCorrect="off"
                          disabled={isLoading}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-white/50 backdrop-blur-sm border-purple-100 focus:border-purple-300 pr-10"
                        />
                        <motion.div
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <User className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </div>

                      <div className="relative group">
                        <Input
                          id="email"
                          placeholder="name@example.com"
                          type="email"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect="off"
                          disabled={isLoading}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/50 backdrop-blur-sm border-purple-100 focus:border-purple-300 pr-10"
                        />
                        <motion.div
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Mail className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </div>

                      <div className="relative group">
                        <Input
                          id="password"
                          placeholder="Create a password"
                          type="password"
                          autoCapitalize="none"
                          autoComplete="new-password"
                          disabled={isLoading}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/50 backdrop-blur-sm border-purple-100 focus:border-purple-300 pr-10"
                        />
                        <motion.div
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Lock className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </div>

                      <div className="space-y-2">
                        <CountrySelector
                          value={selectedCountry}
                          onChange={handleCountryChange}
                        />
                      </div>

                      <div className="relative group">
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Input
                              id="countryCode"
                              placeholder="+1"
                              type="text"
                              value={countryCode}
                              disabled
                              className="bg-gray-100 text-center"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              id="phoneNumber"
                              placeholder="Phone number"
                              type="tel"
                              autoComplete="tel"
                              disabled={isLoading}
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              className={cn(
                                "bg-white/50 backdrop-blur-sm border-purple-100 focus:border-purple-300 pr-10",
                                phoneError && "border-red-500 focus:border-red-500"
                              )}
                            />
                            <motion.div
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Phone className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          </div>
                        </div>
                        {phoneError && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            <span>{phoneError}</span>
                          </div>
                        )}
                        {selectedCountry && !phoneError && (
                          <div className="mt-1 text-xs text-gray-500">
                            Format: {phoneFormats[selectedCountry.code]?.description || 'Enter a valid phone number'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      className="w-full space-y-4"
                    >
                      <Button 
                        className="w-full bg-[#083874] hover:bg-[#083874]/90 text-white transition-all duration-300 shadow-lg hover:shadow-[#083874]/25" 
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
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>

                      <div className="flex justify-center">
                        <Link to="/login" className="text-sm font-medium text-[#083874] hover:text-[#083874]/90 hover:underline transition-colors">Already have an account? Sign in</Link>
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

export default Signup;
