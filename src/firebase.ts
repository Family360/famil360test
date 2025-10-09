// src/firebase.ts - COMPLETE CACHE-ONLY SOLUTION
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Import localStorageService to fix the error
import { localStorageService } from "@/services/localStorage";

// Cache-based profile system - COMPLETELY BYPASSES FIRESTORE FOR AUTH
export const getUserProfile = async (uid: string): Promise<any> => {
  if (!uid || typeof uid !== "string" || uid.trim() === "") {
    console.warn("getUserProfile called with invalid UID:", uid);
    return null;
  }

  if (import.meta.env.DEV) {
    console.log("🔐 Using cache-only profile system for user:", uid);
  }
  
  try {
    // PRIMARY: Capacitor Preferences (Most reliable)
    try {
      const { value } = await Preferences.get({ key: `user_profile_${uid}` });
      if (value) {
        const parsed = JSON.parse(value);
        if (import.meta.env.DEV) {
          console.log("✅ Profile found in Preferences for:", uid);
        }
        return {
          id: uid,
          ...parsed,
          profileComplete: Boolean(parsed?.profileComplete),
        };
      }
    } catch (prefError) {
      console.warn("Preferences read failed:", prefError);
    }

    // SECONDARY: localStorageService fallback
    try {
      const localProfile = await localStorageService.getUserProfile();
      if (localProfile?.id === uid) {
        if (import.meta.env.DEV) {
          console.log("✅ Profile found in localStorageService for:", uid);
        }
        // Migrate to Preferences for future use
        await Preferences.set({
          key: `user_profile_${uid}`,
          value: JSON.stringify(localProfile),
        });
        return localProfile;
      }
    } catch (localError) {
      console.warn("localStorageService fallback failed:", localError);
    }

    // TERTIARY: Legacy localStorage (for migration)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const legacyProfile = localStorage.getItem(`user_profile_${uid}`);
        if (legacyProfile) {
          const parsed = JSON.parse(legacyProfile);
          if (import.meta.env.DEV) {
            console.log("✅ Profile found in legacy localStorage for:", uid);
          }
          const profileData = {
            id: uid,
            ...parsed,
            profileComplete: Boolean(parsed?.profileComplete),
          };
          // Migrate to Preferences
          await Preferences.set({
            key: `user_profile_${uid}`,
            value: JSON.stringify(profileData),
          });
          return profileData;
        }
      } catch (legacyError) {
        console.warn("Legacy localStorage read failed:", legacyError);
      }
    }

    if (import.meta.env.DEV) {
      console.log("❌ No profile found for user:", uid);
    }
    return null;
  } catch (error) {
    console.error("🚨 Cache-based profile system error:", error);
    return null;
  }
};

export const setUserProfile = async (uid: string, data: any): Promise<boolean> => {
  if (!uid || !data) {
    console.warn("setUserProfile called with invalid parameters");
    return false;
  }

  try {
    const profileData = {
      ...data,
      id: uid,
      updatedAt: new Date().toISOString(),
      lastSynced: Date.now(),
    };

    if (import.meta.env.DEV) {
      console.log("💾 Saving profile to cache systems for:", uid);
    }

    // Store in multiple locations for redundancy
    const savePromises = [];

    // Primary: Capacitor Preferences
    savePromises.push(
      Preferences.set({
        key: `user_profile_${uid}`,
        value: JSON.stringify(profileData),
      })
    );

    // Secondary: localStorageService
    savePromises.push(
      localStorageService.setUserProfile(profileData).catch(e => 
        console.warn("localStorageService save failed:", e)
      )
    );

    // Tertiary: Legacy localStorage (backup)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profileData));
      } catch (e) {
        console.warn("Legacy localStorage save failed:", e);
      }
    }

    await Promise.all(savePromises);
    if (import.meta.env.DEV) {
      console.log("✅ Profile successfully saved to all cache systems");
    }
    return true;
  } catch (error) {
    console.error("🚨 Failed to save profile to cache systems:", error);
    return false;
  }
};

export const clearUserProfileCache = async (uid: string): Promise<void> => {
  try {
    if (import.meta.env.DEV) {
      console.log("🗑️ Clearing profile cache for:", uid);
    }
    
    const clearPromises = [
      Preferences.remove({ key: `user_profile_${uid}` }),
      localStorageService.clearUserProfile().catch(e => 
        console.warn("localStorageService clear failed:", e)
      )
    ];

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`user_profile_${uid}`);
      } catch (e) {
        console.warn("Legacy localStorage clear failed:", e);
      }
    }

    await Promise.all(clearPromises);
    if (import.meta.env.DEV) {
      console.log("✅ Profile cache cleared for:", uid);
    }
  } catch (error) {
    console.error("Failed to clear profile cache:", error);
  }
};

// Minimal Firebase auth helper (web only)
export const getFirebaseAuth = async () => {
  if (!Capacitor.isNativePlatform()) {
    try {
      const { getAuth } = await import("firebase/auth");
      return getAuth();
    } catch (error) {
      console.error("Failed to get Firebase Auth:", error);
      throw error;
    }
  } else {
    throw new Error("getFirebaseAuth is web-only; use FirebaseAuthentication plugin on native");
  }
};

// Health check for cache system
export const checkCacheHealth = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(uid);
    return !!profile;
  } catch (error) {
    console.error("Cache health check failed:", error);
    return false;
  }
};

// Migration helper: Sync profile from any source to Preferences
export const migrateProfileToPreferences = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(uid);
    if (profile) {
      await Preferences.set({
        key: `user_profile_${uid}`,
        value: JSON.stringify(profile),
      });
      if (import.meta.env.DEV) {
        console.log("✅ Profile migrated to Preferences for:", uid);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Profile migration failed:", error);
    return false;
  }
};