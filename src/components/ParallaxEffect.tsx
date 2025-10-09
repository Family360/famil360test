// Parallax Scrolling Effect - Depth Scrolling (2025 Trend)
// Auto-disables on mobile for better performance
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { isMobileDevice } from '@/utils/deviceOptimization';

interface ParallaxEffectProps {
  children: React.ReactNode;
  speed?: number; // 0.1 to 1 (slower to faster)
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  disableOnMobile?: boolean; // Auto-disable on mobile (default: true)
}

export const ParallaxEffect: React.FC<ParallaxEffectProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className,
  disableOnMobile = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // If mobile and should disable, just render children without parallax
  if (isMobile && disableOnMobile) {
    return <div className={className}>{children}</div>;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const windowHeight = window.innerHeight;

      // Calculate offset based on scroll position
      const parallaxOffset = (scrolled - elementTop + windowHeight) * speed;
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(-${offset}px)`;
      case 'down':
        return `translateY(${offset}px)`;
      case 'left':
        return `translateX(-${offset}px)`;
      case 'right':
        return `translateX(${offset}px)`;
      default:
        return `translateY(-${offset}px)`;
    }
  };

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <div
        style={{
          transform: getTransform(),
          transition: 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Parallax Background Layer
export const ParallaxBackground: React.FC<{
  imageUrl?: string;
  gradient?: string;
  speed?: number;
  className?: string;
}> = ({ imageUrl, gradient, speed = 0.3, className }) => {
  return (
    <ParallaxEffect speed={speed} className={cn('absolute inset-0 -z-10', className)}>
      <div
        className="w-full h-[120%]"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : gradient,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    </ParallaxEffect>
  );
};

// Parallax Section with Multiple Layers
export const ParallaxSection: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      {/* Background Layer - Slowest */}
      <ParallaxEffect speed={0.2} className="absolute inset-0 -z-30">
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" />
      </ParallaxEffect>

      {/* Decorative Shapes - Medium Speed */}
      <ParallaxEffect speed={0.4} className="absolute inset-0 -z-20">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute bottom-40 right-20 w-40 h-40 rounded-full bg-purple-200/30 blur-3xl" />
      </ParallaxEffect>

      {/* Content - Normal Speed */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ParallaxEffect;
