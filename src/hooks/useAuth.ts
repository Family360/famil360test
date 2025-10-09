// src/hooks/useAuth.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import * as Sentry from "@sentry/react";

import { getUserProfile, setUserProfile, clearUserProfileCache } from "@/firebase";
import { useToast } from "@/components/ui/use-toast";
import languageService from "@/services/languageService";
import { localStorageService, UserProfile } from "@/services/localStorage";

// Import Security Service for monitoring
import { securityService } from "@/services/enhancedSecurity";

export interface FirebaseUserLike {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  refreshToken: string;
  providerData: any[];
  metadata: { creationTime?: string; lastSignInTime?: string };
  tenantId: string | null;
  delete: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<any>;
  reload: () => Promise<void>;
  toJSON: () => object;
}

interface UseAuthReturn {
  user: any | FirebaseUserLike | null;
  profileComplete: boolean;
  loading: boolean;
  authInitialized: boolean;
  googleSignIn: () => Promise<any | FirebaseUserLike | null>;
  signUp: (email: string, password: string) => Promise<any | FirebaseUserLike | null>;
  login: (email: string, password: string) => Promise<any | FirebaseUserLike | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfileCompletion: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<any | FirebaseUserLike | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();
  const t = useCallback((key: string) => languageService.translate(key), []);
  const authInitRef = useRef(false);
  const pendingProfileChecks = useRef<Set<string>>(new Set());

  const checkProfileCompletion = useCallback(async (userId: string): Promise<boolean> => {
    // Prevent duplicate profile checks for the same user
    if (pendingProfileChecks.current.has(userId)) {
      return false;
    }

    pendingProfileChecks.current.add(userId);
    
    try {
      if (import.meta.env.DEV) {
        console.log("🔍 Checking profile completion for:", userId);
      }
      
      // Use cache-only system - no Firestore calls
      const profile = await getUserProfile(userId);
      const isComplete = Boolean(profile?.profileComplete);
      
      if (import.meta.env.DEV) {
        console.log(`📊 Profile completion for ${userId}: ${isComplete}`);
      }
      return isComplete;
      
    } catch (err) {
      console.warn("Profile completion check failed, assuming incomplete:", err);
      return false;
    } finally {
      pendingProfileChecks.current.delete(userId);
    }
  }, []);

  const mapNativeUser = useCallback((userData: any): FirebaseUserLike => ({
    uid: userData.uid,
    email: userData.email ?? null,
    emailVerified: userData.emailVerified ?? false,
    displayName: userData.displayName ?? null,
    photoURL: userData.photoURL ?? null,
    phoneNumber: userData.phoneNumber ?? null,
    providerData: userData.providerData ?? [],
    metadata: {
      creationTime: userData.metadata?.creationTime,
      lastSignInTime: userData.metadata?.lastSignInTime,
    },
    refreshToken: userData.stsTokenManager?.refreshToken ?? "",
    tenantId: null,
    delete: async () => {
      try {
        await FirebaseAuthentication.deleteUser();
      } catch (err) {
        Sentry.captureException(err);
        throw err;
      }
    },
    getIdToken: async (forceRefresh?: boolean) => {
      const res = await FirebaseAuthentication.getIdToken({ forceRefresh: Boolean(forceRefresh) });
      return res.token;
    },
    getIdTokenResult: async (forceRefresh?: boolean) => {
      const res = await FirebaseAuthentication.getIdToken({ forceRefresh: Boolean(forceRefresh) });
      return {
        token: res.token,
        expirationTime: "",
        issuedAtTime: "",
        authTime: "",
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
      };
    },
    reload: async (): Promise<void> => {
      await FirebaseAuthentication.getCurrentUser();
      return;
    },
    toJSON: () => ({
      uid: userData.uid,
      email: userData.email,
      emailVerified: userData.emailVerified,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      phoneNumber: userData.phoneNumber,
    }),
  }), []);

  const handleAuthError = useCallback((error: any, defaultMessageKey = "auth_failed") => {
    console.error("Auth error:", error);
    
    // Don't log network-related errors to Sentry
    if (error.code !== 'auth/network-request-failed' && 
        !error.message?.includes('network') &&
        !error.message?.includes('Failed to fetch')) {
      Sentry.captureException(error, { tags: { component: "useAuth", action: defaultMessageKey } });
    }

    let errorMessage = t(defaultMessageKey);

    const code = error?.code ?? error?.message ?? "";

    switch (code) {
      case "auth/popup-closed-by-user":
        errorMessage = t("popup_closed");
        break;
      case "auth/popup-blocked":
        errorMessage = t("popup_blocked");
        break;
      case "auth/network-request-failed":
        errorMessage = t("network_error");
        break;
      case "auth/invalid-credential":
        errorMessage = t("google_invalid_credential");
        break;
      case "auth/too-many-requests":
        errorMessage = t("too_many_requests") || "Too many attempts. Please try again later.";
        break;
      case "auth/user-not-found":
        errorMessage = t("user_not_found") || "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = t("wrong_password") || "Incorrect password.";
        break;
      case "auth/email-already-in-use":
        errorMessage = t("email_in_use") || "This email is already registered.";
        break;
      case "auth/weak-password":
        errorMessage = t("weak_password") || "Password is too weak.";
        break;
      case "auth/invalid-email":
        errorMessage = t("invalid_email") || "Invalid email address.";
        break;
      default:
        if (typeof code === "string" && code.includes("plugin_not_installed")) {
          errorMessage = t("google_signin_not_installed");
        } else if (typeof code === "string" && code.includes("12501")) {
          errorMessage = t("google_play_services_missing");
        } else if (typeof code === "string" && code.includes("12500")) {
          errorMessage = t("google_play_services_update_required");
        } else if (error?.message) {
          errorMessage = t(error.message) || error.message;
        }
    }

    toast({
      title: t("error"),
      description: errorMessage,
      variant: "destructive",
    });

    return null;
  }, [t, toast]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted || authInitRef.current) return;

