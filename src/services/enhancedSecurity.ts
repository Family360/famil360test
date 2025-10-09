// Enhanced Security Service for FoodCart360
// Additional security measures for production deployment

import CryptoJS from 'crypto-js';
import { Capacitor } from '@capacitor/core';
// import { Device } from '@capacitor/device'; // Not available, using alternative
import { Preferences } from '@capacitor/preferences';

interface SecurityConfig {
  enableRootDetection: boolean;
  enableDebuggerDetection: boolean;
  enableScreenRecordingDetection: boolean;
  enableDataObfuscation: boolean;
  enableCertificatePinning: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // minutes
}

interface SecurityEvent {
  type: 'root_detected' | 'debugger_detected' | 'suspicious_activity' | 'tampering_attempt';
  timestamp: number;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class EnhancedSecurityService {
  private config: SecurityConfig = {
    enableRootDetection: true,
    enableDebuggerDetection: true,
    enableScreenRecordingDetection: true,
    enableDataObfuscation: true,
    enableCertificatePinning: false, // Enable for production
    maxLoginAttempts: 5,
    sessionTimeout: 30
  };

  private securityEvents: SecurityEvent[] = [];
  private loginAttempts = 0;
  private lastLoginAttempt = 0;

  constructor() {
    this.initializeSecurity();
  }

  private async initializeSecurity() {
    if (Capacitor.isNativePlatform()) {
      await this.enableNativeSecurity();
    }
    this.setupSecurityMonitoring();
  }

  private async enableNativeSecurity() {
    // Setup native security measures
    this.setupRootDetection();
    this.setupDebuggerDetection();
    this.setupCertificatePinning();
  }

  private setupRootDetection() {
    if (!this.config.enableRootDetection) return;

    // Check for common root indicators
    this.checkRootIndicators();
  }

  private checkRootIndicators() {
    const suspiciousFiles = [
      '/system/xbin/su',
      '/system/bin/su',
      '/sbin/su',
      '/usr/bin/su'
    ];

    // In a real app, you'd check for these files
    // For now, we'll implement basic checks
    if (typeof window !== 'undefined') {
      this.detectSuspiciousUserAgents();
    }
  }

  private detectSuspiciousUserAgents() {
    const userAgent = navigator.userAgent.toLowerCase();
    const suspiciousPatterns = [
      'emulator',
      'genymotion',
      'bluestacks',
      'nox',
      'memu',
      'ldplayer'
    ];

    const isSuspicious = suspiciousPatterns.some(pattern =>
      userAgent.includes(pattern)
    );

    if (isSuspicious) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: Date.now(),
        details: `Suspicious user agent detected: ${userAgent}`,
        severity: 'medium'
      });
    }
  }

  private setupDebuggerDetection() {
    if (!this.config.enableDebuggerDetection) return;

    // Check if debugger is attached
    this.detectDebugger();
  }

  private detectDebugger() {
    let debuggerDetected = false;

    // Method 1: Check for debugger statement
    const checkDebugger = () => {
      debugger;
      return false;
    };

    // Method 2: Check performance anomalies
    const start = performance.now();
    checkDebugger();
    const end = performance.now();

    if (end - start > 100) { // Debugger likely present
      debuggerDetected = true;
    }

    if (debuggerDetected) {
      this.logSecurityEvent({
        type: 'debugger_detected',
        timestamp: Date.now(),
        details: 'Debugger attached to application',
        severity: 'high'
      });

      // In production, you might want to exit or disable features
      console.warn('⚠️ Debugger detected - some features may be disabled');
    }
  }

  private setupCertificatePinning() {
    if (!this.config.enableCertificatePinning) return;

    // Certificate pinning implementation would go here
    // For now, we'll implement basic checks
    this.validateNetworkSecurity();
  }

  private validateNetworkSecurity() {
    // Check if using secure connections
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: Date.now(),
        details: 'Insecure connection detected',
        severity: 'medium'
      });
    }
  }

  private setupSecurityMonitoring() {
    // Monitor for security events
    this.setupLoginAttemptMonitoring();
    this.setupSessionMonitoring();
  }

  private setupLoginAttemptMonitoring() {
    // Track login attempts
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Monitor auth endpoints
      if (args[0]?.toString().includes('auth') ||
          args[0]?.toString().includes('login')) {
        this.trackLoginAttempt();
      }

      return response;
    };
  }

  private trackLoginAttempt() {
    const now = Date.now();
    this.loginAttempts++;

    if (this.loginAttempts > this.config.maxLoginAttempts) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: now,
        details: `Too many login attempts: ${this.loginAttempts}`,
        severity: 'high'
      });
    }

    this.lastLoginAttempt = now;
  }

  private setupSessionMonitoring() {
    // Check session validity
    setInterval(() => {
      this.validateSession();
    }, this.config.sessionTimeout * 60 * 1000);
  }

  private validateSession() {
    // Check if session is still valid
    const sessionAge = Date.now() - this.lastLoginAttempt;
    const maxAge = this.config.sessionTimeout * 60 * 1000;

    if (sessionAge > maxAge) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: Date.now(),
        details: 'Session expired but still active',
        severity: 'medium'
      });
    }
  }

  private logSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event);
    console.warn('🔒 Security Event:', event);

    // In production, send to security monitoring service
    this.sendToSecurityService(event);

    // Store locally for analysis
    this.storeSecurityEvent(event);
  }

  private async sendToSecurityService(event: SecurityEvent) {
    // In production, send to your security monitoring service
    // For now, we'll just log it
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error('🚨 Critical Security Event:', event);
    }
  }

  private async storeSecurityEvent(event: SecurityEvent) {
    try {
      if (Capacitor.isNativePlatform()) {
        const events = await Preferences.get({ key: 'security_events' });
        const existing = events.value ? JSON.parse(events.value) : [];
        existing.push(event);

        // Keep only last 100 events
        const recent = existing.slice(-100);

        await Preferences.set({
          key: 'security_events',
          value: JSON.stringify(recent)
        });
      } else {
        const events = JSON.parse(localStorage.getItem('security_events') || '[]');
        events.push(event);
        const recent = events.slice(-100);
        localStorage.setItem('security_events', JSON.stringify(recent));
      }
    } catch (error) {
      console.error('Failed to store security event:', error);
    }
  }

  // Public API
  async validateAppSecurity(): Promise<{
    isSecure: boolean;
    issues: string[];
    score: number;
  }> {
    const issues: string[] = [];
    let score = 100;

    // Check root detection (only log if actual root detected)
    if (this.config.enableRootDetection) {
      // In production, this would check for actual root indicators
      // For now, skip logging in development
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        issues.push('Root detection check');
        score -= 10;
      }
    }

    // Check debugger (only in production)
    if (this.config.enableDebuggerDetection && import.meta.env.PROD) {
      issues.push('Debugger detection check');
      score -= 5;
    }

    // Check network security (only in production, not localhost)
    if (window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      issues.push('Insecure connection');
      score -= 20;
    }

    return {
      isSecure: score >= 80,
      issues,
      score: Math.max(0, score)
    };
  }

  async getSecurityReport(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    recommendations: string[];
  }> {
    const criticalEvents = this.securityEvents.filter(e => e.severity === 'critical').length;

    return {
      totalEvents: this.securityEvents.length,
      criticalEvents,
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.securityEvents.some(e => e.type === 'root_detected')) {
      recommendations.push('Rooted device detected - recommend against using on rooted devices');
    }

    if (this.loginAttempts > this.config.maxLoginAttempts) {
      recommendations.push('Multiple login attempts detected - implement rate limiting');
    }

    if (this.securityEvents.some(e => e.type === 'debugger_detected')) {
      recommendations.push('Debugger detected - disable advanced features in debug mode');
    }

    return recommendations;
  }

  // Data obfuscation for sensitive fields
  obfuscateData(data: string, level: 'light' | 'medium' | 'heavy' = 'medium'): string {
    if (!this.config.enableDataObfuscation) return data;

    switch (level) {
      case 'light':
        return data.replace(/./g, '*');
      case 'medium':
        return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
      case 'heavy':
        return CryptoJS.SHA256(data).toString().substring(0, 16);
      default:
        return data;
    }
  }
}

export const securityService = new EnhancedSecurityService();
export default securityService;
