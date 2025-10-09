// Device Optimization Utilities - Android Mobile/Tablet Detection & Performance
import { useEffect, useState } from 'react';

// Device type detection for Android devices
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width >= 768 && width < 1024) return 'tablet';
  return 'desktop';
};

// Check if device is Android mobile
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent) && window.innerWidth < 768;
};

// Check if device is Android tablet
export const isTabletDevice = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return /Android/i.test(navigator.userAgent) && width >= 768 && width < 1024;
};

// Check device performance capability
export const getDevicePerformance = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'high';
  
  const nav = navigator as any;
  
  // Check device memory (Chrome/Edge)
  if (nav.deviceMemory) {
    if (nav.deviceMemory >= 8) return 'high';
    if (nav.deviceMemory >= 4) return 'medium';
    return 'low';
  }
  
  // Check hardware concurrency (CPU cores)
  if (nav.hardwareConcurrency) {
    if (nav.hardwareConcurrency >= 8) return 'high';
    if (nav.hardwareConcurrency >= 4) return 'medium';
    return 'low';
  }
  
  // Fallback: assume medium
  return 'medium';
};

// Check if device supports backdrop-filter (for glassmorphism)
export const supportsBackdropFilter = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const testElement = document.createElement('div');
  const style = testElement.style as any;
  style.backdropFilter = 'blur(10px)';
  style.webkitBackdropFilter = 'blur(10px)';
  
  return !!(style.backdropFilter || style.webkitBackdropFilter);
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// React Hook: useDeviceType for Android devices
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>(getDeviceType());

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

// React Hook: useDevicePerformance
export const useDevicePerformance = () => {
  const [performance, setPerformance] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    setPerformance(getDevicePerformance());
  }, []);

  return {
    performance,
    isLowEnd: performance === 'low',
    isMedium: performance === 'medium',
    isHighEnd: performance === 'high',
  };
};

// React Hook: useOptimizedFeatures for Android devices
export const useOptimizedFeatures = () => {
  const deviceType = useDeviceType();
  const { performance } = useDevicePerformance();
  const reducedMotion = prefersReducedMotion();

  return {
    // Enable/disable features based on device
    enableParallax: deviceType !== 'mobile' && performance !== 'low',
    enableHeavyBlur: performance !== 'low' && supportsBackdropFilter(),
    enableAnimations: !reducedMotion,
    enableGradientMesh: performance === 'high',
    blurIntensity: performance === 'low' ? 5 : performance === 'medium' ? 10 : 20,
    
    // Device info
    deviceType,
    performance,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
};

// Get optimized class names based on Android device type
export const getOptimizedClasses = (
  baseClasses: string,
  options?: {
    mobileClasses?: string;
    tabletClasses?: string;
    desktopClasses?: string;
  }
) => {
  const deviceType = getDeviceType();
  
  let classes = baseClasses;
  
  if (deviceType === 'mobile' && options?.mobileClasses) {
    classes += ` ${options.mobileClasses}`;
  } else if (deviceType === 'tablet' && options?.tabletClasses) {
    classes += ` ${options.tabletClasses}`;
  } else if (deviceType === 'desktop' && options?.desktopClasses) {
    classes += ` ${options.desktopClasses}`;
  }
  
  return classes;
};

// Android device performance monitoring
export const measurePerformance = () => {
  if (typeof window === 'undefined' || !window.performance) return null;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;

  return {
    pageLoadTime,
    connectTime,
    renderTime,
    totalTime: pageLoadTime,
  };
};

// FPS Monitor
export class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private callback: (fps: number) => void;
  private rafId: number | null = null;

  constructor(callback: (fps: number) => void) {
    this.callback = callback;
  }

  start() {
    const measure = () => {
      this.frames++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        const fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
        this.callback(fps);
        this.frames = 0;
        this.lastTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(measure);
    };
    
    measure();
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Export all utilities
export default {
  getDeviceType,
  isMobileDevice,
  isTabletDevice,
  getDevicePerformance,
  supportsBackdropFilter,
  prefersReducedMotion,
  useDeviceType,
  useDevicePerformance,
  useOptimizedFeatures,
  getOptimizedClasses,
  measurePerformance,
  FPSMonitor,
};
