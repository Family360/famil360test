// src/components/SubscriptionReminderModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, Star, Check, AlertTriangle } from "lucide-react";
import { SubscriptionService, subscriptionPlans, type SubscriptionPlan } from "@/services/subscriptionService";
import { useToast } from "@/components/ui/use-toast";

interface SubscriptionReminderModalProps {
  isOpen: boolean;
  onClose: () => void | Promise<void>;
  onUpgrade?: () => void | Promise<void>;
  daysRemaining: number;
  isTrialExpired: boolean;
  trialDuration?: number;
  pricingText?: string;
}

const SubscriptionReminderModal = ({
  isOpen,
  onClose,
  onUpgrade,
  daysRemaining: rawDaysRemaining,
  isTrialExpired,
  trialDuration = 7,
  pricingText,
}: SubscriptionReminderModalProps) => {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Clamp daysRemaining once
  const daysRemaining = Math.max(0, Math.min(trialDuration, Math.floor(rawDaysRemaining || 0)));
  const progressValue = Math.max(0, Math.min(100, (daysRemaining / trialDuration) * 100));

  // Dynamically select the "most popular" plan for upsell
  const premiumPlan = subscriptionPlans.find((plan: SubscriptionPlan) => plan.popular) || SubscriptionService.getPlanDetails("monthly");
  const features = premiumPlan?.features || [];

  const getTitle = () => {
    if (isTrialExpired) return "🔒 Trial Expired - Unlock Full Access";
    if (daysRemaining <= 1) return "⏰ Final Hours - Don't Lose Access!";
    if (daysRemaining <= 2) return `⚡ Only ${daysRemaining} Days Left!`;
    return `✨ ${daysRemaining} Days Left in Your Free Trial`;
  };

  const getMessage = () => {
    if (isTrialExpired)
      return "Your free trial has ended! Upgrade now to keep your data and access all features.";
    if (daysRemaining <= 1)
      return "Your trial expires soon! Subscribe now to continue using FoodCart360.";
    return `You have ${daysRemaining} days left to explore all premium features.`;
  };

  const getProgressText = () => {
    if (isTrialExpired || daysRemaining <= 0) return "Expired";
    return `${daysRemaining} / ${trialDuration} days left`;
  };

  const handleUpgrade = async () => {
    try {
      if (!premiumPlan) throw new Error("No premium plan available.");

      // Check current subscription status for trial awareness
      const currentStatus = await SubscriptionService.getCurrentStatus();
      if (currentStatus === "trial" && !showConfirmDialog) {
        setShowConfirmDialog(true);
        return;
      }

      if (onUpgrade) {
        await onUpgrade();
      } else {
        const result = await SubscriptionService.upgradePlan(premiumPlan.id);
        if (result.success) {
          toast({
            title: "Subscription Upgraded!",
            description: `Welcome to ${premiumPlan.name}! Enjoy all features.`,
          });
          setShowConfirmDialog(false);
          onClose();
        } else {
          toast({
            title: "Upgrade Failed",
            description: result.errorMessage || "Failed to upgrade. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error upgrading:", error);
      let errorMessage = error.message === "No premium plan available."
        ? "Plan details unavailable. Please contact support."
        : "There was an error processing your upgrade. Please try again.";
      if (error.code === "PURCHASES_ERROR_CODE_PURCHASE_CANCELLED") {
        errorMessage = "Payment was canceled by user.";
      } else if (error.code === "PURCHASES_ERROR_CODE_NETWORK_ERROR") {
        errorMessage = "No internet connection. Please check your network.";
      }
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    toast({
      title: "Upgrade Canceled",
      description: "You chose to continue your trial.",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm md:max-w-md mx-auto p-4 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl" description="Subscription reminder dialog with trial status and upgrade options">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              {isTrialExpired ? (
                <Clock className="w-6 h-6 text-white" aria-hidden="true" />
              ) : (
                <Zap className="w-6 h-6 text-white" aria-hidden="true" />
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {getTitle()}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{getMessage()}</p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-orange-700 dark:text-orange-300">Trial Progress</span>
                <span className="text-orange-600 dark:text-orange-400">
                  {getProgressText()}
                </span>
              </div>
              <Progress
                value={progressValue}
                className="h-2 bg-orange-200 dark:bg-orange-700"
                aria-label={`Trial progress: ${getProgressText()}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                <Star className="w-4 h-4 text-orange-500" aria-hidden="true" />
                Premium Features You'll Unlock:
              </div>
              <div className="space-y-1">
                {features.map((feature: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {premiumPlan && (
              <div className="text-center">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs">
                  <span aria-hidden="true">🎉</span>
                  <span>{pricingText || `Special Offer - $${premiumPlan.price}`}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2 text-sm"
                aria-label={`Upgrade to ${premiumPlan?.name || "Premium"} plan`}
                disabled={!premiumPlan}
              >
                {isTrialExpired ? "Subscribe Now" : "Upgrade to Premium"}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                size="sm"
                aria-label={isTrialExpired ? "Maybe Later" : "Remind Me Later"}
              >
                {isTrialExpired ? "Maybe Later" : "Remind Me Later"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm p-4 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl" description="Confirmation dialog to upgrade subscription plan">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" aria-hidden="true" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Confirm Upgrade
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upgrading to {premiumPlan?.name || "Premium"} now will end your free trial early. Continue?
            </p>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium py-2 text-sm"
              aria-label="Confirm upgrade"
            >
              Yes, Upgrade Now
            </Button>
            <Button
              variant="ghost"
              onClick={handleConfirmCancel}
              className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              size="sm"
              aria-label="Cancel upgrade"
            >
              No, Continue Trial
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionReminderModal;