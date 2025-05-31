import { useParams } from 'react-router-dom';
import { EnvironmentPanel } from '@/components/EnvironmentPanel';
import Navbar from '@/components/Navbar';

const Environment = () => {
  const { cityId } = useParams<{ cityId: string }>();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar will be rendered at the top of the page */}
      <Navbar />
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <EnvironmentPanel cityId={cityId} />
      </main>
    </div>
  );
};

export default Environment;
