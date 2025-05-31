import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Users, LogOut, RefreshCw, Search, Clock, UserCheck, UserX, Trash2, Info, Mail, Calendar, Shield, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Define types for our data
interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_active?: boolean;
  phone?: string;
  phone_number?: string;
  country_code?: string;
  country?: string;
  country_name?: string;
  phone_country_code?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  confirmed_at?: string;
  banned_until?: string | null; // <-- Added for ban support
  aud?: string;
  identities?: any[];
  [key: string]: any; // Allow any additional properties from the database
}

// Define type for contact submissions
interface ContactSubmission {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  user_email: string | null;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
  user?: User; // Optional joined user data
}

interface DbUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  country_code?: string;
  country_name?: string;
  phone_number?: string;
  phone_country_code?: string;
}

interface Search {
  id: number;
  user_id?: string;
  city_name: string;
  created_at: string;
}

export default function AdminPanel() {
  const { user, dbUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for user data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentSearches, setRecentSearches] = useState<Search[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  
  // State for contact submissions
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [contactSubmissionCount, setContactSubmissionCount] = useState(0);
  const [recentContactSubmissions, setRecentContactSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isSubmissionDetailsOpen, setIsSubmissionDetailsOpen] = useState(false);
  
  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
    
    // Direct check for user roles in the database and update if missing
    const checkAndUpdateUserRoles = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('id, email, role')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching user roles:', error);
          return;
        }
        
        console.log('Direct query for user roles:', data);
        
        // Check if roles exist
        const usersWithoutRoles = data?.filter(user => !user.role);
        console.log('Users without roles:', usersWithoutRoles?.length || 0);
        
        // Update users without roles
        if (usersWithoutRoles && usersWithoutRoles.length > 0) {
          console.log('Updating users without roles...');
          
          // Set admin role for admin@example.com, user role for others
          for (const user of usersWithoutRoles) {
            const role = user.email === 'admin@example.com' ? 'admin' : 'user';
            
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({ role })
              .eq('id', user.id);
              
            if (updateError) {
              console.error(`Failed to update role for user ${user.email}:`, updateError);
            } else {
              console.log(`Updated role for ${user.email} to ${role}`);
            }
          }
          
          // Refresh data after updates
          fetchDashboardData();
        }
      } catch (err) {
        console.error('Failed to check or update user roles:', err);
      }
    };
    
    checkAndUpdateUserRoles();
  }, [user, navigate]);
  
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch users from the auth API
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching users from Auth API:', authError.message);
        throw authError;
      }
      
      // Fetch contact submissions
      const { data: submissions, error: submissionsError, count: submissionsCount } = await supabaseAdmin
        .from('contact_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
        
      if (submissionsError) {
        console.error('Error fetching contact submissions:', submissionsError.message);
      } else if (submissions) {
        console.log('Contact submissions from DB:', submissions);
        setContactSubmissions(submissions as ContactSubmission[]);
        setRecentContactSubmissions(submissions.slice(0, 5) as ContactSubmission[]);
        setContactSubmissionCount(submissionsCount || submissions.length);
      }
      
      // Fetch user data with explicit column selection to ensure we get the role field
      const { data: usersFromDb, error: dbError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, created_at, updated_at, last_login, country_code, country_name, phone_number, phone_country_code');
      
      if (!dbError && usersFromDb) {
        console.log('Database users retrieved:', usersFromDb.length);
        
        // Log the first user's data to see what fields are available
        if (usersFromDb.length > 0) {
          const firstUser = usersFromDb[0];
          console.log('Sample user fields:', Object.keys(firstUser));
          console.log('Sample user data:', {
            id: firstUser.id,
            email: firstUser.email,
            name: firstUser.name,
            role: firstUser.role,
            phone_number: firstUser.phone_number,
            country_code: firstUser.country_code,
            country_name: firstUser.country_name,
            phone_country_code: firstUser.phone_country_code
          });
          console.log('Raw user data from DB:', firstUser);
        }
        
        setDbUsers(usersFromDb as DbUser[]);
      } else {
        console.error('Could not fetch users from database table:', dbError?.message);
        setDbUsers([]);
      }
      
      if (authUsers) {
        // Set user count
        setUserCount(authUsers.users.length);
        
        // Count active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeUsers = authUsers.users.filter(user => {
          return user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo;
        });
        
        setActiveUserCount(activeUsers.length);
        
        // Create user objects from auth users with all available data
        const mappedUsers = authUsers.users.map(authUser => {
          const metadata = authUser.user_metadata || {};
          
          // Try to get additional user data from the database
          const dbUserData = dbUsers.find(dbUser => dbUser.id === authUser.id);
          
          // Log the matched database user for debugging
          if (dbUserData) {
            console.log('Found matching DB user for:', authUser.email);
            console.log('DB user data:', dbUserData);
          } else {
            console.log('No matching DB user found for:', authUser.email);
          }
          
          // Create a direct mapping from database fields
          const userData = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: dbUserData?.name || metadata.full_name || metadata.name || 'User',
            // Prioritize role from the database, then from auth, then default to 'user'
            role: dbUserData?.role || authUser.role || 'user',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at || dbUserData?.last_login || '',
            is_active: !!authUser.last_sign_in_at,
            
            // Explicitly map all database fields
            phone: authUser.phone || metadata.phone || '',
            phone_number: dbUserData?.phone_number || '',
            country_code: dbUserData?.country_code || '',
            country: dbUserData?.country_name || '',  // For backward compatibility
            country_name: dbUserData?.country_name || '',
            phone_country_code: dbUserData?.phone_country_code || '',
            
            user_metadata: metadata,
            app_metadata: authUser.app_metadata || {},
            confirmed_at: authUser.confirmed_at,
            aud: authUser.aud,
            identities: authUser.identities || []
          };
          
          // Debug log for role information
          console.log(`User role for ${authUser.email}:`, {
            dbRole: dbUserData?.role,
            authRole: authUser.role,
            finalRole: userData.role
          });
          
          // Log the final mapped user data
          console.log('Mapped user data for:', authUser.email, userData);
          
          return userData;
        });
        
        // Store all users for management
        setAllUsers(mappedUsers);
        
        // Set recent users for dashboard
        setRecentUsers(mappedUsers.slice(0, 5));
      }
      
      // Try to fetch searches if that table exists
      try {
        const { count: searches, error: searchCountError } = await supabaseAdmin
          .from('searches')
          .select('*', { count: 'exact', head: true });
        
        if (!searchCountError && searches !== null) {
          console.log('Search count from DB:', searches);
          setSearchCount(searches);
          
          // Fetch recent searches
          const { data: searchesData, error: searchesError } = await supabaseAdmin
            .from('searches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (!searchesError && searchesData) {
            console.log('Recent searches from DB:', searchesData);
            setRecentSearches(searchesData);
          }
        }
      } catch (searchError) {
        console.log('Error fetching searches, likely table does not exist:', searchError);
        // Use sample search data
        setSearchCount(3);
        setRecentSearches([
          {
            id: 1,
            city_name: 'New York',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            city_name: 'London',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            city_name: 'Tokyo',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Some tables might not exist yet.",
      });
      
      // Create sample data for demonstration
      createSampleData();
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const createSampleData = () => {
    // Sample users
    setRecentUsers([
      {
        id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: '2',
        email: 'user1@example.com',
        full_name: 'Regular User',
        role: 'user',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      },
      {
        id: '3',
        email: 'user2@example.com',
        full_name: 'Inactive User',
        role: 'user',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: false
      }
    ]);
    
    // Sample searches
    setRecentSearches([
      {
        id: 1,
        city_name: 'New York',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        city_name: 'London',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        city_name: 'Tokyo',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
    
    // Set counts
    setUserCount(3);
    setActiveUserCount(2);
    setSearchCount(3);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page after sign out
      navigate('/');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Function to update user role
  const handleUpdateUserRole = async (user: User, newRole: 'admin' | 'user') => {
    try {
      setIsProcessing(true);
      
      // Update role in the database
      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
      
      // If the selected user is being updated, update that too
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      
      toast({
        title: "Role updated",
        description: `User ${user.email} is now a ${newRole}.`,
      });
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update user role",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      
      if (error) throw error;
      
      // Remove user from state
      setAllUsers(allUsers.filter(u => u.id !== userToDelete.id));
      setRecentUsers(recentUsers.filter(u => u.id !== userToDelete.id));
      setUserCount(prevCount => prevCount - 1);
      
      toast({
        title: "User Deleted",
        description: `User ${userToDelete.email} has been deleted successfully.`,
      });
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50"
    >
      <div className="flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
          <h1 className="text-xl font-bold text-purple-600">OSAT Admin</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </Button>
        </div>
        
        {/* Sidebar */}
        <motion.div 
          variants={itemVariants}
          className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white shadow-md min-h-screen p-4 z-10 md:relative absolute inset-0`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-purple-600">OSAT Admin</h1>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
          
          <nav className="mt-6 space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </p>
            <div className="flex flex-col space-y-1">
              <Button 
                variant="secondary" 
                className="justify-start text-green-600 hover:text-green-700"
                onClick={() => navigate('/')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Home Page
              </Button>
              <Button 
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
                className="justify-start"
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant={activeTab === 'users' ? 'default' : 'ghost'} 
                className="justify-start"
                onClick={() => setActiveTab('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                User Management
              </Button>
              <Button 
                variant={activeTab === 'messages' ? 'default' : 'ghost'} 
                className="justify-start"
                onClick={() => setActiveTab('messages')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Messages
              </Button>
            </div>
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out
            </Button>
          </div>
        </motion.div>
        
        {/* Main Content */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto w-full"
        >
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-gray-500">Welcome to the OSAT admin panel</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  className="flex items-center gap-2 self-start sm:self-auto"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Data
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <UserCheck className="h-3 w-3 inline mr-1" />
                      {activeUserCount} active in the last 30 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeUserCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <UserX className="h-3 w-3 inline mr-1" />
                      {userCount - activeUserCount} inactive users
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contact Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contactSubmissionCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3 inline mr-1" />
                      {recentContactSubmissions.length} new in the last 7 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{searchCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Search className="h-3 w-3 inline mr-1" />
                      All time city searches
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Latest user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="font-medium">{user.full_name || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                  {user.role || 'user'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 py-4">No users found</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Searches</CardTitle>
                    <CardDescription>Latest city searches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentSearches.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>City</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentSearches.map((search) => (
                            <TableRow key={search.id}>
                              <TableCell className="font-medium">{search.city_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(search.created_at).toLocaleString()}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 py-4">No searches found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Contact Messages</h1>
                  <p className="text-gray-500">Manage contact form submissions</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  className="flex items-center gap-2 self-start sm:self-auto"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Data
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactSubmissions.length > 0 ? (
                        contactSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.name}</TableCell>
                            <TableCell>{submission.email}</TableCell>
                            <TableCell>{submission.user_email || '-'}</TableCell>
                            <TableCell>
                              {submission.subject.length > 20
                                ? `${submission.subject.substring(0, 20)}...`
                                : submission.subject}
                            </TableCell>
                            <TableCell>
                              {new Date(submission.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setIsSubmissionDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No contact messages found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'users' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <p className="text-gray-500">Manage user accounts</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  className="flex items-center gap-2 self-start sm:self-auto"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Users
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage all user accounts in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  {allUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden md:table-cell">Role</TableHead>
                            <TableHead className="hidden md:table-cell">Joined</TableHead>
                            <TableHead className="hidden md:table-cell">Last Active</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="font-medium">{user.full_name || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                <div className="md:hidden mt-1 flex flex-wrap gap-2">
                                  <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="md:hidden">
                                    {user.role || 'user'}
                                  </Badge>
                                  {user.country && (
                                    <span className="text-xs text-gray-500">{user.country}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                  {user.role || 'user'}
                                </Badge>
                                {user.role === 'admin' && (
                                  <div className="text-xs text-gray-500 mt-1">Administrator</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  {user.id.substring(0, 8)}...
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {user.last_sign_in_at ? (
                                  new Date(user.last_sign_in_at).toLocaleDateString()
                                ) : (
                                  'Never'
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleViewUserDetails(user)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {user.role !== 'admin' ? (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleUpdateUserRole(user, 'admin')}
                                      title="Make Admin"
                                      disabled={isProcessing}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                      </svg>
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleUpdateUserRole(user, 'user')}
                                      title="Remove Admin"
                                      disabled={isProcessing}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                      </svg>
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteUser(user)}
                                    title="Delete User"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4">No users found</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Recent Contact Messages */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Contact Messages</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('messages')}
              >
                View All
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentContactSubmissions.length > 0 ? (
                      recentContactSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell>
                            {submission.subject.length > 30
                              ? `${submission.subject.substring(0, 30)}...`
                              : submission.subject}
                          </TableCell>
                          <TableCell>
                            {new Date(submission.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsSubmissionDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No contact messages found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Users */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Users</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('users')}
              >
                View All
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.full_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                              {user.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* User Details Dialog */}
          <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Detailed information about the selected user.
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <div className="font-medium">{selectedUser.full_name || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="font-medium">{selectedUser.email}</div>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <div className="font-medium capitalize">{selectedUser.role || 'user'}</div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="font-medium">
                        {selectedUser.banned_until ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : selectedUser.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <div className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <Label>Last Sign In</Label>
                      <div className="font-medium">
                        {selectedUser.last_sign_in_at 
                          ? new Date(selectedUser.last_sign_in_at).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <div className="font-medium">{selectedUser.phone || selectedUser.phone_number || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <div className="font-medium">{selectedUser.country || selectedUser.country_name || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium mb-2">User Management</h4>
                    <div className="flex gap-2">
                      {selectedUser.role !== 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateUserRole(selectedUser, 'admin')}
                          disabled={isProcessing}
                        >
                          Promote to Admin
                          {isProcessing && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
                        </Button>
                      )}
                      {selectedUser.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateUserRole(selectedUser, 'user')}
                          disabled={isProcessing}
                        >
                          Demote to User
                          {isProcessing && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setIsUserDetailsOpen(false);
                          handleDeleteUser(selectedUser);
                        }}
                      >
                        Delete User
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Contact Submission Details Dialog */}
          <Dialog open={isSubmissionDetailsOpen} onOpenChange={setIsSubmissionDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Contact Message Details</DialogTitle>
                <DialogDescription>
                  Details of the contact form submission.
                </DialogDescription>
              </DialogHeader>
              
              {selectedSubmission && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <div className="font-medium">{selectedSubmission.name}</div>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <div className="font-medium">
                        {new Date(selectedSubmission.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Email</Label>
                      <div className="font-medium">{selectedSubmission.email}</div>
                    </div>
                    {selectedSubmission.user_email && (
                      <div className="col-span-2">
                        <Label>User Database Email</Label>
                        <div className="font-medium">{selectedSubmission.user_email}</div>
                      </div>
                    )}
                    <div className="col-span-2">
                      <Label>Subject</Label>
                      <div className="font-medium">{selectedSubmission.subject}</div>
                    </div>
                    <div className="col-span-2">
                      <Label>Message</Label>
                      <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                        {selectedSubmission.message}
                      </div>
                    </div>
                  </div>
                  
                  {selectedSubmission.user_id && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium mb-2">Associated User</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const user = allUsers.find(u => u.id === selectedSubmission.user_id);
                          if (user) {
                            setIsSubmissionDetailsOpen(false);
                            setSelectedUser(user);
                            setIsUserDetailsOpen(true);
                          }
                        }}
                      >
                        View User Profile
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmissionDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete User Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user account
                  {userToDelete && (
                    <span className="font-medium"> {userToDelete.email}</span>
                  )} and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteUser}
                  disabled={isProcessing}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>Delete</>  
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    </motion.div>
  );
}
