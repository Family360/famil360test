/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_REVENUECAT_ANDROID_KEY: string;
  readonly VITE_REVENUECAT_IOS_KEY?: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // add more as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
