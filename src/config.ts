export const APP_CONFIG = {
  name: "FoodCart360",
  version: "1.0.0",
  env: "production",
  apiBaseUrl: "",
  offlineMode: true,
  logging: false,
  isNative: typeof (window as any).Capacitor !== 'undefined',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }
};