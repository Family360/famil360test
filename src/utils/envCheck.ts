// src/utils/envCheck.ts
export const validateEnvironment = (): void => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_REVENUECAT_ANDROID_KEY'
  ];

  const missing: string[] = [];

  required.forEach(key => {
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

  // Validate Firebase API key format
  const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!firebaseApiKey.startsWith('AIza')) {
    throw new Error('Invalid Firebase API key format. It should start with "AIza".');
  }

  // Validate RevenueCat key format
  const revenueCatKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
  if (!revenueCatKey.startsWith('goog_')) {
    throw new Error('Invalid RevenueCat Android key format. It should start with "goog_".');
  }
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined. Please check your .env or .env.production file.`);
  }
  return value;
};