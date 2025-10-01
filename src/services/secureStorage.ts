// src/services/secureStorage.ts
import CryptoJS from 'crypto-js';

// Generate a stable encryption key from Firebase project ID
const generateEncryptionKey = (): string => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'foodcart360-a8453';
  const salt = 'foodcart360-secure-salt-v1';
  return CryptoJS.PBKDF2(projectId + salt, salt, { 
    keySize: 256/32, 
    iterations: 1000 
  }).toString();
};

export class SecureStorage {
  private static encryptionKey = generateEncryptionKey();

  static encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to plain text
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || encryptedData; // Fallback if decryption fails
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original if decryption fails
    }
  }

  // Enhanced secure storage methods
  static async setEncryptedItem(key: string, data: any): Promise<void> {
    try {
      const encrypted = this.encrypt(JSON.stringify(data));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error saving encrypted data:', error);
      // Fallback to plain storage
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  static async getDecryptedItem<T>(key: string): Promise<T | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Try to decrypt first
      const decrypted = this.decrypt(encrypted);
      const parsed = JSON.parse(decrypted);
      return parsed as T;
    } catch (error) {
      // If decryption fails, try parsing as plain JSON
      try {
        const plain = localStorage.getItem(key);
        if (!plain) return null;
        return JSON.parse(plain) as T;
      } catch (parseError) {
        console.error('Error reading stored data:', parseError);
        return null;
      }
    }
  }

  // Existing methods with encryption
  static async setAuthToken(token: string): Promise<void> {
    await this.setEncryptedItem('auth_token', token);
  }

  static async getAuthToken(): Promise<string | null> {
    return await this.getDecryptedItem<string>('auth_token');
  }

  static async setUserData(userData: any): Promise<void> {
    await this.setEncryptedItem('user_data', userData);
  }

  static async getUserData(): Promise<any> {
    return await this.getDecryptedItem('user_data');
  }

  static async setCustomerInfo(customerInfo: any): Promise<void> {
    await this.setEncryptedItem('revenuecat_customer_info', customerInfo);
  }

  static async getCustomerInfo(): Promise<any> {
    return await this.getDecryptedItem('revenuecat_customer_info');
  }

  static async clearUserData(): Promise<void> {
    const keys = ['auth_token', 'user_data', 'revenuecat_customer_info'];
    keys.forEach(key => localStorage.removeItem(key));
  }

  // Security validation
  static async validateSession(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      // Basic token validation (for offline use)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      // Check if token is expired (basic offline check)
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }
}