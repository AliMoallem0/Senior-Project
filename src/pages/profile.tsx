import { useAuth } from '@/hooks/useAuth';
import { ProfileForm } from '@/components/ProfileForm';
import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProfileForm userId={user.id} />;
};

export default ProfilePage;