import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodcart360.app',
  appName: 'FoodCart360',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'foodcart360-a8453.firebaseapp.com',
      '*.google.com',
      '*.googleapis.com',
      'accounts.google.com',
      'securetoken.googleapis.com',
      '*.revenuecat.com',
    ],
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'password'],
      authDomain: 'foodcart360-a8453.firebaseapp.com',
    },
  },
};

export default config;