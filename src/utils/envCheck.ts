// src/utils/envCheck.ts
import { Capacitor } from '@capacitor/core';

export const validateEnvironment = (): void => {
  const isNative = Capacitor.isNativePlatform();

  // On web, Firebase config must be present. On native, we use the Capacitor plugin for Auth,
  // so missing Firebase web config should NOT crash the app.
  const webRequired = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  if (!isNative) {
    const missing: string[] = [];
    webRequired.forEach(key => {
      if (!import.meta.env[key]) {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        `Please check your .env or .env.production file.`
      );
    }

    // Validate Firebase API key format (web only)
    const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
    if (firebaseApiKey && !firebaseApiKey.startsWith('AIza')) {
      throw new Error('Invalid Firebase API key format. It should start with "AIza".');
    }
  }

  // RevenueCat key is optional. If provided, validate basic format; otherwise warn.
  const revenueCatKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined;
  if (revenueCatKey) {
    if (!revenueCatKey.startsWith('goog_')) {
      // Warn instead of crash to avoid breaking production builds
      console.warn('RevenueCat Android key seems invalid (expected to start with "goog_").');
    }
  } else {
    console.warn('VITE_REVENUECAT_ANDROID_KEY is not set. Subscription features may be limited on Android.');
  }
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined. Please check your .env or .env.production file.`);
  }
  return value as string;
};