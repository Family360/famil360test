// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import WelcomeScreen from "../screens/WelcomeScreen";
import ProfileSetup from "../screens/ProfileSetup";
import SecuritySetup from "../screens/SecuritySetup";
import Dashboard from "../screens/Dashboard";
import NewSale from "../screens/NewSale";
import OrdersList from "../screens/OrdersList";
import MenuManagement from "../screens/MenuManagement";
import InventoryManagement from "../screens/InventoryManagement";
import Reports from "../screens/Reports";
import Settings from "../screens/Settings";
import Expenses from "../screens/Expenses";
import BottomNavigation from "../components/BottomNavigation";
import Layout from "../components/Layout";
import SubscriptionReminderModal from "../components/SubscriptionReminderModal";
import PricingModal from "../components/PricingModal";
import { localStorageService, type UserProfile, type Settings as AppSettings } from "../services/localStorage";
import { SubscriptionService, type SubscriptionPlan, subscriptionPlans } from "../services/subscriptionService";
import * as Sentry from "@sentry/react"; // For error capture

type AppState =
  | "welcome"
  | "profile"
  | "security"
  | "dashboard"
  | "newSale"
  | "orders"
  | "inventory"
  | "reports"
  | "settings"
  | "menu"
  | "expenses";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>("welcome");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    currentPlan: SubscriptionPlan | "trial" | null;
    isActive: boolean;
    daysRemaining: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize RevenueCat non-blocking with error handling
        try {
          await SubscriptionService.setupRevenueCat();
        } catch (subError: any) {
          Sentry.captureException(subError, { tags: { component: "Index", action: "setupRevenueCat" } });
          console.error("RevenueCat init failed, proceeding without:", subError);
          toast({
            title: "Warning",
            description: "Subscription service failed to initialize. Features may be limited.",
            variant: "destructive",
          });
        }

        // Check subscription/trial
        const status = SubscriptionService.getSubscriptionStatus();
        const currentPlan = status.currentPlan
          ? subscriptionPlans.find((p: SubscriptionPlan) => p.id === status.currentPlan) || null
          : null;
        const isActive = status.isTrialActive || !!status.currentPlan;
        const daysRemaining = status.daysRemaining;

        if (!currentPlan && !status.isTrialActive) {
          SubscriptionService.initializeTrial();
          setSubscriptionStatus({
            currentPlan: "trial",
            isActive: true,
            daysRemaining: 7,
          });
          toast({
            title: "Free trial started!",
            description: "Enjoy your 7-day trial!",
          });
        } else {
          setSubscriptionStatus({ currentPlan, isActive, daysRemaining });
        }

        // Load saved profile/security
        const savedProfile = await localStorageService.getUserProfile();
        const savedSecurity = await localStorageService.getSecurityData();

        if (savedProfile && savedSecurity) {
          setUserProfile(savedProfile);
          setCurrentScreen("dashboard");

          const reminderShown = SubscriptionService.shouldShowReminder();
          if (!isActive && !currentPlan && !reminderShown) {
            setTimeout(() => setShowReminderModal(true), 2000);
          }
        }

        setIsLoading(false);
      } catch (initError: any) {
        Sentry.captureException(initError, { tags: { component: "Index", action: "initializeApp" } });
        console.error("Error initializing app:", initError);
        setError("Failed to initialize app. Please refresh the page.");
        toast({
          title: "Error",
          description: "App initialization failed!",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleGetStarted = () => setCurrentScreen("profile");

  const handleProfileNext = (profileData: any) => {
    const newProfile: UserProfile = {
      id: localStorageService.generateId(),
      name: profileData.name,
      email: profileData.email,
      stallName: profileData.businessName,
      createdAt: new Date().toISOString(),
      profileComplete: false,
    };

    setUserProfile(newProfile);
    localStorageService.saveUserProfile(newProfile);
    setCurrentScreen("security");
    toast({
      title: "Success",
      description: "Profile saved successfully!",
    });
  };

  const handleSecurityNext = (securityInfo: any) => {
    localStorageService.saveSecurityData(securityInfo);

    // Save default settings
    const defaultSettings: AppSettings = {
      currency: "USD",
      language: "en",
      country: "United States",
      theme: "light",
      notifications: true,
    };
    localStorageService.saveSettings(defaultSettings);

    setCurrentScreen("dashboard");
    toast({
      title: "Success",
      description: "Setup complete! Welcome to your dashboard.",
    });
  };

  const handleBack = () => {
    if (currentScreen === "profile") setCurrentScreen("welcome");
    else if (currentScreen === "security") setCurrentScreen("profile");
  };

  // Accept string so external components that call with a string (BottomNavigation / Dashboard) fit.
  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as AppState);
  };

  const showBottomNavigation = [
    "dashboard",
    "newSale",
    "orders",
    "menu",
    "inventory",
    "reports",
    "settings",
    "expenses",
  ].includes(currentScreen);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Something Went Wrong</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-3xl">🍜</span>
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderMainContent = () => {
    // Create a safe user profile object for Dashboard
    const safeUserProfile = userProfile ? {
      fullName: userProfile.name || "User",
      email: userProfile.email || ""
    } : { fullName: "User", email: "" };

    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
      case "profile":
        return <ProfileSetup onNext={handleProfileNext} onBack={handleBack} />;
      case "security":
        return <SecuritySetup onNext={handleSecurityNext} onBack={handleBack} />;
      case "dashboard":
        return <Dashboard userProfile={safeUserProfile} onNavigate={handleNavigate} />;
      case "newSale":
        return <NewSale onNavigate={handleNavigate} />;
      case "orders":
        return <OrdersList onNavigate={handleNavigate} />;
      case "menu":
        return <MenuManagement onNavigate={handleNavigate} />;
      case "inventory":
        return <InventoryManagement onNavigate={handleNavigate} />;
      case "reports":
        return <Reports onNavigate={handleNavigate} />;
      case "settings":
        return <Settings onNavigate={handleNavigate} />;
      case "expenses":
        return <Expenses onNavigate={handleNavigate} />;
      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }
  };

  // Fix BottomNavigation activeTab type
  const getActiveTab = (): 'dashboard' | 'orders' | 'inventory' | 'expenses' | 'settings' | 'reports' => {
    if (currentScreen === "newSale") return "orders";
    if (currentScreen === "menu") return "inventory"; // Map menu to inventory tab
    return currentScreen as any;
  };

  return (
    <Layout>
      <div className="relative">
        {renderMainContent()}

        {showBottomNavigation && userProfile && (
          <BottomNavigation
            activeTab={getActiveTab()}
            onTabChange={(tab) => handleNavigate(tab)}
          />
        )}

        {subscriptionStatus && (
          <SubscriptionReminderModal
            isOpen={showReminderModal}
            onClose={() => {
              setShowReminderModal(false);
              SubscriptionService.markReminderShown();
            }}
            onUpgrade={() => {
              setShowReminderModal(false);
              setShowPricingModal(true);
            }}
            daysRemaining={subscriptionStatus.daysRemaining || 0}
            isTrialExpired={!subscriptionStatus.isActive && !subscriptionStatus.currentPlan}
          />
        )}
        {showPricingModal && (
          <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
        )}
      </div>
    </Layout>
  );
};

export default Index;