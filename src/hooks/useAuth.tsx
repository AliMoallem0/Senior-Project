import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import SupabaseConfigError from '@/components/SupabaseConfigError';

// Session timeout configuration (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000;      // 30 minutes
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // Warning 5 minutes before timeout

interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  country_code?: string;
  country_name?: string;
  phone_number?: string;
  phone_country_code?: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  dbUser: DatabaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ user: User; dbUser: DatabaseUser; }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isConfigured: boolean;
  extendSession: () => void; // New function to extend session
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const { toast } = useToast();

  // Refs for timeout handlers
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());

  // Function to extend session
  const extendSession = () => {
    lastActivityRef.current = Date.now();
    // Clear existing timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    // Set new timeouts
    setSessionTimeouts();
  };

  // Function to set session timeouts
  const setSessionTimeouts = () => {
    if (!user) return;

    console.log('Setting session timeouts...');

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      console.log('Warning timeout triggered');
      toast({
        variant: "default",
        title: "Session Expiring Soon",
        description: "Your session will expire in 5 minutes.",
        action: (
          <div className="flex items-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                extendSession();
              }}
              className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Stay Logged In
            </button>
          </div>
        ),
        open: true,
        duration: 240000, // Show warning for 4 minutes
      });
    }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);

    // Set session timeout
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('Session timeout triggered - logging out');
      signOut();
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        open: true,
      });
    }, SESSION_TIMEOUT);

    console.log('Timeouts set:', {
      warningIn: (SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT) / 1000 + ' seconds',
      logoutIn: SESSION_TIMEOUT / 1000 + ' seconds'
    });
  };

  // Effect to handle user activity
  useEffect(() => {
    if (!user) {
      console.log('No user, skipping timeout setup');
      return;
    }

    console.log('Setting up activity tracking for user');

    // List of events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      // Only extend if more than 1 minute has passed since last extension
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > 60000) {
        console.log('Activity detected, extending session');
        extendSession();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timeout setup
    setSessionTimeouts();

    // Cleanup
    return () => {
      console.log('Cleaning up event listeners and timeouts');
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user]);

  // Function to fetch user data from database
  const fetchUserData = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      console.log('User data fetched successfully:', data);
      return data as DatabaseUser;
    } catch (error) {
      console.error('Exception fetching user data:', error);
      return null;
    }
  };

  // Effect to fetch database user when auth user changes
  useEffect(() => {
    if (user?.id && !dbUser) {
      console.log('Auth user changed, fetching database user');
      setLoading(true);
      fetchUserData(user.id).then((userData) => {
        if (userData) {
          setDbUser(userData);
          console.log('Database user loaded with role:', userData.role);
        }
        setLoading(false);
      });
    } else if (!user) {
      setDbUser(null);
    }
  }, [user]);

  useEffect(() => {
    // Always set a maximum timeout for the loading state
    const loadingTimeoutId = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout reached, forcing loading to complete');
        setLoading(false);
      }
    }, 3000); // 3 second maximum loading time
    
    if (!isConfigured) {
      setLoading(false);
      clearTimeout(loadingTimeoutId);
      return;
    }

    // Try to get the session with error handling and timeout safety
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get session:', error);
          // On error, still set user to null but don't keep loading
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error('Exception during auth initialization:', err);
        setSession(null);
        setUser(null);
      } finally {
        // If the database user isn't loaded within a reasonable time, proceed anyway
        const dbUserTimeoutId = setTimeout(() => {
          if (loading) {
            console.log('Database user loading timeout reached, proceeding anyway');
            setLoading(false);
          }
        }, 2000);
        
        return () => clearTimeout(dbUserTimeoutId);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeoutId);
    };
  }, [isConfigured, loading]);

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!isConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration error",
        description: "Supabase is not properly configured",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update user metadata (name)
      if (data.name) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { name: data.name }
        });
        if (metadataError) throw metadataError;
      }

      // Update email if provided
      if (data.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (emailError) throw emailError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update profile",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!isConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration error",
        description: "Supabase is not properly configured",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update password",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createUserInDatabase = async (user: DatabaseUser): Promise<void> => {
    try {
      // Check if user exists in auth
      const { data: authUser } = await supabase.auth.getUser(user.id);
      
      // Check if user exists in database
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!dbUser && authUser.user) {
        // User exists in auth but not in database, create them
        console.log('User exists in auth but not in database, creating database entry');
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
            country_code: user.country_code,
            country_name: user.country_name,
            phone_number: user.phone_number,
            phone_country_code: user.phone_country_code
          }]);

        if (insertError) {
          console.error('Error creating user in database:', insertError);
        } else {
          console.log('Successfully created user in database');
        }
      } else {
        console.log('User already exists in both auth and database');
      }
    } catch (error) {
      console.error('Database operation error:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Attempting signup for email:', email);

      // First check if email exists in database
      const { data: existingDbUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingDbUser) {
        console.log('Email already exists in database');
        toast({
          variant: "destructive",
          title: "Account exists",
          description: "This email is already registered. Please log in instead.",
        });
        throw new Error('Email already registered');
      }

      // Then try to create auth account
      const { data: signupResult, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Account exists",
            description: "This email is already registered. Please log in instead.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign up error",
            description: signUpError.message,
          });
        }
        throw signUpError;
      }

      if (!signupResult?.user) {
        throw new Error('No user data returned from signup');
      }

      // Create database entry
      const newDbUser: DatabaseUser = {
        id: signupResult.user.id,
        email: signupResult.user.email || '',
        name,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating database entry for:', newDbUser.email);

      // First try to delete any existing entries with this email (cleanup)
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', email);

      // Then insert the new user
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([newDbUser]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        // If database insert fails, clean up the auth account
        await supabaseAdmin.auth.admin.deleteUser(signupResult.user.id);
        toast({
          variant: "destructive",
          title: "Sign up error",
          description: "Failed to create account. Please try again.",
        });
        throw insertError;
      }

      console.log('Successfully created user:', newDbUser.email);

      setDbUser(newDbUser);
      toast({
        title: "Success",
        description: "Account created successfully. Please check your email for verification.",
      });

      return { user: signupResult.user, dbUser: newDbUser };
    } catch (error: any) {
      console.error('Signup process error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in with:', email);

      // Check if this is the admin email
      if (email.toLowerCase() === 'admin@example.com') {
        console.log('Admin email detected, using special login flow');
        
        // First authenticate
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Admin sign in error:', error);
          toast({
            variant: "destructive",
            title: "Sign in error",
            description: "Invalid admin credentials",
          });
          throw error;
        }

        // Force admin role in database if needed
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (existingUser) {
          // Update role to admin if not already
          if (existingUser.role !== 'admin') {
            await supabaseAdmin
              .from('users')
              .update({ role: 'admin' })
              .eq('email', email);
          }
          
          // Set the dbUser with admin role
          const adminUser = {...existingUser, role: 'admin'};
          setDbUser(adminUser);
        } else {
          // Create admin user if doesn't exist
          const newAdminUser: DatabaseUser = {
            id: data.user?.id || '',
            email: email,
            name: 'Administrator',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          await supabaseAdmin
            .from('users')
            .insert([newAdminUser]);
            
          setDbUser(newAdminUser);
        }
        
        // Force immediate navigation to admin dashboard
        console.log('Admin login successful, forcing navigation');
        toast({
          title: "Admin Access",
          description: "Signed in as administrator",
        });
        
        // Use window.location for immediate navigation
        window.location.href = '/admin-dashboard';
        return;
      }

      // Regular user authentication flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          variant: "destructive",
          title: "Sign in error",
          description: "Invalid email or password",
        });
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Check if user exists in database with matching ID and email
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .eq('email', email)
        .single();

      if (!dbUser) {
        console.log('User not found in database or ID mismatch');
        // Clean up any existing entries with this email
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('email', email);

        // Create fresh database entry with correct ID
        const newDbUser: DatabaseUser = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata.name || email.split('@')[0],
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert([newDbUser]);

        if (insertError) {
          console.error('Failed to create database entry:', insertError);
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Login error",
            description: "Failed to create user profile. Please try again.",
          });
          throw insertError;
        }

        setDbUser(newDbUser);
        console.log('Created fresh database entry with correct ID');
      } else {
        setDbUser(dbUser);
      }

      console.log('Sign in successful');
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
    } catch (error: any) {
      console.error('Detailed error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!isConfigured) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out error",
        description: error.message || "Failed to sign out",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  if (!isConfigured) {
    return <SupabaseConfigError />;
  }

  return (
    <AuthContext.Provider value={{
      session,
      user,
      dbUser,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      updateProfile,
      updatePassword,
      isConfigured,
      extendSession,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
