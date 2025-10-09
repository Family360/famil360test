// Page Transition Component - Smooth Screen Changes (2025 Trend)
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  type?: 'fade' | 'slide' | 'scale' | 'blur' | 'rotate';
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  type = 'fade',
  duration = 300,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Fade out
    setIsVisible(false);

    const timer = setTimeout(() => {
      // Update content
      setDisplayChildren(children);
      // Fade in
      setIsVisible(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [transitionKey, children, duration]);

  useEffect(() => {
    // Initial mount
    setIsVisible(true);
  }, []);

  const transitionStyles = {
    fade: {
      entering: 'opacity-0',
      entered: 'opacity-100',
      exiting: 'opacity-0',
    },
    slide: {
      entering: 'opacity-0 translate-x-8',
      entered: 'opacity-100 translate-x-0',
      exiting: 'opacity-0 -translate-x-8',
    },
    scale: {
      entering: 'opacity-0 scale-95',
      entered: 'opacity-100 scale-100',
      exiting: 'opacity-0 scale-105',
    },
    blur: {
      entering: 'opacity-0 blur-sm',
      entered: 'opacity-100 blur-0',
      exiting: 'opacity-0 blur-sm',
    },
    rotate: {
      entering: 'opacity-0 rotate-3',
      entered: 'opacity-100 rotate-0',
      exiting: 'opacity-0 -rotate-3',
    },
  };

  const currentStyle = isVisible
    ? transitionStyles[type].entered
    : transitionStyles[type].entering;

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        currentStyle,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {displayChildren}
    </div>
  );
};

// Route Transition Wrapper
export const RouteTransition: React.FC<{
  children: React.ReactNode;
  location: string;
}> = ({ children, location }) => {
  return (
    <PageTransition transitionKey={location} type="slide" duration={300}>
      {children}
    </PageTransition>
  );
};

export default PageTransition;
