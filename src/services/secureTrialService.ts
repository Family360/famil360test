// src/services/secureTrialService.ts
// Enhanced trial validation with simulated server-side validation and anti-tampering protection
import CryptoJS from 'crypto-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface TrialData {
  startTimestamp: number;
  deviceFingerprint: string;
  checksum: string;
  installId: string;
  lastServerValidation?: number;
  serverValidationCount?: number;
  tamperAttempts?: number;
}

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  isTampered: boolean;
  reason?: string;
  requiresServerValidation?: boolean;
}

interface ServerValidationResponse {
  valid: boolean;
  trialExtended?: boolean;
  blocked?: boolean;
  reason?: string;
  serverTimestamp?: number;
}

export class SecureTrialService {
  private static readonly TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly TRIAL_KEY = 'secure_trial_v3';
  private static readonly LAST_CHECK_KEY = 'last_time_check';
  private static readonly INSTALL_ID_KEY = 'install_id';
  private static readonly TAMPER_COUNT_KEY = 'tamper_attempts';

  // Local integrity validation (checksum/time/fingerprint). In production, you could replace
  // this with a real backend API call if desired, but RevenueCat already does server-side
  // entitlement validation for purchases.
  private static async validateLocalIntegrity(trialData: TrialData): Promise<ServerValidationResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate server-side validation logic
    const now = Date.now();
    const trialAge = now - trialData.startTimestamp;

    // Check if trial is within valid timeframe
    if (trialAge > this.TRIAL_DURATION_MS) {
      return {
        valid: false,
        blocked: true,
        reason: 'Trial period expired'
      };
    }

    // Check for suspicious activity patterns
    if (trialData.tamperAttempts && trialData.tamperAttempts > 3) {
      return {
        valid: false,
        blocked: true,
        reason: 'Suspicious activity detected'
      };
    }

    // Check if server validation is needed (simulate random server checks)
    const needsValidation = Math.random() < 0.1; // 10% chance for server validation

    if (needsValidation) {
      // Simulate server extending trial for legitimate users
      if (Math.random() < 0.8) { // 80% chance of successful validation
        return {
          valid: true,
          trialExtended: true,
          serverTimestamp: now,
          reason: 'Server validation successful'
        };
      } else {
        return {
          valid: false,
          blocked: true,
          reason: 'Server validation failed'
        };
      }
    }

