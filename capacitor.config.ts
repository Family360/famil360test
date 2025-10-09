import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  /**
   * Core Capacitor app identifiers
   */
  appId: 'com.foodcart360.app',
  appName: 'FoodCart360',

  /**
   * Web assets built by Vite
   */
  webDir: 'dist',

  /**
   * Development server / Android WebView settings
   */
  server: {
    // Force HTTPS scheme in Android WebView
    androidScheme: 'https',

    // Allow clear text traffic for local development
    cleartext: true,

    // Whitelist of external domains the app may navigate to
    allowNavigation: [
      // Firebase project hosting
      'foodcart360-a8453.firebaseapp.com',

      // Google identity / OAuth endpoints
      'accounts.google.com',
      'apis.google.com',
      'securetoken.googleapis.com',
      'www.googleapis.com',
      'identitytoolkit.googleapis.com',

      // Firebase Storage
      'firebasestorage.googleapis.com',

      // RevenueCat API
      'api.revenuecat.com',

      // Local network for development
      '192.168.100.40',
      'localhost',
    ],
  },

  /**
   * Plugin configurations
   */
  plugins: {
    /**
     * Firebase Authentication plugin
     * - Supports Google Sign-In and Email/Password
     */
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'password'],
      authDomain: 'foodcart360-a8453.firebaseapp.com',
    },

    /**
     * Splash screen plugin
     * - Controls the native splash experience
     */
    SplashScreen: {
      // Show splash for 0ms (instant hide on app load)
      launchShowDuration: 0,
      launchAutoHide: true,

      // Fallback background color
      backgroundColor: '#FFFFFF',

      // Image scale mode
      androidScaleType: 'CENTER_CROP',

      // Hide spinner (we use React loading UI instead)
      showSpinner: false,
    },
  },
};

export default config;
