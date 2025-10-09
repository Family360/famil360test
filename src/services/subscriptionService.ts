// src/services/subscriptionService.ts
import { Capacitor } from '@capacitor/core';
export interface SubscriptionPlan {
  id: "monthly" | "quarterly" | "yearly";
  name: string;
  price: number; // USD
  duration: number; // in days
  savings?: string;
  popular?: boolean;
  features?: string[];
}

export interface SubscriptionStatus {
  isTrialActive: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  daysRemaining: number;
  currentPlan: string | null;
  subscriptionEndDate: string | null;
}

const TRIAL_DURATION_DAYS = 7;

const STORAGE_KEYS = {
  TRIAL_START: "app_trial_start",
  SUBSCRIPTION_PLAN: "app_subscription_plan",
  SUBSCRIPTION_END: "app_subscription_end",
  LAST_REMINDER: "app_last_reminder",
} as const;

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 2.15,
    duration: 30,
    features: ["Unlimited menu items", "Basic analytics", "Customer support"],
    popular: false,
  },
  {
    id: "quarterly",
    name: "3 Months",
    price: 6.0,
    duration: 90,
    savings: "Save $0.45",
    features: ["Unlimited menu items", "Advanced analytics", "Priority support"],
    popular: true,
  },
  {
    id: "yearly",
    name: "12 Months",
    price: 24.0,
    duration: 365,
    savings: "Best Value",
    features: ["Unlimited menu items", "Advanced analytics", "Priority support", "Custom branding"],
    popular: false,
  },
];

export class SubscriptionService {
  static initializeTrial(): void {
    if (!localStorage.getItem(STORAGE_KEYS.TRIAL_START)) {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TRIAL_START, now);
    }
  }

  static getSubscriptionStatus(): SubscriptionStatus {
    const trialStartDate = localStorage.getItem(STORAGE_KEYS.TRIAL_START);
    const currentPlan = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PLAN);
    const subscriptionEndDate = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_END);

    if (!trialStartDate) {
      return {
        isTrialActive: false,
        trialStartDate: null,
        trialEndDate: null,
        daysRemaining: 0,
        currentPlan: null,
        subscriptionEndDate: null,
      };
    }

    const trialStart = new Date(trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_DAYS * 86400000);
    const now = new Date();

    const daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
    );

    if (currentPlan && subscriptionEndDate) {
      const subEnd = new Date(subscriptionEndDate);
      if (subEnd > now) {
        return {
          isTrialActive: false,
          trialStartDate,
          trialEndDate: trialEnd.toISOString(),
          daysRemaining: 0,
          currentPlan,
          subscriptionEndDate,
        };
      }
    }

    return {
      isTrialActive: daysRemaining > 0,
      trialStartDate,
      trialEndDate: trialEnd.toISOString(),
      daysRemaining,
      currentPlan: daysRemaining > 0 ? null : currentPlan,
      subscriptionEndDate,
    };
  }

  static shouldShowReminder(): boolean {
    const status = this.getSubscriptionStatus();
    const lastReminder = localStorage.getItem(STORAGE_KEYS.LAST_REMINDER);
    const today = new Date().toDateString();

    if (
      status.isTrialActive &&
      status.daysRemaining <= 3 &&
      lastReminder !== today
    ) {
      return true;
    }

    if (!status.isTrialActive && !status.currentPlan && lastReminder !== today) {
      return true;
    }

    return false;
  }

  static markReminderShown(): void {
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEYS.LAST_REMINDER, today);
  }

  static activateSubscription(planId: SubscriptionPlan["id"]): void {
    const plan = subscriptionPlans.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.duration * 86400000);

    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, plan.id);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_END, endDate.toISOString());
  }

  static isFeatureAvailable(): boolean {
    const status = this.getSubscriptionStatus();
    return status.isTrialActive || !!status.currentPlan;
  }

  static reset(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  static async getCurrentStatus(): Promise<"trial" | "subscribed" | "expired"> {
    const status = this.getSubscriptionStatus();
    if (status.isTrialActive) return "trial";
    if (status.currentPlan) return "subscribed";
    return "expired";
  }

  static async upgradePlan(planId: SubscriptionPlan["id"]): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      this.activateSubscription(planId);
      return { success: true };
    } catch (error: any) {
      return { success: false, errorMessage: error.message };
    }
  }

  static getPlanDetails(planId: SubscriptionPlan["id"]): SubscriptionPlan | undefined {
    return subscriptionPlans.find((plan) => plan.id === planId);
  }

  static async setupRevenueCat(): Promise<void> {
    try {
      // Only setup RevenueCat for native platforms (iOS/Android)
      if (Capacitor.getPlatform() === "android" || Capacitor.getPlatform() === "ios") {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");

        // Configure RevenueCat with the appropriate API key
        const apiKey = Capacitor.getPlatform() === "android"
          ? import.meta.env.VITE_REVENUECAT_ANDROID_KEY
          : import.meta.env.VITE_REVENUECAT_IOS_KEY;

        if (apiKey) {
          await Purchases.configure({ apiKey });
          console.log("✅ RevenueCat configured successfully");
        } else {
          console.warn("⚠️ RevenueCat API key not found");
        }
      } else {
        console.log("ℹ️ RevenueCat not available on web platform");
      }
    } catch (error) {
      console.error("❌ RevenueCat setup failed:", error);
      throw error;
    }
  }

  static async getCurrentPlan(): Promise<SubscriptionPlan | null> {
    const status = this.getSubscriptionStatus();
    return status.currentPlan ? subscriptionPlans.find((p: SubscriptionPlan) => p.id === status.currentPlan) || null : null;
  }

  static async isActive(): Promise<boolean> {
    const status = this.getSubscriptionStatus();
    return status.isTrialActive || !!status.currentPlan;
  }

  static async getRemainingDays(): Promise<number> {
    return this.getSubscriptionStatus().daysRemaining;
  }

  static async startFreeTrial(): Promise<void> {
    this.initializeTrial();
  }
}