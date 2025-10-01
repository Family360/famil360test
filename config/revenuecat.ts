// src/config/revenuecat.ts
export const revenueCatConfig = {
  ios: {
    apiKey: import.meta.env.VITE_REVENUECAT_IOS_KEY ?? "",
  },
  android: {
    apiKey: import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "",
  },
};

// Must match your RevenueCat dashboard entitlement identifier
export const ENTITLEMENT_ID = "premium_access"; 

// Product identifiers you configured in RevenueCat + Play Store
export const PRODUCT_IDS = {
  monthly: "premium_monthly",
  yearly: "premium_yearly",
};
