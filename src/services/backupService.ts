// Comprehensive Backup & Restore Service
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import QRCode from 'qrcode';
import * as LZString from 'lz-string';
import { localStorageService, Order, MenuItem, InventoryItem, Expense, CashBalance } from './localStorage';
import { whatsAppService, WhatsAppConfig } from './whatsAppService';
import { SubscriptionService } from './subscriptionService';
import { SecureTrialService } from './secureTrialService';
import languageService from './languageService';

export interface UserProfile {
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: string;
  currency: string;
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: string;
  timestamp: string;
  appVersion: string;
  deviceInfo: {
    platform: string;
    userAgent: string;
    language: string;
    timezone: string;
  };
  userData: {
    profile?: UserProfile;
    orders: Order[];
    menuItems: MenuItem[];
    inventory: InventoryItem[];
    expenses: Expense[];
    cashBalance: CashBalance[];
    settings: AppSettings;
    whatsappConfig?: WhatsAppConfig;
    subscriptionData?: any;
    trialData?: any;
  };
  metadata: {
    totalOrders: number;
    totalMenuItems: number;
    totalRevenue: number;
    dataSize: number;
    checksum: string;
  };
}

export interface BackupOptions {
  includeOrders: boolean;
  includeMenu: boolean;
  includeInventory: boolean;
  includeExpenses: boolean;
  includeCashBalance: boolean;
  includeSettings: boolean;
  includeWhatsApp: boolean;
  includeSubscription: boolean;
  compress: boolean;
  encrypt: boolean;
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';
  private readonly SETTINGS_KEY = 'app_settings';
  private readonly PROFILE_KEY = 'user_profile';
  private readonly AUTO_BACKUP_KEY = 'auto_backup_enabled';
  private readonly LAST_BACKUP_KEY = 'last_backup_timestamp';

  // Default backup options
  private readonly DEFAULT_OPTIONS: BackupOptions = {
    includeOrders: true,
    includeMenu: true,
    includeInventory: true,
    includeExpenses: true,
    includeCashBalance: true,
    includeSettings: true,
    includeWhatsApp: true,
    includeSubscription: false, // Sensitive data
    compress: true,
    encrypt: false
  };

  // Get device information
  private getDeviceInfo() {
    return {
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Generate checksum for data integrity
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Get user profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileStr = localStorage.getItem(this.PROFILE_KEY);
      return profileStr ? JSON.parse(profileStr) : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Save user profile
  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    try {
      const existingProfile = await this.getUserProfile();
      const now = new Date().toISOString();
      
      const newProfile: UserProfile = {
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone,
        businessName: profile.businessName,
        address: profile.address,
        createdAt: existingProfile?.createdAt || now,
        updatedAt: now,
        ...profile
      };

      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }

  // Get app settings
  async getAppSettings(): Promise<AppSettings> {
    try {
      const settingsStr = localStorage.getItem(this.SETTINGS_KEY);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      
      // Return default settings
      const now = new Date().toISOString();
      return {
        language: navigator.language.split('-')[0] || 'en',
        currency: 'USD',
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        notifications: true,
        autoBackup: true,
        backupFrequency: 'weekly',
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Failed to get app settings:', error);
      const now = new Date().toISOString();
      return {
        language: 'en',
        currency: 'USD',
        darkMode: false,
        notifications: true,
        autoBackup: true,
        backupFrequency: 'weekly',
        createdAt: now,
        updatedAt: now
      };
    }
  }

  // Save app settings
  async saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const existingSettings = await this.getAppSettings();
      const now = new Date().toISOString();
      
      const newSettings: AppSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: now
      };

      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save app settings:', error);
      throw error;
    }
  }

  // Create comprehensive backup
  async createBackup(options: Partial<BackupOptions> = {}): Promise<BackupData> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const timestamp = new Date().toISOString();
      
      // Collect all data
      const cashBalance = opts.includeCashBalance ? await localStorageService.getCashBalance() : null;
      
