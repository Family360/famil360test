import { Purchases, PurchasesOffering, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { revenueCatConfig, ENTITLEMENT_ID, PRODUCT_IDS } from '../config/revenuecat';
import { SecureStorage } from './secureStorage';
import { toast } from 'react-hot-toast';

export class RevenueCatService {
  private static isInitialized = false;
  private static cachedCustomerInfo: CustomerInfo | null = null;
  private static purchaseRetryCount = 0;
  private static maxRetries = 3;

  // Enhanced initialization with retry logic
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'android' ? revenueCatConfig.android.apiKey : '';
      
      if (!apiKey) {
        throw new Error(`No RevenueCat API key for platform: ${platform}`);
      }

      await Purchases.configure({ apiKey });
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      throw error;
    }
  }

  // Enhanced purchase with retry logic and grace period
  static async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) await this.initialize();
    
    try {
      const offerings = await this.getOfferings();
      let packageToPurchase = null;

      for (const offering of offerings) {
        if (offering.availablePackages) {
          packageToPurchase = offering.availablePackages.find(
            (pkg) => pkg.product?.identifier === productId
          );
          if (packageToPurchase) break;
        }
      }

      if (!packageToPurchase) {
        return { success: false, error: 'Product not found' };
      }

      const purchaseResult = await Purchases.purchasePackage({
        aPackage: packageToPurchase,
      });

      const entitlements: Record<string, any> = purchaseResult.customerInfo.entitlements || {};
      const isPremium = entitlements[ENTITLEMENT_ID]?.isActive || false;

      if (isPremium) {
        this.cachedCustomerInfo = purchaseResult.customerInfo;
        await SecureStorage.setCustomerInfo(purchaseResult.customerInfo);
        this.purchaseRetryCount = 0; // Reset retry counter on success
        
        // Store purchase receipt for validation
        await this.storePurchaseReceipt(purchaseResult.customerInfo);
        
        return { success: true };
      } else {
        return { success: false, error: 'Purchase completed but entitlement not active' };
      }
    } catch (error: any) {
      console.error('Error purchasing product:', error);
      
      // Retry logic for network errors
      if (error.code === 2 && this.purchaseRetryCount < this.maxRetries) {
        this.purchaseRetryCount++;
        console.log(`Retrying purchase (attempt ${this.purchaseRetryCount})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.purchaseProduct(productId);
      }

      let message = 'Purchase failed';
      if (error.code === 1) {
        message = 'Purchase cancelled by user';
      } else if (error.code === 2) {
        message = 'Network error - please check your connection';
      } else if (error.code === 3) {
        message = 'Purchase not allowed';
      }
      
      this.purchaseRetryCount = 0; // Reset retry counter
      return { success: false, error: error.message || message };
    }
  }

  // Grace period handling for expired subscriptions
  static async checkGracePeriod(): Promise<{ inGracePeriod: boolean; daysRemaining: number }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return { inGracePeriod: false, daysRemaining: 0 };

      const entitlements: Record<string, any> = customerInfo.entitlements || {};
      const entitlement = entitlements[ENTITLEMENT_ID];
      
      if (!entitlement) return { inGracePeriod: false, daysRemaining: 0 };

      // Check if subscription is in grace period (3 days)
      if (entitlement.expirationDate) {
        const expiration = new Date(entitlement.expirationDate);
        const now = new Date();
        const daysSinceExpiration = Math.floor((now.getTime() - expiration.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceExpiration <= 3 && daysSinceExpiration > 0) {
          return { inGracePeriod: true, daysRemaining: 3 - daysSinceExpiration };
        }
      }

      return { inGracePeriod: false, daysRemaining: 0 };
    } catch (error) {
      console.error('Error checking grace period:', error);
      return { inGracePeriod: false, daysRemaining: 0 };
    }
  }

  // Enhanced subscription status check with grace period
  static async hasPremiumEntitlement(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      const entitlements: Record<string, any> = customerInfo.entitlements || {};
      const entitlement = entitlements[ENTITLEMENT_ID];
      
      if (!entitlement) return false;

      // Check if active
      if (entitlement.isActive) return true;

      // Check grace period
      const gracePeriod = await this.checkGracePeriod();
      if (gracePeriod.inGracePeriod) {
        console.log(`Subscription in grace period, ${gracePeriod.daysRemaining} days remaining`);
        return true; // Allow access during grace period
      }

      return false;
    } catch (error) {
      console.error('Error checking premium entitlement:', error);
      return false;
    }
  }

  // Store purchase receipt for validation
  private static async storePurchaseReceipt(customerInfo: CustomerInfo): Promise<void> {
    try {
      const receiptData = {
        customerInfo,
        storedAt: new Date().toISOString(),
        validationAttempts: 0
      };
      await SecureStorage.setEncryptedItem('purchase_receipt', receiptData);
    } catch (error) {
      console.error('Error storing purchase receipt:', error);
    }
  }

  // Validate purchase receipt (offline basic validation)
  static async validatePurchaseReceipt(): Promise<boolean> {
    try {
      const receipt = await SecureStorage.getDecryptedItem<{
        customerInfo: CustomerInfo;
        storedAt: string;
        validationAttempts: number;
      }>('purchase_receipt');

      if (!receipt) return false;

      // Basic offline validation
      const entitlements: Record<string, any> = receipt.customerInfo.entitlements || {};
      const entitlement = entitlements[ENTITLEMENT_ID];
      
      if (!entitlement || !entitlement.isActive) return false;

      // Check if receipt is not too old (30 days max for offline validation)
      const storedDate = new Date(receipt.storedAt);
      const now = new Date();
      const daysSinceStorage = Math.floor((now.getTime() - storedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysSinceStorage <= 30;
    } catch (error) {
      console.error('Error validating purchase receipt:', error);
      return false;
    }
  }

  // Enhanced restore purchases with better error handling
  static async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) await this.initialize();
    
    try {
      toast.loading('Restoring purchases...');
      const result = await Purchases.restorePurchases();
      
      this.cachedCustomerInfo = result.customerInfo;
      await SecureStorage.setCustomerInfo(result.customerInfo);
      
      // Validate the restored purchase
      const isValid = await this.validatePurchaseReceipt();
      
      toast.dismiss();
      if (isValid) {
        toast.success('Purchases restored successfully!');
        return { success: true };
      } else {
        toast.error('No valid purchases found');
        return { success: false, error: 'No valid purchases found' };
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Error restoring purchases:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  }

  // Existing methods remain the same but enhanced with new features
  static async loginUser(userId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    try {
      await Purchases.logIn({ appUserID: userId });
    } catch (error: any) {
      console.error('Error logging in user to RevenueCat:', error);
      throw new Error(error.message || 'Login to RevenueCat failed');
    }
  }

  static async logoutUser(): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    try {
      await Purchases.logOut();
      this.cachedCustomerInfo = null;
      await SecureStorage.setCustomerInfo(null);
    } catch (error: any) {
      console.error('Error logging out from RevenueCat:', error);
      throw new Error(error.message || 'Logout from RevenueCat failed');
    }
  }

  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) await this.initialize();
    try {
      const result = await Purchases.getCustomerInfo();
      this.cachedCustomerInfo = result.customerInfo;
      await SecureStorage.setCustomerInfo(result.customerInfo);
      return result.customerInfo;
    } catch (error: any) {
      console.error('Error getting customer info:', error);
      if (this.cachedCustomerInfo) return this.cachedCustomerInfo;
      return await SecureStorage.getCustomerInfo();
    }
  }

  static async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) await this.initialize();
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error: any) {
      console.error('Error getting offerings:', error);
      return [];
    }
  }

  static async getSubscriptionExpirationDate(): Promise<string | null> {
    if (!this.isInitialized) await this.initialize();
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return null;
      const entitlements: Record<string, any> = customerInfo.entitlements || {};
      return entitlements[ENTITLEMENT_ID]?.expirationDate || null;
    } catch (error: any) {
      console.error('Error getting subscription expiration:', error);
      return null;
    }
  }
}