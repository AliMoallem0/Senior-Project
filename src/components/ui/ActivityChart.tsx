import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface ActivityData {
  date: string;
  projects: number;
  achievements: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[300px] bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Activity Overview</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="projects"
            stackId="1"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="achievements"
            stackId="1"
            stroke="#6366F1"
            fill="#6366F1"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
} 