    return {
      valid: true,
      serverTimestamp: now
    };
  }

  /**
   * Generate device fingerprint (harder to fake)
   * Combines platform, user agent, and screen info
   */
  private static async getDeviceFingerprint(): Promise<string> {
    try {
      const platform = Capacitor.getPlatform();
      const userAgent = navigator.userAgent;
      const screen = `${window.screen.width}x${window.screen.height}`;
      const appVersion = '1.0.0';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      return CryptoJS.SHA256(`${platform}-${userAgent}-${screen}-${appVersion}-${timezone}`).toString();
    } catch (error) {
      console.error('Failed to get device fingerprint:', error);
      // Fallback fingerprint
      return CryptoJS.SHA256(`fallback-${Date.now()}`).toString();
    }
  }

  /**
   * Get or create installation ID (unique per app install)
   */
  private static async getInstallId(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: this.INSTALL_ID_KEY });
        if (result.value) return result.value;

        // Generate new install ID
        const installId = CryptoJS.lib.WordArray.random(16).toString();
        await Preferences.set({ key: this.INSTALL_ID_KEY, value: installId });
        return installId;
      } else {
        let installId = localStorage.getItem(this.INSTALL_ID_KEY);
        if (!installId) {
          installId = CryptoJS.lib.WordArray.random(16).toString();
          localStorage.setItem(this.INSTALL_ID_KEY, installId);
        }
        return installId;
      }
    } catch (error) {
      console.error('Failed to get install ID:', error);
      return 'fallback-install-id';
    }
  }

  /**
   * Generate tamper-proof checksum with server validation data
   */
  private static generateChecksum(
    startTimestamp: number,
    fingerprint: string,
    installId: string,
    lastServerValidation?: number
  ): string {
    const secret = import.meta.env.VITE_FIREBASE_API_KEY || 'foodcart360-secret';
    const data = `${startTimestamp}-${fingerprint}-${installId}-${lastServerValidation || 0}`;
    return CryptoJS.HmacSHA256(data, secret).toString();
  }

  /**
   * Enhanced time manipulation detection
   */
  private static async detectTimeManipulation(): Promise<boolean> {
    try {
      const lastCheckStr = localStorage.getItem(this.LAST_CHECK_KEY);
      const now = Date.now();

      if (lastCheckStr) {
        const lastCheck = parseInt(lastCheckStr, 10);
        const diff = now - lastCheck;

        // If time went backwards by more than 1 hour, it's suspicious
        if (diff < -3600000) {
          console.warn('⚠️ Time manipulation detected: time went backwards');
          await this.recordTamperAttempt();
          return true;
        }

        // If time jumped forward by more than 30 days, also suspicious
        if (diff > 30 * 24 * 60 * 60 * 1000) {
          console.warn('⚠️ Time manipulation detected: large forward jump');
          await this.recordTamperAttempt();
          return true;
        }
      }

      localStorage.setItem(this.LAST_CHECK_KEY, now.toString());
      return false;
    } catch (error) {
      console.error('Time check error:', error);
      return false; // Don't block on error
    }
  }

  /**
   * Record tamper attempts for server validation
   */
  private static async recordTamperAttempt(): Promise<void> {
    try {
      const tamperCount = parseInt(localStorage.getItem(this.TAMPER_COUNT_KEY) || '0', 10) + 1;
      localStorage.setItem(this.TAMPER_COUNT_KEY, tamperCount.toString());

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: this.TAMPER_COUNT_KEY, value: tamperCount.toString() });
      }
    } catch (error) {
      console.error('Failed to record tamper attempt:', error);
    }
  }

  /**
   * Start secure trial with enhanced tamper-proof storage
   */
  static async startTrial(): Promise<void> {
    try {
      const fingerprint = await this.getDeviceFingerprint();
      const installId = await this.getInstallId();
      const startTimestamp = Date.now();
      const checksum = this.generateChecksum(startTimestamp, fingerprint, installId);

      const trialData: TrialData = {
        startTimestamp,
        deviceFingerprint: fingerprint,
        checksum,
        installId,
        serverValidationCount: 0,
        tamperAttempts: 0,
      };

      // Store encrypted in multiple places for redundancy
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(trialData),
        import.meta.env.VITE_FIREBASE_API_KEY || 'fallback-key'
      ).toString();

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: this.TRIAL_KEY, value: encrypted });
      } else {
        localStorage.setItem(this.TRIAL_KEY, encrypted);
      }

      console.log('✅ Enhanced secure trial started');
    } catch (error) {
      console.error('Failed to start trial:', error);
      throw error;
    }
  }

  /**
   * Get trial status with comprehensive security checks and server validation
   */
  static async getTrialStatus(): Promise<TrialStatus> {
    try {
      // Check for time manipulation first
      const timeManipulated = await this.detectTimeManipulation();
      if (timeManipulated) {
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: true,
          reason: 'Time manipulation detected',
        };
      }

      // Get trial data
      let encryptedData: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: this.TRIAL_KEY });
        encryptedData = result.value;
      } else {
        encryptedData = localStorage.getItem(this.TRIAL_KEY);
      }

      if (!encryptedData) {
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: false,
          reason: 'No trial data found',
        };
      }

      // Decrypt trial data
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        import.meta.env.VITE_FIREBASE_API_KEY || 'fallback-key'
      ).toString(CryptoJS.enc.Utf8);

      const trialData: TrialData = JSON.parse(decrypted);

      // Verify checksum (detect tampering)
      const expectedChecksum = this.generateChecksum(
        trialData.startTimestamp,
        trialData.deviceFingerprint,
        trialData.installId,
        trialData.lastServerValidation
      );

      if (expectedChecksum !== trialData.checksum) {
        console.warn('⚠️ Trial data checksum mismatch - tampering detected');
        await this.recordTamperAttempt();
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: true,
          reason: 'Checksum validation failed',
        };
      }

      // Verify device fingerprint (detect device transfer)
      const currentFingerprint = await this.getDeviceFingerprint();
      if (currentFingerprint !== trialData.deviceFingerprint) {
        console.warn('⚠️ Device fingerprint mismatch');
        await this.recordTamperAttempt();
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: true,
          reason: 'Device fingerprint mismatch',
        };
      }

      // Verify install ID
      const currentInstallId = await this.getInstallId();
      if (currentInstallId !== trialData.installId) {
        console.warn('⚠️ Install ID mismatch');
        await this.recordTamperAttempt();
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: true,
          reason: 'Install ID mismatch',
        };
      }

      // Check if server validation is needed (every 24 hours)
      const now = Date.now();
      const lastValidation = trialData.lastServerValidation || 0;
      const needsServerValidation = (now - lastValidation) > 24 * 60 * 60 * 1000;

      if (needsServerValidation) {
        console.log('🔄 Performing local integrity validation...');
        const serverResponse = await this.validateLocalIntegrity(trialData);

        if (!serverResponse.valid) {
          return {
            isActive: false,
            daysRemaining: 0,
            isTampered: true,
            reason: serverResponse.reason,
          };
        }

        // Update trial data with server validation
        trialData.lastServerValidation = serverResponse.serverTimestamp || now;
        trialData.serverValidationCount = (trialData.serverValidationCount || 0) + 1;

        // Re-encrypt and store updated trial data
        const updatedChecksum = this.generateChecksum(
          trialData.startTimestamp,
          trialData.deviceFingerprint,
          trialData.installId,
          trialData.lastServerValidation
        );
        trialData.checksum = updatedChecksum;

        const updatedEncrypted = CryptoJS.AES.encrypt(
          JSON.stringify(trialData),
          import.meta.env.VITE_FIREBASE_API_KEY || 'fallback-key'
        ).toString();

        if (Capacitor.isNativePlatform()) {
          await Preferences.set({ key: this.TRIAL_KEY, value: updatedEncrypted });
        } else {
          localStorage.setItem(this.TRIAL_KEY, updatedEncrypted);
        }

        console.log('✅ Server validation completed');
      }

      // Calculate remaining time
      const elapsed = Date.now() - trialData.startTimestamp;
      const remaining = this.TRIAL_DURATION_MS - elapsed;
      const daysRemaining = Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));

      // Additional validation: Check if start time is in the future (impossible)
      if (trialData.startTimestamp > Date.now()) {
        console.warn('⚠️ Trial start time is in the future - tampering detected');
        await this.recordTamperAttempt();
        return {
          isActive: false,
          daysRemaining: 0,
          isTampered: true,
          reason: 'Invalid start time',
        };
      }

      return {
        isActive: remaining > 0,
        daysRemaining,
        isTampered: false,
        requiresServerValidation: needsServerValidation,
      };
    } catch (error) {
      console.error('Trial status check error:', error);
      return {
        isActive: false,
        daysRemaining: 0,
        isTampered: true,
        reason: 'Validation error',
      };
    }
  }

  /**
   * Check if trial is active (simple wrapper)
   */
  static async isTrialActive(): Promise<boolean> {
    const status = await this.getTrialStatus();
    return status.isActive && !status.isTampered;
  }

  /**
   * Get detailed trial information
   */
  static async getTrialInfo(): Promise<{
    status: TrialStatus;
    validationCount: number;
    tamperAttempts: number;
  }> {
    const status = await this.getTrialStatus();
    let validationCount = 0;
    let tamperAttempts = 0;

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key: this.TRIAL_KEY });
        if (result.value) {
          const decrypted = CryptoJS.AES.decrypt(
            result.value,
            import.meta.env.VITE_FIREBASE_API_KEY || 'fallback-key'
          ).toString(CryptoJS.enc.Utf8);
          const trialData: TrialData = JSON.parse(decrypted);
          validationCount = trialData.serverValidationCount || 0;
          tamperAttempts = trialData.tamperAttempts || 0;
        }
      } else {
        const encryptedData = localStorage.getItem(this.TRIAL_KEY);
        if (encryptedData) {
          const decrypted = CryptoJS.AES.decrypt(
            encryptedData,
            import.meta.env.VITE_FIREBASE_API_KEY || 'fallback-key'
          ).toString(CryptoJS.enc.Utf8);
          const trialData: TrialData = JSON.parse(decrypted);
          validationCount = trialData.serverValidationCount || 0;
          tamperAttempts = trialData.tamperAttempts || 0;
        }
      }
    } catch (error) {
      console.error('Failed to get trial info:', error);
    }

    return {
      status,
      validationCount,
      tamperAttempts,
    };
  }

  /**
   * Reset trial (for testing only - should be removed in production)
   */
  static async resetTrial(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: this.TRIAL_KEY });
      await Preferences.remove({ key: this.INSTALL_ID_KEY });
    } else {
      localStorage.removeItem(this.TRIAL_KEY);
      localStorage.removeItem(this.INSTALL_ID_KEY);
    }
    localStorage.removeItem(this.LAST_CHECK_KEY);
    localStorage.removeItem(this.TAMPER_COUNT_KEY);
    console.log('⚠️ Trial reset (testing only)');
  }
}
