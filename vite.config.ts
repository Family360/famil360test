import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Production-focused Vite configuration for FoodCart360
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (.env.production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  // Validate required environment variables for Firebase and RevenueCat
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_REVENUECAT_ANDROID_KEY',
  ];
  const missingVars = requiredVars.filter((key) => !env[key]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Ensure they are defined in .env.${mode} file.`
    );
  }

  // Detect Capacitor build (optional: disables PWA on native builds)
  const isCapacitor = process.env.CAPACITOR_PLATFORM !== undefined;

  return {
    // Use relative base so assets load correctly inside Capacitor WebView
    base: './',

    // Server configuration for mobile network access
    server: {
      host: '0.0.0.0', // Allow access from network
      port: 5173,
      strictPort: true,
      hmr: {
        host: 'localhost', // Use localhost for HMR
        protocol: 'ws',
      },
    },

    plugins: [
      react(),
      // Only enable PWA for web builds, not Capacitor
      !isCapacitor &&
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'FoodCart360',
            short_name: 'FoodCart360',
            icons: [
              { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            ],
            theme_color: '#ff7043',
            background_color: '#ffffff',
            display: 'standalone',
          },
          workbox: {
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'firebase-cache',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/api\.revenuecat\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'revenuecat-cache',
                  expiration: { maxAgeSeconds: 60 * 60 },
                },
              },
              {
                urlPattern: /\.(?:png|jpg|svg|ico)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
                },
              },
            ],
          },
        }),
    ].filter(Boolean),

    build: {
      outDir: 'dist',
      minify: 'esbuild',
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            revenuecat: ['@revenuecat/purchases-capacitor'],
          },
        },
      },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
      'import.meta.env.VITE_REVENUECAT_ANDROID_KEY': JSON.stringify(env.VITE_REVENUECAT_ANDROID_KEY || ''),
    },
  };
});
