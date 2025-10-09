// src/services/inventoryAlertService.ts
// Real-time inventory alert system with notifications and automated monitoring

import { localStorageService, type InventoryItem } from './localStorage';

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock';
  itemId: string;
  itemName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface InventoryAlertSettings {
  lowStockThreshold: number; // percentage
  outOfStockThreshold: number; // absolute quantity
  expiryWarningDays: number; // days before expiry to warn
  overstockThreshold: number; // percentage above optimal
  enableNotifications: boolean;
  enableSound: boolean;
  checkIntervalMinutes: number;
}

class InventoryAlertService {
  private static instance: InventoryAlertService;
  private alerts: InventoryAlert[] = [];
  private settings: InventoryAlertSettings = {
    lowStockThreshold: 20, // 20% of optimal stock
    outOfStockThreshold: 0,
    expiryWarningDays: 3,
    overstockThreshold: 150, // 150% of optimal stock
    enableNotifications: true,
    enableSound: true,
    checkIntervalMinutes: 5,
  };
  private checkInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alerts: InventoryAlert[]) => void)[] = [];

  private constructor() {
    this.loadSettings();
    this.loadAlerts();
    this.startMonitoring();
  }

  static getInstance(): InventoryAlertService {
    if (!InventoryAlertService.instance) {
      InventoryAlertService.instance = new InventoryAlertService();
    }
    return InventoryAlertService.instance;
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('inventory_alert_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Failed to load alert settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('inventory_alert_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save alert settings:', error);
    }
  }

  private loadAlerts(): void {
    try {
      const savedAlerts = localStorage.getItem('inventory_alerts');
      if (savedAlerts) {
        this.alerts = JSON.parse(savedAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }

  private saveAlerts(): void {
    try {
      localStorage.setItem('inventory_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkInventoryAlerts();
    }, this.settings.checkIntervalMinutes * 60 * 1000);

    // Initial check
    this.checkInventoryAlerts();
  }

  private async checkInventoryAlerts(): Promise<void> {
    const items = await localStorageService.getInventoryItems();
    const newAlerts: InventoryAlert[] = [];

    items.forEach(item => {
      // Check for out of stock
      if (item.stock <= this.settings.outOfStockThreshold) {
        const existingAlert = this.alerts.find(alert =>
          alert.itemId === item.id && alert.type === 'out_of_stock' && !alert.resolved
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `out_of_stock_${item.id}_${Date.now()}`,
            type: 'out_of_stock',
            itemId: item.id,
            itemName: item.name,
            message: `${item.name} is out of stock`,
            severity: 'critical',
            timestamp: Date.now(),
            acknowledged: false,
            resolved: false,
          });
        }
      }

      // Check for low stock
      if (item.stock > 0 && item.stock <= item.minStock) {
        const existingAlert = this.alerts.find(alert =>
          alert.itemId === item.id && alert.type === 'low_stock' && !alert.resolved
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `low_stock_${item.id}_${Date.now()}`,
            type: 'low_stock',
            itemId: item.id,
            itemName: item.name,
            message: `${item.name} is running low (${item.stock} remaining)`,
            severity: item.stock === 0 ? 'critical' : 'high',
            timestamp: Date.now(),
            acknowledged: false,
            resolved: false,
          });
        }
      }

      // Check for expiry warnings (Note: expiryDate not available in current InventoryItem interface)
      // This would be implemented when expiry tracking is added to InventoryItem

      // Check for overstock (Note: optimalStock not available in current InventoryItem interface)
      // This would be implemented when optimal stock tracking is added to InventoryItem
    });

    // Add new alerts
    if (newAlerts.length > 0) {
      this.alerts.unshift(...newAlerts);
      this.saveAlerts();
      this.notifyCallbacks();

      // Show notifications for critical alerts
      newAlerts.filter(alert => alert.severity === 'critical').forEach(alert => {
        this.showNotification(alert);
      });
    }

    // Clean up old resolved alerts (keep last 100)
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    if (activeAlerts.length > 100) {
      this.alerts = activeAlerts.slice(0, 100);
      this.saveAlerts();
    }
  }

  private showNotification(alert: InventoryAlert): void {
    if (!this.settings.enableNotifications) return;

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Inventory Alert: ${alert.type.replace('_', ' ').toUpperCase()}`, {
        body: alert.message,
        icon: '/icon.png',
        tag: alert.id,
      });
    }

    // Sound alert for critical notifications
    if (this.settings.enableSound && alert.severity === 'critical') {
      this.playAlertSound();
    }

    // In-app toast notification would be handled by the UI component
  }

  private playAlertSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  }

  // Public API methods

  getAlerts(): InventoryAlert[] {
    return this.alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  getActiveAlerts(): InventoryAlert[] {
    return this.alerts.filter(alert => !alert.resolved && !alert.acknowledged);
  }

  getAlertsBySeverity(severity: InventoryAlert['severity']): InventoryAlert[] {
    return this.alerts.filter(alert => alert.severity === severity && !alert.resolved);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveAlerts();
      this.notifyCallbacks();
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.saveAlerts();
      this.notifyCallbacks();
    }
  }

  resolveAllAlerts(): void {
    this.alerts.forEach(alert => {
      alert.resolved = true;
    });
    this.saveAlerts();
    this.notifyCallbacks();
  }

  getSettings(): InventoryAlertSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<InventoryAlertSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    if (newSettings.checkIntervalMinutes) {
      this.startMonitoring(); // Restart monitoring with new interval
    }

    this.notifyCallbacks();
  }

  onAlertsChange(callback: (alerts: InventoryAlert[]) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks(): void {
    this.alertCallbacks.forEach(callback => callback(this.getAlerts()));
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Manual check for alerts
  checkNow(): void {
    this.checkInventoryAlerts();
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.alertCallbacks = [];
  }
}

// Export singleton instance
export const inventoryAlertService = InventoryAlertService.getInstance();