      const userData: BackupData['userData'] = {
        profile: await this.getUserProfile() || undefined,
        orders: opts.includeOrders ? await localStorageService.getOrders() : [],
        menuItems: opts.includeMenu ? await localStorageService.getMenuItems() : [],
        inventory: opts.includeInventory ? await localStorageService.getInventoryItems() : [],
        expenses: opts.includeExpenses ? await localStorageService.getExpenses() : [],
        cashBalance: cashBalance ? [cashBalance] : [],
        settings: opts.includeSettings ? await this.getAppSettings() : {} as AppSettings,
        whatsappConfig: opts.includeWhatsApp ? await whatsAppService.getConfig() || undefined : undefined,
        subscriptionData: opts.includeSubscription ? await SubscriptionService.getSubscriptionStatus() : undefined,
        trialData: opts.includeSubscription ? await SecureTrialService.getTrialStatus() : undefined
      };

      // Calculate metadata
      const totalRevenue = userData.orders.reduce((sum, order) => sum + order.total, 0);
      const dataString = JSON.stringify(userData);
      
      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp,
        appVersion: '1.0.0', // You can get this from package.json
        deviceInfo: this.getDeviceInfo(),
        userData,
        metadata: {
          totalOrders: userData.orders.length,
          totalMenuItems: userData.menuItems.length,
          totalRevenue,
          dataSize: dataString.length,
          checksum: this.generateChecksum(dataString)
        }
      };

      // Update last backup timestamp
      localStorage.setItem(this.LAST_BACKUP_KEY, timestamp);

      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Export backup to file
  async exportBackupToFile(backup: BackupData, options: Partial<BackupOptions> = {}): Promise<string> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      let backupString = JSON.stringify(backup, null, 2);
      
      // Compress if requested
      if (opts.compress) {
        backupString = LZString.compress(backupString) || backupString;
      }

      const fileName = `foodcart360_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      
      if (Capacitor.isNativePlatform()) {
        // Save to device storage
        await Filesystem.writeFile({
          path: fileName,
          data: backupString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        return fileName;
      } else {
        // Web download
        this.downloadFile(backupString, fileName);
        return fileName;
      }
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw error;
    }
  }

  // Download file in browser
  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate QR code for backup (compressed data only)
  async generateBackupQR(backup: BackupData): Promise<string> {
    try {
      // Create minimal backup for QR (settings + profile only)
      const minimalBackup = {
        version: backup.version,
        timestamp: backup.timestamp,
        userData: {
          profile: backup.userData.profile,
          settings: backup.userData.settings,
          whatsappConfig: backup.userData.whatsappConfig
        }
      };

      const compressed = LZString.compressToBase64(JSON.stringify(minimalBackup));
      const qrDataUrl = await QRCode.toDataURL(compressed, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate backup QR:', error);
      throw error;
    }
  }

  // Restore from backup data
  async restoreFromBackup(backup: BackupData, options: Partial<BackupOptions> = {}): Promise<void> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };

      // Verify backup integrity
      const dataString = JSON.stringify(backup.userData);
      const checksum = this.generateChecksum(dataString);
      
      if (checksum !== backup.metadata.checksum) {
        throw new Error('Backup data integrity check failed');
      }

      // Restore data selectively
      if (opts.includeOrders && backup.userData.orders.length > 0) {
        for (const order of backup.userData.orders) {
          await localStorageService.saveOrder(order);
        }
      }

      if (opts.includeMenu && backup.userData.menuItems.length > 0) {
        for (const item of backup.userData.menuItems) {
          await localStorageService.saveMenuItem(item);
        }
      }

      if (opts.includeInventory && backup.userData.inventory.length > 0) {
        for (const item of backup.userData.inventory) {
          await localStorageService.saveInventoryItem(item);
        }
      }

      if (opts.includeExpenses && backup.userData.expenses.length > 0) {
        for (const expense of backup.userData.expenses) {
          await localStorageService.saveExpense(expense);
        }
      }

      if (opts.includeCashBalance && backup.userData.cashBalance.length > 0) {
        const latestBalance = backup.userData.cashBalance[backup.userData.cashBalance.length - 1];
        await localStorageService.saveCashBalance(latestBalance);
      }

      if (opts.includeSettings && backup.userData.settings) {
        await this.saveAppSettings(backup.userData.settings);
      }

      if (opts.includeWhatsApp && backup.userData.whatsappConfig) {
        await whatsAppService.saveConfig(backup.userData.whatsappConfig);
      }

      if (backup.userData.profile) {
        await this.saveUserProfile(backup.userData.profile);
      }

      // Update restore timestamp
      localStorage.setItem('last_restore_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Restore from QR code
  async restoreFromQR(qrData: string): Promise<void> {
    try {
      const decompressed = LZString.decompressFromBase64(qrData);
      if (!decompressed) {
        throw new Error('Invalid QR code data');
      }

      const backup = JSON.parse(decompressed);
      await this.restoreFromBackup(backup, {
        includeOrders: false,
        includeMenu: false,
        includeInventory: false,
        includeExpenses: false,
        includeCashBalance: false,
        includeSettings: true,
        includeWhatsApp: true,
        includeSubscription: false
      });
    } catch (error) {
      console.error('Failed to restore from QR:', error);
      throw error;
    }
  }

  // Share backup
  async shareBackup(backup: BackupData): Promise<void> {
    try {
      const backupString = JSON.stringify(backup, null, 2);
      const fileName = `FoodCart360_Backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        // Save to temporary file and share using native share
        await Filesystem.writeFile({
          path: fileName,
          data: backupString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Use Capacitor's native share if available
        try {
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: languageService.translate('foodcart360_backup'),
            text: languageService.translate('backup_created_on') + ' ' + new Date().toLocaleDateString(),
            url: fileName,
            dialogTitle: languageService.translate('share_backup')
          });
        } catch (shareError) {
          // Fallback: just save the file
          console.log('Share plugin not available, file saved to cache directory');
        }
      } else {
        // Web: copy to clipboard
        await navigator.clipboard.writeText(backupString);
      }
    } catch (error) {
      console.error('Failed to share backup:', error);
      throw error;
    }
  }

  // Auto backup functionality
  async shouldAutoBackup(): Promise<boolean> {
    try {
      const settings = await this.getAppSettings();
      if (!settings.autoBackup) return false;

      const lastBackupStr = localStorage.getItem(this.LAST_BACKUP_KEY);
      if (!lastBackupStr) return true;

      const lastBackup = new Date(lastBackupStr);
      const now = new Date();
      const daysSinceBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

      switch (settings.backupFrequency) {
        case 'daily':
          return daysSinceBackup >= 1;
        case 'weekly':
          return daysSinceBackup >= 7;
        case 'monthly':
          return daysSinceBackup >= 30;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check auto backup:', error);
      return false;
    }
  }

  // Perform auto backup
  async performAutoBackup(): Promise<void> {
    try {
      if (!(await this.shouldAutoBackup())) return;

      const backup = await this.createBackup();
      await this.exportBackupToFile(backup);
      
      console.log('Auto backup completed successfully');
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  // Get backup statistics
  async getBackupStats(): Promise<{
    lastBackup?: string;
    totalBackups: number;
    autoBackupEnabled: boolean;
    backupFrequency: string;
  }> {
    try {
      const settings = await this.getAppSettings();
      const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
      
      return {
        lastBackup: lastBackup || undefined,
        totalBackups: 0, // Could be tracked if needed
        autoBackupEnabled: settings.autoBackup,
        backupFrequency: settings.backupFrequency
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        autoBackupEnabled: false,
        backupFrequency: 'weekly'
      };
    }
  }
}

export const backupService = new BackupService();
export default backupService;
