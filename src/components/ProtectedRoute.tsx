import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're not loading and there's definitely no user
    if (!loading && !user) {
      console.log('No authenticated user, redirecting to login');
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }

    // For admin routes, perform admin check (only if we have a user and aren't loading)
    if (!loading && user && adminOnly) {
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      if (!isAdmin) {
        console.log('Attempted to access admin route without admin privileges');
        navigate('/city-search');
        return;
      }
    }
  }, [user, loading, navigate, adminOnly, location.pathname]);

  // Show loading only if actually in a loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
        <p className="text-sm text-gray-500">Loading application...</p>
      </div>
    );
  }

  // If we're not loading anymore, just render children even if there's no user
  // The above effect will handle redirecting if needed
  return <>{children}</>;
};

export default ProtectedRoute; 