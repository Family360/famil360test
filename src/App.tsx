// src/App.tsx (Production-Ready: UID guard, offline fallback, error handling, no duplicate queries)
import React, { useState, useEffect, Suspense } from "react";
import toast, { type DefaultToastOptions, Toaster } from "react-hot-toast";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // FIXED: Named import
const WelcomeScreen = React.lazy(() => import("./screens/WelcomeScreen"));
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { onAuthStateChanged } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { SubscriptionService } from "./services/subscriptionService";
const LoginScreen = React.lazy(() => import("./screens/LoginScreen"));
const SignupScreen = React.lazy(() => import("./screens/SignupScreen"));
const PasswordResetScreen = React.lazy(() => import("./screens/PasswordResetScreen"));
const ProfileSetup = React.lazy(() => import("./screens/ProfileSetup"));
const Dashboard = React.lazy(() => import("./screens/Dashboard"));
const MenuManagement = React.lazy(() => import("./screens/MenuManagement"));
const InventoryManagement = React.lazy(() => import("./screens/InventoryManagement"));
const OrdersList = React.lazy(() => import("./screens/OrdersList"));
const NewSale = React.lazy(() => import("./screens/NewSale"));
const Settings = React.lazy(() => import("./screens/Settings"));
const Expenses = React.lazy(() => import("./screens/Expenses"));
const StaffManagement = React.lazy(() => import("./screens/StaffManagement"));
import BottomNavigation, { type AppState as BottomNavAppState } from "./components/BottomNavigation";
import { ENTITLEMENT_ID } from "../config/revenuecat";
import { getUserProfile, getFirebaseAuth } from "./firebase";
import { localStorageService } from "@/services/localStorage"; // Added for offline fallback
import { LanguageProvider } from "./contexts/LanguageContext";
import adsService from '@/services/adsService';

// 🚀 Import Performance & Security Enhancements
import mobileOptimizer from "@/services/mobileOptimizer";
import { securityService } from "@/services/enhancedSecurity";

// 🎯 Import Trial & Subscription Components
import TrialSubscriptionModal from "@/components/TrialSubscriptionModal";
import TrialReminderBanner from "@/components/TrialReminderBanner";
import { SecureTrialService } from "@/services/secureTrialService";
import { useToast } from "@/components/ui/use-toast";

// 📱 Import WhatsApp & Backup Components
import WhatsAppConfigScreen from "@/components/WhatsAppConfigScreen";
import BackupScreen from "@/components/BackupScreen";

import AnalyticsDashboard from "./components/AnalyticsDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const REVENUECAT_ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "";

type ActiveTab = BottomNavAppState;

