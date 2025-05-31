import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TrafficMetricsProps {
  congestion: number;
  speed: number;
  delay: number;
  incidents: number;
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  delay 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5,
      delay,
      type: "spring",
      stiffness: 100
    }}
    whileHover={{ 
      scale: 1.02,
      transition: { duration: 0.2 }
    }}
  >
    <Card className="bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
      <div className="p-4">
        <h3 className="text-sm text-gray-600 font-medium">{title}</h3>
        <div className="text-3xl font-semibold font-display tracking-tight mt-1">{value}</div>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
    </Card>
  </motion.div>
);

const TrafficMetrics = ({ congestion, speed, delay, incidents }: TrafficMetricsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Current Speed"
        value={`${speed} km/h`}
        subtitle={`Free flow: ${speed * 2} km/h`}
        delay={0}
      />
      <MetricCard
        title="Average Delay"
        value={`${delay} min`}
        subtitle="Additional travel time"
        delay={0.1}
      />
      <MetricCard
        title="Traffic Incidents"
        value={incidents}
        subtitle="Active incidents reported"
        delay={0.2}
      />
      <MetricCard
        title="Congestion Level"
        value={`${congestion}%`}
        subtitle={congestion <= 30 ? "Low Congestion" : 
                 congestion <= 60 ? "Moderate Congestion" : 
                 "High Congestion"}
        delay={0.3}
      />
    </div>
  );
};

export default TrafficMetrics; 