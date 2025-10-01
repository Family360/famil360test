import React from 'react';
import { Skeleton } from './skeleton';

interface SkeletonLoaderProps {
  type: 'card' | 'list' | 'stats' | 'button';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  count = 1, 
  className = "" 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`p-6 space-y-3 ${className}`}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        );
        
      case 'list':
        return (
          <div className={`flex items-center space-x-4 p-3 ${className}`}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        );
        
      case 'stats':
        return (
          <div className={`text-center p-4 space-y-2 ${className}`}>
            <Skeleton className="h-8 w-8 mx-auto rounded-full" />
            <Skeleton className="h-6 w-16 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        );
        
      case 'button':
        return (
          <Skeleton className={`h-12 w-full rounded-lg ${className}`} />
        );
        
      default:
        return <Skeleton className={`h-4 w-full ${className}`} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;