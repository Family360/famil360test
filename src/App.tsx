// src/App.tsx
import React, { useState, useEffect } from "react";
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
import { useAuth } from "./hooks/useAuth";
import WelcomeScreen from "./screens/WelcomeScreen";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { SubscriptionService } from "./services/subscriptionService";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import PasswordResetScreen from "./screens/PasswordResetScreen";
import ProfileSetup from "./screens/ProfileSetup";
import Dashboard from "./screens/Dashboard";
import MenuManagement from "./screens/MenuManagement";
import InventoryManagement from "./screens/InventoryManagement";
import Reports from "./screens/Reports";
import OrdersList from "./screens/OrdersList";
import NewSale from "./screens/NewSale";
import Settings from "./screens/Settings";
import Expenses from "./screens/Expenses";
import BottomNavigation from "./components/BottomNavigation";
import { ENTITLEMENT_ID } from "../config/revenuecat";
import { getFirebaseAuth, getUserProfile } from "./firebase"; // use local-profile helper
import { LanguageProvider } from "./contexts/LanguageContext"; // Import LanguageProvider

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const REVENUECAT_ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "";

type ActiveTab =
  | "dashboard"
  | "orders"
  | "inventory"
  | "expenses"
  | "settings"
  | "reports";

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

  const getActiveTab = (): ActiveTab => {
    const path = window.location.pathname;
    if (path === "/") return "dashboard";
    if (path === "/newSale" || path === "/orders" || path === "/menu")
      return "orders";
    if (path === "/inventory") return "inventory";
    if (path === "/expenses") return "expenses";
    if (path === "/reports") return "reports";
    if (path === "/settings") return "settings";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getActiveTab());

  useEffect(() => {
    // Listen for route changes - simple approach
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
          toast.error("Please subscribe or start a trial to access Expenses");
          navigate("/subscribe");
          return;
        }
        navigate("/expenses");
        break;
      case "reports":
        if (!isSubscribed) {
          toast.error("Please subscribe or start a trial to access Reports");
          navigate("/subscribe");
          return;
        }
        navigate("/reports");
        break;
      case "settings":
        if (!isSubscribed) {
          toast.error("Please subscribe or start a trial to access Settings");
          navigate("/subscribe");
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
      reports: isSubscribed ? "/reports" : "/subscribe",
      expenses: isSubscribed ? "/expenses" : "/subscribe",
      settings: isSubscribed ? "/settings" : "/subscribe",
    };
    const targetPath = routeMap[path] || "/";
    if (targetPath === "/subscribe" && path in routeMap) {
      toast.error(`Please subscribe or start a trial to access ${path}`);
    }
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-24 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
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
          path="/reports"
          element={
            isSubscribed ? (
              <Reports onNavigate={handleNavigate} />
            ) : (
              <Navigate to="/subscribe" replace />
            )
          }
        />
        <Route
          path="/expenses"
          element={
            isSubscribed ? <Expenses /> : <Navigate to="/subscribe" replace />
          }
        />
        <Route
          path="/settings"
          element={isSubscribed ? <Settings /> : <Navigate to="/subscribe" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />}
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
    // Initialize Firebase (auth only)
    const initFirebase = async () => {
      try {
        await getFirebaseAuth(); // ensures Firebase is initialized
        setFirebaseReady(true);
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setFirebaseReady(true); // Continue even if initialization fails
      }
    };

    initFirebase();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && Capacitor.getPlatform() === "web") {
      toast.success("App loaded successfully!", { duration: 2000 });
    }
  }, []);

  const toastOptions: DefaultToastOptions = {
    duration: 4000,
    style: {
      background: "#333",
      color: "#fff",
      borderRadius: "8px",
      padding: "12px",
    },
  };

  // Check user profile completion using local profile storage (Capacitor Preferences)
  useEffect(() => {
    if (!user || !firebaseReady) return;

    const checkProfileCompletion = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        const isComplete = profile?.profileComplete === true;
        setProfileComplete(!!isComplete);
      } catch (error) {
        console.error("Error checking profile:", error);
        setProfileComplete(false);
      }
    };

    checkProfileCompletion();
  }, [user, firebaseReady]);

  // Initialize RevenueCat subscription with network check
  useEffect(() => {
    async function initSubscription() {
      if (!firebaseReady) return;

      const { connected } = await Network.getStatus();
      if (!connected) {
        setIsSubscribed(false);
        setLoadingSubscription(false);
        return;
      }

      try {
        // Only start trial if it hasn't been started before
        if (!localStorage.getItem("app_trial_start")) {
          await SubscriptionService.startFreeTrial();
          localStorage.setItem("app_trial_start", "true");
        }

        const isActive = await SubscriptionService.isActive();
        setIsSubscribed(isActive);

        // Initialize RevenueCat for Android
        if (Capacitor.getPlatform() === "android" && REVENUECAT_ANDROID_KEY) {
          await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });

          const auth = getAuth();
          onAuthStateChanged(auth, async (firebaseUser) => {
            try {
              if (firebaseUser) {
                await Purchases.logIn({ appUserID: firebaseUser.uid });
                const { customerInfo } = await Purchases.getCustomerInfo();
                const hasEntitlement =
                  customerInfo?.entitlements?.active[ENTITLEMENT_ID] !== undefined;
                setIsSubscribed(isActive || !!hasEntitlement);
              } else {
                await Purchases.logOut();
                setIsSubscribed(isActive);
              }
            } catch (err) {
              setIsSubscribed(isActive);
            } finally {
              setLoadingSubscription(false);
            }
          });
        } else {
          setLoadingSubscription(false);
        }
      } catch (err) {
        setIsSubscribed(false);
        setLoadingSubscription(false);
      }
    }

    initSubscription();
  }, [firebaseReady]);

  // Show loading until Firebase and auth are ready
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
        <LanguageProvider> {/* Wrap everything with LanguageProvider */}
          <Toaster position="bottom-right" toastOptions={toastOptions} />
          <BrowserRouter>
            {user ? (
              profileComplete ? (
                <NavigationWrapper
                  user={user}
                  isSubscribed={isSubscribed}
                  setIsSubscribed={setIsSubscribed}
                  loadingSubscription={loadingSubscription}
                />
              ) : (
                <ProfileSetup
                  onNext={() => {
                    setProfileComplete(true);
                    window.location.href = "/"; // Force refresh to update navigation
                  }}
                  onBack={() => {
                    // Sign out user if they go back during profile setup
                    getAuth().signOut();
                  }}
                />
              )
            ) : (
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
            )}
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;