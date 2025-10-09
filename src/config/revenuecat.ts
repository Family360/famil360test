export const revenueCatConfig = {
  ios: {
    apiKey: '', // No iOS key since Android-only
  },
  android: {
    apiKey: import.meta.env.VITE_REVENUECAT_ANDROID_KEY, // Uses goog_mOchuLHakKPAHNPGoGZWUIlxMLD
  }
};

// ✅ Match your RevenueCat dashboard entitlement
export const ENTITLEMENT_ID = "pro";

// Offering identifiers (from RevenueCat dashboard)
export const OFFERING_IDS = {
  default: "default",
  quarterly: "quarterly",
  annual: "annual"
};