const NavigationWrapper = ({
  user,
  isSubscribed,
  setIsSubscribed,
  loadingSubscription,
}: {
  user: any;
  isSubscribed: boolean;
  setIsSubscribed: React.Dispatch<React.SetStateAction<boolean>>;
  loadingSubscription: boolean;
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialFeature, setTrialFeature] = useState<string>('this feature');

  const getActiveTab = (): ActiveTab => {
    const path = window.location.pathname;
    if (path === "/") return "dashboard";
    if (path === "/newSale" || path === "/orders" || path === "/menu")
      return "orders";
    if (path === "/inventory") return "inventory";
    if (path === "/expenses") return "expenses";
    if (path === "/reports" || path === "/analytics") return "reports"; // Use reports tab for analytics route
    if (path === "/settings") return "settings";
    return "dashboard";
  };

  // Initialize ads and manage banner based on subscription
  useEffect(() => {
    (async () => {
      await adsService.init();
      await adsService.requestConsentIfRequired();
      // Persist premium flag for other modules (e.g., interstitial logic)
      try { localStorage.setItem('is_premium', isSubscribed ? 'true' : 'false'); } catch {}
      if (isSubscribed) {
        await adsService.hideBanner();
      } else {
        await adsService.showBanner();
      }
    })();
    return () => {
      adsService.hideBanner().catch(() => {});
    };
  }, [isSubscribed]);

  // Global event to open upgrade modal from anywhere
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ feature?: string }>;
      if (ce.detail?.feature) setTrialFeature(ce.detail.feature);
      setShowTrialModal(true);
    };
    window.addEventListener('open-upgrade', handler as EventListener);
    return () => window.removeEventListener('open-upgrade', handler as EventListener);
  }, []);

  // Trial reminders: mid-trial and 24h left
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await SecureTrialService.getTrialStatus();
        if (!mounted || !status.isActive) return;
        const days = status.daysRemaining;
        const midKey = 'trial_mid_nudge_shown';
        const lastKey = 'trial_24h_notice_shown';
        if (days <= 4 && days >= 3 && !sessionStorage.getItem(midKey)) {
          toast({
            title: 'Trial reminder',
            description: `Enjoying Pro? Trial has ${days} days left.`,
          });
          sessionStorage.setItem(midKey, '1');
        }
        if (days === 1 && !sessionStorage.getItem(lastKey)) {
          toast({
            title: 'Trial ends tomorrow',
            description: 'Keep access by subscribing to Premium.',
          });
          sessionStorage.setItem(lastKey, '1');
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>(getActiveTab());

  useEffect(() => {
    const onLocationChange = () => setActiveTab(getActiveTab());
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    switch (tab) {
      case "dashboard":
        navigate("/");
        break;
      case "orders":
        navigate("/orders");
        break;
      case "inventory":
        navigate("/inventory");
        break;
      case "expenses":
        if (!isSubscribed) {
          setTrialFeature('Expenses');
          setShowTrialModal(true);
          return;
        }
        navigate("/expenses");
        break;
      case "reports":
        if (!isSubscribed) {
          setTrialFeature('Analytics');
          setShowTrialModal(true);
          return;
        }
        navigate("/analytics");
        break;
      case "settings":
        if (!isSubscribed) {
          setTrialFeature('Settings');
          setShowTrialModal(true);
          return;
        }
        navigate("/settings");
        break;
    }
  };

  const handleNavigate = (path: string) => {
    const routeMap: { [key: string]: string } = {
      newSale: "/newSale",
      orders: "/orders",
      menu: "/menu",
      inventory: "/inventory",
      analytics: isSubscribed ? "/analytics" : "/subscribe",
      reports: isSubscribed ? "/analytics" : "/subscribe", // Merge reports into analytics
      'tip-distribution': "/tip-distribution",
      expenses: isSubscribed ? "/expenses" : "/subscribe",
      settings: isSubscribed ? "/settings" : "/subscribe",
      whatsapp: "/whatsapp",
      backup: "/backup",
    };
    const targetPath = routeMap[path] || "/";
    if (targetPath === "/subscribe" && path in routeMap) {
      setTrialFeature(path);
      setShowTrialModal(true);
    }
    navigate(targetPath);
  };

  const handleStartTrial = async () => {
    try {
      await SecureTrialService.startTrial();
      setIsSubscribed(true);
      toast.success("🎉 7-day free trial started! Enjoy all premium features.");
    } catch (error) {
      console.error('Failed to start trial:', error);
      toast.error("Failed to start trial. Please try again.");
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await SubscriptionService.activateSubscription(planId as any);
      setIsSubscribed(true);
      toast.success("✅ Successfully subscribed! Welcome to FoodCart360 Premium.");
    } catch (error) {
      console.error('Subscription failed:', error);
      toast.error("Subscription failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-24 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
      {/* Trial Reminder Banner - Shows at top if trial is active */}
      <TrialReminderBanner onUpgrade={() => setShowTrialModal(true)} />

      <Suspense fallback={<div className="flex items-center justify-center py-10 text-gray-600 dark:text-gray-300">Loading...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              userProfile={user}
              onNavigate={handleNavigate}
              isSubscribed={isSubscribed}
              loadingSubscription={loadingSubscription}
            />
          }
        />
        <Route
          path="/newSale"
          element={<NewSale onNavigate={handleNavigate} />}
        />
        <Route
          path="/orders"
          element={
            <OrdersList onNavigate={handleNavigate} onBack={() => navigate("/")} />
          }
        />
        <Route path="/menu" element={<MenuManagement onNavigate={() => {}} />} />
        <Route
          path="/inventory"
          element={<InventoryManagement onNavigate={handleNavigate} />}
        />
        <Route
          path="/analytics"
          element={
            isSubscribed ? (
              <AnalyticsDashboard />
            ) : (
              <Navigate to="/subscribe" replace />
            )
          }
        />
        <Route path="/reports" element={<Navigate to="/analytics" replace />} />
        <Route
          path="/expenses"
          element={
            isSubscribed ? <Expenses onNavigate={handleNavigate} /> : <Navigate to="/subscribe" replace />
          }
        />
        <Route
          path="/tip-distribution"
          element={
            isSubscribed ? (
              <StaffManagement onNavigate={handleNavigate} />
            ) : (
              <Navigate to="/subscribe" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={isSubscribed ? <Settings /> : <Navigate to="/subscribe" replace />}
        />
        <Route
          path="/whatsapp"
          element={<WhatsAppConfigScreen onBack={() => navigate("/")} />}
        />
        <Route
          path="/backup"
          element={<BackupScreen onBack={() => navigate("/")} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>

      {user && <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />}

      {/* Trial & Subscription Modal */}
      <TrialSubscriptionModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onStartTrial={handleStartTrial}
        onSubscribe={handleSubscribe}
        featureName={trialFeature}
      />
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Initialize Firebase SDK only on web; native uses Capacitor plugin
        if (Capacitor.getPlatform() === "web") {
          await getFirebaseAuth();
        }
        setFirebaseReady(true);
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setFirebaseReady(true); // Proceed even on error—fallback to local
      }
    };

    // 🚀 Initialize Performance & Security Enhancements
    mobileOptimizer.startPerformanceMonitoring();
    
    // Only run security validation in production
    if (import.meta.env.PROD) {
      securityService.validateAppSecurity().then(security => {
        if (!security.isSecure) {
          console.warn("🔒 Security issues detected:", security.issues);
        }
      });
    }

    initFirebase();
  }, []);

  // Removed duplicate performance toast - only show once on first load
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('app_welcome_shown');
    if (!hasShownWelcome && import.meta.env.DEV && Capacitor.getPlatform() === "web") {
      toast.success("🚀 Welcome to FoodCart360!", { duration: 2000 });
      sessionStorage.setItem('app_welcome_shown', 'true');
    }
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toastOptions: DefaultToastOptions = {
    duration: prefersReducedMotion ? 2500 : 4000,
    style: prefersReducedMotion ? {
      background: "#2f2f2f",
      color: "#fff",
      borderRadius: "8px",
      padding: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    } : {
      background: "#333",
      color: "#fff",
      borderRadius: "8px",
      padding: "12px",
      boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
    },
  };

  // Fixed: Added uid guard, offline fallback, sync to local
  useEffect(() => {
    if (!user?.uid || !firebaseReady) return; // Guard against invalid user/uid

    const checkProfileCompletion = async () => {
      const { connected } = await Network.getStatus();
      if (!connected) {
        if (import.meta.env.DEV) {
          console.log('Offline—using cached profile for completion check');
        }
        try {
          const localProfile = await localStorageService.getUserProfile();
          setProfileComplete(!!(localProfile?.profileComplete));
          return;
        } catch (err) {
          console.error('Cached profile error:', err);
          setProfileComplete(false);
          return;
        }
      }

      try {
        const profile = await getUserProfile(user.uid);
        const isComplete = profile?.profileComplete === true;
        setProfileComplete(!!isComplete);

        // Sync to localStorageService if online and complete
        if (profile && isComplete) {
          await localStorageService.setUserProfile({ 
            ...profile, 
            id: user.uid,
            profileComplete: true 
          });
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        // Fallback to local on fetch error
        try {
          const localProfile = await localStorageService.getUserProfile();
          setProfileComplete(!!(localProfile?.profileComplete));
        } catch (fallbackErr) {
          console.error('Fallback profile error:', fallbackErr);
          setProfileComplete(false);
        }
      }
    };

    checkProfileCompletion();
  }, [user?.uid, firebaseReady]); // Depend on uid for re-check on auth changes

  useEffect(() => {
    async function initSubscription() {
      if (!firebaseReady) return;

      const { connected } = await Network.getStatus();
      if (!connected) {
        // Check if trial is active locally
        const trialStatus = await SecureTrialService.getTrialStatus();
        setIsSubscribed(trialStatus.isActive);
        setLoadingSubscription(false);
        return;
      }

      try {
        // Check if user has active trial or subscription
        const trialStatus = await SecureTrialService.getTrialStatus();
        
        // Handle trial ended - show modal ONLY ONCE when trial actually ends
        if (trialStatus.daysRemaining === 0 && !trialStatus.isActive) {
          const trialEndShown = sessionStorage.getItem('trial_end_notification_shown');
          if (!trialEndShown) {
            toast.error("Your 7-day trial has ended. Upgrade to continue using premium features.", {
              duration: 5000,
              style: {
                background: '#EF4444',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
            });
            sessionStorage.setItem('trial_end_notification_shown', 'true');
          }
        }
        
        if (trialStatus.isActive) {
          setIsSubscribed(true);
        } else {
          // Check for active subscription
          const isActive = await SubscriptionService.isActive();
          setIsSubscribed(isActive);

          if (Capacitor.getPlatform() === "android" && REVENUECAT_ANDROID_KEY) {
            await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });

            // Native flow: use Capacitor FirebaseAuthentication to get current user
            try {
              const current = await FirebaseAuthentication.getCurrentUser();
              if (current?.user?.uid) {
                await Purchases.logIn({ appUserID: current.user.uid });
                const { customerInfo } = await Purchases.getCustomerInfo();
                const hasEntitlement = customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;
                setIsSubscribed(isActive || !!hasEntitlement);
              } else {
                await Purchases.logOut();
                setIsSubscribed(isActive);
              }
            } catch (nativeErr) {
              console.error('RevenueCat native linking error:', nativeErr);
              setIsSubscribed(isActive);
            } finally {
              setLoadingSubscription(false);
            }
          } else if (Capacitor.getPlatform() === "web") {
            // Web flow: Skip RevenueCat (not supported on web), use local subscription only
            setIsSubscribed(isActive);
            setLoadingSubscription(false);
          } else {
            // iOS or other platforms
            setLoadingSubscription(false);
          }
        }
      } catch (err) {
        console.error('Subscription init error:', err);
        // Fallback to trial status
        const trialStatus = await SecureTrialService.getTrialStatus();
        setIsSubscribed(trialStatus.isActive);
        setLoadingSubscription(false);
      }
    }

    initSubscription();
  }, [firebaseReady]);

  if (loading || !firebaseReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
        <div className="text-xl font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Loading FoodCart360...
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster position="bottom-right" toastOptions={toastOptions} />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {user ? (
              profileComplete ? (
                <NavigationWrapper
                  user={user}
                  isSubscribed={isSubscribed}
                  setIsSubscribed={setIsSubscribed}
                  loadingSubscription={loadingSubscription}
                />
              ) : (
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">Loading...</div>}>
                <ProfileSetup
                  onNext={() => {
                    setProfileComplete(true);
                    window.location.href = "/";
                  }}
                  onBack={() => {
                    getFirebaseAuth().then(auth => auth.signOut()).catch(console.error);
                  }}
                />
                </Suspense>
              )
            ) : (
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">Loading...</div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    showWelcome ? (
                      <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    <LoginScreen
                      onAuthSuccess={() => (window.location.href = "/")}
                      onShowForgotPassword={() => (window.location.href = "/reset-password")}
                      onShowSignUp={() => (window.location.href = "/signup")}
                      onBack={() => (window.location.href = "/")}
                    />
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <SignupScreen
                      onAuthSuccess={() => (window.location.href = "/")}
                      onShowLogin={() => (window.location.href = "/login")}
                      onBack={() => (window.location.href = "/")}
                    />
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PasswordResetScreen
                      onBack={() => (window.location.href = "/login")}
                      onLogin={() => (window.location.href = "/login")}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              </Suspense>
            )}
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;