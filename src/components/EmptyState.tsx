// Empty State Component
// Engaging empty states for better UX

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {/* Illustration or Icon */}
      <div className="mb-6 relative">
        {illustration ? (
          <div className="text-8xl opacity-50">{illustration}</div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <Icon size={48} className="text-gray-400 dark:text-gray-600" />
          </div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-900 opacity-50 animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-900 opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
