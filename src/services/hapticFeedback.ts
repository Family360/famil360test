// Haptic Feedback Service for FoodCart360
// Provides tactile feedback for better mobile UX

import { Capacitor } from '@capacitor/core';

// Haptics types (will be available when @capacitor/haptics is installed)
enum ImpactStyle {
  Light = 'LIGHT',
  Medium = 'MEDIUM',
  Heavy = 'HEAVY',
}

// Haptics interface (placeholder until package is installed)
const Haptics = {
  impact: async (options: { style: ImpactStyle }) => {
    if (Capacitor.isNativePlatform()) {
      console.log('Haptic feedback:', options.style);
      // Will work when @capacitor/haptics is installed
    }
  },
  selectionStart: async () => {
    if (Capacitor.isNativePlatform()) {
      console.log('Haptic selection start');
    }
  },
  selectionEnd: async () => {
    if (Capacitor.isNativePlatform()) {
      console.log('Haptic selection end');
    }
  },
  notification: async (options: { type: string }) => {
    if (Capacitor.isNativePlatform()) {
      console.log('Haptic notification:', options.type);
    }
  },
};

class HapticFeedbackService {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    if (Capacitor.isNativePlatform()) {
      this.isAvailable = true;
    }
  }

  /**
   * Light impact - For subtle interactions
   * Use for: Button taps, toggle switches, checkbox selections
   */
  async light() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Medium impact - For standard interactions
   * Use for: Form submissions, item additions, confirmations
   */
  async medium() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Heavy impact - For important actions
   * Use for: Order completion, payment success, critical alerts
   */
  async heavy() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Success vibration pattern
   * Use for: Successful operations, order completion
   */
  async success() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Error vibration pattern
   * Use for: Validation errors, failed operations
   */
  async error() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Warning vibration pattern
   * Use for: Important warnings, confirmations needed
   */
  async warning() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Selection vibration
   * Use for: Item selection, navigation changes
   */
  async selection() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.selectionStart();
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Notification vibration
   * Use for: New notifications, alerts
   */
  async notification() {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.notification({ type: 'SUCCESS' });
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}

export const hapticService = new HapticFeedbackService();
export default hapticService;