      try {
        setLoading(true);
        
        if (isNative) {
          await FirebaseAuthentication.removeAllListeners();
          
          await FirebaseAuthentication.addListener("authStateChange", async (change: any) => {
            try {
              if (change?.user) {
                const nativeUser = mapNativeUser(change.user);
                setUser(nativeUser);
                
                // Defer profile check to prevent blocking auth flow
                setTimeout(async () => {
                  try {
                    const complete = await checkProfileCompletion(nativeUser.uid);
                    setProfileComplete(complete);
                  } catch (profileError) {
                    console.warn("Profile completion check failed:", profileError);
                    setProfileComplete(false);
                  }
                }, 100);
              } else {
                setUser(null);
                setProfileComplete(false);
                await clearUserProfileCache('current');
              }
            } catch (error) {
              console.error("Auth state change error:", error);
            } finally {
              if (!authInitRef.current) {
                setLoading(false);
                setAuthInitialized(true);
                authInitRef.current = true;
              }
            }
          });

          // Get initial user state
          try {
            const currentUser = await FirebaseAuthentication.getCurrentUser();
            if (currentUser.user) {
              const nativeUser = mapNativeUser(currentUser.user);
              setUser(nativeUser);
              const complete = await checkProfileCompletion(nativeUser.uid);
              setProfileComplete(complete);
            }
          } catch (error) {
            console.warn("Initial native user fetch failed:", error);
          }
        } else {
          // Web platform
          const { getAuth, browserLocalPersistence, setPersistence } = await import("firebase/auth");
          const auth = getAuth();
          
          try {
            await setPersistence(auth, browserLocalPersistence);
          } catch (persistenceError) {
            console.warn("Persistence setting failed:", persistenceError);
          }

          unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
            try {
              if (authUser) {
                setUser(authUser);
                
                // Defer profile check
                setTimeout(async () => {
                  try {
                    const complete = await checkProfileCompletion(authUser.uid);
                    setProfileComplete(complete);
                  } catch (profileError) {
                    console.warn("Profile completion check failed:", profileError);
                    setProfileComplete(false);
                  }
                }, 100);
              } else {
                setUser(null);
                setProfileComplete(false);
                await clearUserProfileCache('current');
              }
            } catch (error) {
              console.error("Auth state change error:", error);
            } finally {
              if (!authInitRef.current) {
                setLoading(false);
                setAuthInitialized(true);
                authInitRef.current = true;
              }
            }
          });
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        Sentry.captureException(error, { 
          tags: { component: "useAuth", action: "initializeAuth" }
        });
        
