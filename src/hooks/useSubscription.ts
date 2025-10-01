import { useState, useEffect, useCallback } from "react";
import {
  SubscriptionService,
  SubscriptionStatus,
  subscriptionPlans,
  SubscriptionPlan,
} from "../services/subscriptionService";

/**
 * Hook to manage trial/subscription state.
 */
export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>(
    SubscriptionService.getSubscriptionStatus()
  );

  // Refresh status on mount & hourly
  useEffect(() => {
    SubscriptionService.initializeTrial();
    setStatus(SubscriptionService.getSubscriptionStatus());

    const interval = setInterval(() => {
      setStatus(SubscriptionService.getSubscriptionStatus());
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const activatePlan = useCallback((planId: SubscriptionPlan["id"]) => {
    SubscriptionService.activateSubscription(planId);
    setStatus(SubscriptionService.getSubscriptionStatus());
  }, []);

  const reset = useCallback(() => {
    SubscriptionService.reset();
    setStatus(SubscriptionService.getSubscriptionStatus());
  }, []);

  const markReminderShown = useCallback(() => {
    SubscriptionService.markReminderShown();
  }, []);

  return {
    status,
    plans: subscriptionPlans,
    activatePlan,
    reset,
    markReminderShown,
    shouldShowReminder: SubscriptionService.shouldShowReminder(),
    isFeatureAvailable: SubscriptionService.isFeatureAvailable(),
  };
}
