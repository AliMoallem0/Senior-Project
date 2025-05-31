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
import emailAnimation from '@/assets/animations/email-animation.json';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  // React Spring animations
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      
      // Clear the form
      setEmail('');
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset link",
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
              animationData={emailAnimation} 
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
                Transforming Urban Development
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
                    AI-Powered Urban Planning Solutions
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
                    Smart City Development Tools
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
                    Sustainable Infrastructure Planning
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
                  UrbanSim AI has revolutionized how we approach urban planning and development, bringing cutting-edge technology to shape the future of our cities.
                </motion.p>
                <motion.div
                  className="text-sm text-white/60 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 2.2 }}
                >
                  Featured in Urban Tech Review
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
            key={isEmailSent ? 'success' : 'form'}
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
                      {isEmailSent ? "Check Your Email" : "Forgot Password"}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {isEmailSent 
                        ? "We've sent you a password reset link. Please check your inbox."
                        : "Enter your email address and we'll send you a link to reset your password."}
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                {!isEmailSent && (
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#083874]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Mail className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
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
                          {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-[#083874] hover:text-[#083874]/90 hover:bg-[#083874]/10 transition-all duration-300 group"
                          asChild
                        >
                          <Link to="/login">
                            <motion.span
                              animate={{ x: [-3, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </motion.span>
                            {" "}
                            Back to login
                          </Link>
                        </Button>
                      </motion.div>
                    </CardFooter>
                  </form>
                )}
              </Card>
            </Tilt>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPassword; 