        setLoading(false);
        setAuthInitialized(true);
        authInitRef.current = true;
      }
    };

    initializeAuth();

    // Fallback timeout - reduced from 15s to 8s
    const timeoutId = setTimeout(() => {
      if (mounted && !authInitRef.current) {
        console.log("Auth initialization timeout - forcing ready state");
        setLoading(false);
        setAuthInitialized(true);
        authInitRef.current = true;
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (unsubscribe) {
        unsubscribe();
      }
      
      if (isNative) {
        FirebaseAuthentication.removeAllListeners().catch(console.warn);
      }
    };
  }, [isNative, mapNativeUser, checkProfileCompletion]);

  const checkNetwork = async (): Promise<void> => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }
  };

  const googleSignIn = async (): Promise<any | FirebaseUserLike | null> => {
    try {
      await checkNetwork();

      if (isNative) {
        const result = await FirebaseAuthentication.signInWithGoogle({
          useCustomTabs: true,
          scopes: ["profile", "email"],
        });

        if (result?.user) {
          const nativeUser = mapNativeUser(result.user);
          setUser(nativeUser);
          const complete = await checkProfileCompletion(nativeUser.uid);
          setProfileComplete(complete);
          return nativeUser;
        }
        throw new Error("google_login_failed");
      } else {
        const { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getAuth, getRedirectResult } = await import("firebase/auth");
        const provider = new GoogleAuthProvider();
        provider.addScope("email profile");
        
        // Configure provider for better popup handling
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        const auth = getAuth();
        
        // First check if there's a pending redirect result
        try {
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult?.user) {
            setUser(redirectResult.user);
            const complete = await checkProfileCompletion(redirectResult.user.uid);
            setProfileComplete(complete);
            return redirectResult.user;
          }
        } catch (redirectError) {
          console.log('No redirect result:', redirectError);
        }
        
        try {
          const userCredential = await signInWithPopup(auth, provider);
          setUser(userCredential.user);
          const complete = await checkProfileCompletion(userCredential.user.uid);
          setProfileComplete(complete);
          return userCredential.user;
        } catch (popupError: any) {
          console.log('Popup error:', popupError.code);
          
          // Handle specific popup errors
          if (popupError?.code === "auth/popup-blocked" || 
              popupError?.code === "auth/popup-closed-by-user" ||
              popupError?.code === "auth/cancelled-popup-request") {
            
            console.log('Popup failed, trying redirect...');
            try {
              await signInWithRedirect(auth, provider);
              return null; // Will be handled by redirect result
            } catch (redirectError) {
              console.error('Redirect also failed:', redirectError);
              throw new Error("Please allow popups for this site or try again");
            }
          }
          throw popupError;
        }
      }
    } catch (err: any) {
      return handleAuthError(err, "google_login_failed");
    }
  };

  const signUp = async (email: string, password: string): Promise<any | FirebaseUserLike | null> => {
    try {
      await checkNetwork();

      if (isNative) {
        const res = await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password });
        if (res?.user) {
          const nativeUser = mapNativeUser(res.user);
          setUser(nativeUser);
          setProfileComplete(false);
          try {
            await FirebaseAuthentication.sendEmailVerification();
          } catch (err) {
            Sentry.captureException(err);
          }
          return nativeUser;
        }
        throw new Error("signup_failed");
      } else {
        const { createUserWithEmailAndPassword, getAuth, sendEmailVerification } = await import("firebase/auth");
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setProfileComplete(false);
        try {
          await sendEmailVerification(userCredential.user);
        } catch (err) {
          Sentry.captureException(err);
        }
        return userCredential.user;
      }
    } catch (err: any) {
      return handleAuthError(err, "signup_failed");
    }
  };

  const login = async (email: string, password: string): Promise<any | FirebaseUserLike | null> => {
    try {
      await checkNetwork();

      if (isNative) {
        const res = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
        if (res?.user) {
          const nativeUser = mapNativeUser(res.user);
          setUser(nativeUser);
          const complete = await checkProfileCompletion(nativeUser.uid);
          setProfileComplete(complete);
          return nativeUser;
        }
        throw new Error("login_failed");
      } else {
        const { signInWithEmailAndPassword, getAuth } = await import("firebase/auth");
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        const complete = await checkProfileCompletion(userCredential.user.uid);
        setProfileComplete(complete);
        return userCredential.user;
      }
    } catch (err: any) {
      return handleAuthError(err, "login_failed");
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await checkNetwork();

      if (isNative) {
        await FirebaseAuthentication.signOut();
        const { getAuth, signOut } = await import("firebase/auth");
        const auth = getAuth();
        await signOut(auth);
      }
      setUser(null);
      setProfileComplete(false);
      localStorageService.clearCurrentUser();
      await clearUserProfileCache('current');

      toast({
        title: t("success"),
        description: "Successfully signed out",
      });
    } catch (err: any) {
      console.error('Logout error:', err);
      // Don't show error toast for logout failures - just log it
      Sentry.captureException(err, { tags: { component: "useAuth", action: "logout" } });
      throw new Error(t("signout_failed"));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await checkNetwork();

      if (isNative) {
        await FirebaseAuthentication.sendPasswordResetEmail({ email });
      } else {
        const { sendPasswordResetEmail, getAuth } = await import("firebase/auth");
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
      }
      toast({
        title: t("success"),
        description: t("password_reset_email_sent"),
      });
    } catch (err: any) {
      handleAuthError(err, "reset_password_failed");
      throw err;
    }
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    try {
      await checkNetwork();

      if (isNative) {
        await FirebaseAuthentication.updatePassword({ newPassword });
      } else {
        const { updatePassword, getAuth } = await import("firebase/auth");
        const auth = getAuth();
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
        } else {
          throw new Error("no_user_logged_in");
        }
      }
      toast({
        title: t("success"),
        description: t("password_changed"),
      });
    } catch (err: any) {
      handleAuthError(err, "change_password_failed");
      throw err;
    }
  };

  const updateProfileCompletion = async (): Promise<void> => {
    if (!user) return;

    try {
      setProfileComplete(true);
      const profileData: UserProfile = {
        id: (user as any).uid,
        profileComplete: true,
        timestamp: Date.now(),
        name: (user as any).displayName || "",
        email: (user as any).email || "",
        stallName: "",
        createdAt: new Date().toISOString(),
      } as UserProfile;

      await setUserProfile(profileData.id, profileData);
    } catch (err) {
      Sentry.captureException(err, { tags: { component: "useAuth", action: "updateProfileCompletion" } });
    }
  };

  return {
    user,
    profileComplete,
    loading,
    authInitialized,
    googleSignIn,
    signUp,
    login,
    logout,
    resetPassword,
    changePassword,
    updateProfileCompletion,
  };
};