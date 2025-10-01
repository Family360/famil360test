import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'stat' | 'elevated';
  disabled?: boolean;
  role?: string;
  tabIndex?: number;
  style?: React.CSSProperties;
}

const Card = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'default',
  disabled = false,
  role,
  tabIndex,
  style 
}: CardProps) => {
  const isInteractive = onClick && !disabled;
  const cardRole = role || (isInteractive ? 'button' : undefined);
  const cardTabIndex = tabIndex !== undefined ? tabIndex : (isInteractive ? 0 : undefined);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      onClick();
    }
    
    if (isInteractive && e.key === ' ' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      onClick();
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'glass':
        return 'bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/10 dark:border-gray-700/30';
      case 'stat':
        return 'bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/20 border border-white/20 dark:border-gray-700/40 relative overflow-hidden';
      case 'elevated':
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg';
      default:
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md';
    }
  }, [variant]);

  const interactiveStyles = useMemo(() => {
    if (!isInteractive) return '';
    
    return cn(
      'cursor-pointer transition-all duration-300',
      'hover:shadow-lg hover:-translate-y-1',
      'active:scale-[0.98] active:shadow-md',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none disabled:hover:shadow-none'
    );
  }, [isInteractive]);

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .card-stat::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff7043, #ff9f43);
            border-radius: 8px 8px 0 0;
            z-index: 1;
          }
          .card-hover {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
          }
          .card-disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
          .card-disabled:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        `}
      </style>
      
      <div
        className={cn(
          'rounded-2xl p-4 md:p-6 relative overflow-hidden',
          variantStyles,
          interactiveStyles,
          isInteractive && 'card-hover',
          disabled && 'card-disabled',
          variant === 'stat' && 'card-stat',
          className
        )}
        onClick={handleClick}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={cardRole}
        tabIndex={cardTabIndex}
        style={style}
        aria-disabled={disabled}
      >
        {children}
        
        {/* Shimmer effect for glass and stat variants */}
        {(variant === 'glass' || variant === 'stat') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer pointer-events-none z-0" />
        )}
      </div>
    </>
  );
};

export default Card;