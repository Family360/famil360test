import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Network } from "@capacitor/network";
import { auth, getUserProfile } from "@/firebase";
import { useToast } from "@/components/ui/use-toast";
import languageService from "@/services/languageService";
import { Preferences } from "@capacitor/preferences";
import * as Sentry from "@sentry/react";
import { localStorageService } from "@/services/localStorage";

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

export const useAuth = () => {
  const [user, setUser] = useState<User | FirebaseUserLike | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();
  const t = (key: string) => languageService.translate(key);

  const checkProfileCompletion = async (userId: string): Promise<boolean> => {
    try {
      const profile = await getUserProfile(userId);
      if (profile?.profileComplete) return true;
      // Fallback to localStorage if Firestore fails (e.g., offline)
      const localProfile = await localStorageService.getUserProfile();
      return localProfile?.id === userId;
    } catch (err) {
      Sentry.captureException(err, { tags: { component: "useAuth", action: "checkProfileCompletion" } });
      return false;
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        if (isNative) {
          await setPersistence(auth, indexedDBLocalPersistence);
          await FirebaseAuthentication.removeAllListeners();
          await FirebaseAuthentication.addListener("authStateChange", async (change) => {
            if (change.user) {
              const nativeUser = mapNativeUser(change.user);
              setUser(nativeUser);
              setProfileComplete(await checkProfileCompletion(nativeUser.uid));
            } else {
              setUser(null);
              setProfileComplete(false);
            }
            setLoading(false);
            setAuthInitialized(true);
          });
          await FirebaseAuthentication.getCurrentUser();
        } else {
          await setPersistence(auth, browserLocalPersistence);
          unsubscribe = auth.onAuthStateChanged(async (authUser) => {
            if (authUser) {
              setUser(authUser);
              setProfileComplete(await checkProfileCompletion(authUser.uid));
            } else {
              setUser(null);
              setProfileComplete(false);
            }
            setLoading(false);
            setAuthInitialized(true);
          });
        }
      } catch (error: any) {
        Sentry.captureException(error, { tags: { component: "useAuth", action: "initializeAuth" } });
        toast({
          title: t("error"),
          description: t(error.code || "auth_init_failed"),
          variant: "destructive",
        });
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isNative, toast, t]);

  const mapNativeUser = (userData: any): FirebaseUserLike => ({
    uid: userData.uid,
    email: userData.email,
    emailVerified: userData.emailVerified || false,
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    phoneNumber: userData.phoneNumber,
    providerData: userData.providerData || [],
    metadata: {
      creationTime: userData.metadata?.creationTime,
      lastSignInTime: userData.metadata?.lastSignInTime,
    },
    refreshToken: userData.stsTokenManager?.refreshToken || "",
    tenantId: null,
    delete: async () => {
      await FirebaseAuthentication.deleteUser();
    },
    getIdToken: async (forceRefresh?: boolean) => {
      const result = await FirebaseAuthentication.getIdToken({ forceRefresh: forceRefresh ?? false });
      return result.token;
    },
    getIdTokenResult: async (forceRefresh?: boolean) => {
      const result = await FirebaseAuthentication.getIdToken({ forceRefresh: forceRefresh ?? false });
      return {
        token: result.token,
        expirationTime: "",
        issuedAtTime: "",
        authTime: "",
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
      };
    },
    reload: async () => {
      await FirebaseAuthentication.getCurrentUser();
    },
    toJSON: () => ({
      uid: userData.uid,
      email: userData.email,
      emailVerified: userData.emailVerified,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      phoneNumber: userData.phoneNumber,
    }),
  });

  const googleSignIn = async (): Promise<User | FirebaseUserLike | null> => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      Sentry.captureMessage("Initiating Google Sign-In", { level: "info", tags: { component: "useAuth", action: "googleSignIn" } });
      if (isNative) {
        const result = await FirebaseAuthentication.signInWithGoogle({
          useCustomTabs: true,
          scopes: ["profile", "email"],
        });
        if (result.user) {
          const nativeUser = mapNativeUser(result.user);
          setUser(nativeUser);
          setProfileComplete(await checkProfileCompletion(nativeUser.uid));
          return nativeUser;
        }
        throw new Error("google_login_failed");
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope("email profile");
        const auth = getAuth();
        const userCredential = await signInWithPopup(auth, provider);
        setUser(userCredential.user);
        setProfileComplete(await checkProfileCompletion(userCredential.user.uid));
        return userCredential.user;
      }
    } catch (error: any) {
      return handleAuthError(error, "google_login_failed");
    }
  };

  const signUp = async (email: string, password: string): Promise<User | FirebaseUserLike | null> => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      if (isNative) {
        const result = await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password });
        if (result.user) {
          const nativeUser = mapNativeUser(result.user);
          setUser(nativeUser);
          setProfileComplete(false);
          await FirebaseAuthentication.sendEmailVerification();
          return nativeUser;
        }
        throw new Error("signup_failed");
      } else {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setProfileComplete(false);
        await sendEmailVerification(userCredential.user);
        return userCredential.user;
      }
    } catch (error: any) {
      return handleAuthError(error, "signup_failed");
    }
  };

  const login = async (email: string, password: string): Promise<User | FirebaseUserLike | null> => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      if (isNative) {
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
        if (result.user) {
          const nativeUser = mapNativeUser(result.user);
          setUser(nativeUser);
          setProfileComplete(await checkProfileCompletion(nativeUser.uid));
          return nativeUser;
        }
        throw new Error("login_failed");
      } else {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        setProfileComplete(await checkProfileCompletion(userCredential.user.uid));
        return userCredential.user;
      }
    } catch (error: any) {
      return handleAuthError(error, "login_failed");
    }
  };

  const logout = async () => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      if (isNative) {
        await FirebaseAuthentication.signOut();
      } else {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setProfileComplete(false);
    } catch (error: any) {
      Sentry.captureException(error, { tags: { component: "useAuth", action: "logout" } });
      throw new Error(t("signout_failed"));
    }
  };

  const resetPassword = async (email: string) => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      if (isNative) {
        await FirebaseAuthentication.sendPasswordResetEmail({ email });
      } else {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
      }
      toast({
        title: t("success"),
        description: t("password_reset_email_sent"),
      });
    } catch (error: any) {
      return handleAuthError(error, "reset_password_failed");
    }
  };

  const changePassword = async (newPassword: string) => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      throw new Error("network_error");
    }

    try {
      if (isNative) {
        await FirebaseAuthentication.updatePassword({ newPassword });
      } else {
        const auth = getAuth();
        if (!auth.currentUser) throw new Error("No user is currently signed in");
        await updatePassword(auth.currentUser, newPassword);
      }
      toast({
        title: t("success"),
        description: t("password_changed"),
      });
    } catch (error: any) {
      return handleAuthError(error, "password_change_failed");
    }
  };

  const updateProfileCompletion = async (isComplete: boolean) => {
    if (!user) return;
    try {
      await Preferences.set({
        key: `user_profile_${user.uid}`,
        value: JSON.stringify({
          profileComplete: isComplete,
          updatedAt: new Date().toISOString(),
        }),
      });
      setProfileComplete(isComplete);
      // Update localStorage for offline consistency
      const localProfile = await localStorageService.getUserProfile();
      await localStorageService.saveUserProfile({
        id: user.uid,
        name: localProfile?.name || user.displayName || "User",
        email: localProfile?.email || user.email || undefined,
        stallName: localProfile?.stallName,
        createdAt: localProfile?.createdAt || new Date().toISOString(),
      });
    } catch (error: any) {
      Sentry.captureException(error, { tags: { component: "useAuth", action: "updateProfileCompletion" } });
    }
  };

  const handleAuthError = (error: any, fallback: string) => {
    Sentry.captureException(error, { tags: { component: "useAuth", action: fallback } });
    let message = t(fallback);
    switch (error.code) {
      case "auth/user-not-found":
        message = t("user_not_found");
        break;
      case "auth/wrong-password":
        message = t("wrong_password");
        break;
      case "auth/invalid-email":
        message = t("invalid_email");
        break;
      case "auth/too-many-requests":
        message = t("too_many_attempts");
        break;
      case "auth/email-already-in-use":
        message = t("email_already_in_use");
        break;
      case "auth/weak-password":
        message = t("weak_password");
        break;
      case "auth/popup-closed-by-user":
        message = t("popup_closed");
        break;
      case "auth/popup-blocked":
        message = t("popup_blocked");
        break;
      case "auth/network-request-failed":
        message = t("network_error");
        break;
      case "auth/invalid-credential":
        message = t("google_invalid_credential");
        break;
      default:
        if (error.message?.includes("plugin_not_installed")) {
          message = t("google_signin_not_installed");
          Sentry.captureMessage("Google Sign-In plugin not installed", {
            level: "error",
            tags: { component: "useAuth", action: "googleSignIn" },
          });
        } else if (error.message?.includes("12501")) {
          message = t("google_play_services_missing");
        } else if (error.message?.includes("12500")) {
          message = t("google_play_services_update_required");
        }
    }
    toast({
      title: t("error"),
      description: message,
      variant: "destructive",
    });
    throw new Error(message);
  };

  return {
    user,
    userId: user?.uid,
    profileComplete,
    loading,
    authInitialized,
    signUp,
    login,
    logout,
    resetPassword,
    changePassword,
    googleSignIn,
    updateProfileCompletion,
  };
};