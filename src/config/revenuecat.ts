export const revenueCatConfig = {
  ios: {
    apiKey: '', // No iOS key since Android-only
  },
  android: {
    apiKey: import.meta.env.VITE_REVENUECAT_ANDROID_KEY, // Uses goog_mOchuLHakKPAHNPGoGZWUIlxMLD
  }
};

export const ENTITLEMENT_ID = "premium"; // Your entitlement identifier
export const PRODUCT_IDS = {
  monthly: "premium_monthly",
  quarterly: "premium_quarterly", 
  biannual: "premium_biannual",
  annual: "premium_annual"
};