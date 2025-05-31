import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrafficLegendProps {
  isRushHour?: boolean;
}

const TrafficLegend = ({ isRushHour = true }: TrafficLegendProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="absolute left-4 top-4 bg-white/90 backdrop-blur-sm shadow-lg p-4 z-[400]">
        <h3 className="font-semibold mb-3">Traffic Conditions</h3>
        
        {/* Color Legend */}
        <motion.div 
          className="space-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { color: 'bg-green-500', label: 'Free Flow (0-30%)' },
            { color: 'bg-yellow-500', label: 'Moderate (31-60%)' },
            { color: 'bg-red-500', label: 'Congested (61-100%)' }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <div className={`w-3 h-3 ${item.color} rounded`} />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Rush Hour Warning */}
        <AnimatePresence>
          {isRushHour && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-3 bg-yellow-100 p-2 rounded-md flex items-center gap-2 text-yellow-800 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Rush hour in progress</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default TrafficLegend; 