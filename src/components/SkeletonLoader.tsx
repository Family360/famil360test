// Modern Skeleton Loader Component - 2025 Design Trend
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
}) => {
  const baseStyles = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    />
  );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-4 space-y-3 animate-fade-in">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="50%" />
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3 glass-card animate-fade-in">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <Skeleton variant="text" width={60} />
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="text" width="25%" />
      <Skeleton variant="text" width="20%" />
      <Skeleton variant="text" width="15%" />
      <Skeleton variant="text" width="10%" />
    </div>
  );
};

// Stats Grid Skeleton
export const StatsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
