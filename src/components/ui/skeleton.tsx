import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("bg-gray-200 animate-pulse rounded-lg", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-full w-full" />
    </div>
  );
}
