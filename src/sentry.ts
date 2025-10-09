import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  enabled: true, // Enable always, including debug mobile for better error capture
  environment: import.meta.env.MODE,
  release: 'foodcart360@0.0.1'
});

// Override console.error for Sentry
const originalConsoleError = console.error;
console.error = (msg, ...args) => {
  Sentry.captureException(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)), { extra: { args } });
  originalConsoleError(msg, ...args);
};