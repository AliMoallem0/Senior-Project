import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'simulation' | 'project' | 'analysis';
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'failed';
  metadata?: {
    location?: string;
    projectType?: string;
    metrics?: Record<string, number>;
  };
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-6">Activity Timeline</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {events.map((event) => (
          <motion.div
            key={event.id}
            variants={item}
            className="relative pl-8 pb-8 last:pb-0"
          >
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            
            {/* Timeline dot */}
            <div className={`absolute left-0 top-2 w-[22px] h-[22px] rounded-full border-4 border-white dark:border-gray-900 ${getStatusColor(event.status)}`} />

            {/* Event card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-medium flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    {event.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {event.description}
                  </p>
                </div>
                <time className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(event.timestamp).toLocaleTimeString()}
                </time>
              </div>

              {/* Metadata */}
              {event.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {event.metadata.location && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {event.metadata.location}
                      </div>
                    )}
                    {event.metadata.projectType && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Activity className="w-4 h-4" />
                        {event.metadata.projectType}
                      </div>
                    )}
                  </div>
                  {event.metadata.metrics && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(event.metadata.metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {key}
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}; 