import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SubscriptionService,
  subscriptionPlans,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/services/subscriptionService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  const { toast } = useToast();

  const handleUpgrade = (planId: SubscriptionPlan["id"], planName: string) => {
    try {
      const currentStatus: SubscriptionStatus = SubscriptionService.getSubscriptionStatus();

      // Check if trial is active and prompt user to end trial early
      if (currentStatus.isTrialActive) {
        const confirmUpgrade = window.confirm(
          `Upgrading to ${planName} will end your free trial early. Continue?`
        );
        if (!confirmUpgrade) {
          toast({
            title: "Upgrade Canceled",
            description: "You chose to continue your trial.",
          });
          return;
        }
      }

      // Activate the subscription plan
      SubscriptionService.activateSubscription(planId);

      toast({
        title: "Subscription Activated!",
        description: `Welcome to ${planName}! Enjoy all premium features.`,
      });
      onClose();
    } catch (error: any) {
      console.error("Error upgrading:", error);
      toast({
        title: "Subscription Failed",
        description:
          "There was an error processing your subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto p-4 bg-white/95 dark:bg-gray-900/95 border-0 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="pricing-modal-title"
      >
        <DialogHeader className="text-center space-y-2 mb-4">
          <DialogTitle
            id="pricing-modal-title"
            className="text-xl font-bold text-gray-800 dark:text-gray-100"
          >
            Upgrade to Premium
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your food business
          </p>
        </DialogHeader>

        <div className="space-y-3" role="list" aria-label="Subscription plans">
          {subscriptionPlans.map((plan: SubscriptionPlan, index) => (
            <div
              key={plan.id}
              className={cn(
                "border rounded-xl p-4 transition-all duration-200",
                index === 1
                  ? "border-orange-300 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm"
                  : index === 2
                  ? "border-purple-300 bg-purple-50/50 dark:bg-purple-900/20 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              )}
              role="listitem"
            >
              {/* Plan Header */}
              <div className="text-center mb-3">
                {(index === 1 || index === 2) && (
                  <Badge
                    className={cn(
                      "mb-2 text-xs",
                      index === 1
                        ? "bg-orange-500 text-white"
                        : "bg-purple-500 text-white"
                    )}
                  >
                    {index === 1 ? "Most Popular" : "Best Value"}
                  </Badge>
                )}
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    /{plan.duration === 30 ? "month" : plan.duration === 90 ? "3 months" : "year"}
                  </span>
                </div>
                {plan.savings && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {plan.savings}
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-2 mb-4" role="list" aria-label={`Features for ${plan.name}`}>
                {[
                  "Unlimited menu items",
                  "Advanced analytics",
                  "Priority support",
                  "Custom branding",
                ].map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                    role="listitem"
                  >
                    <Check
                      className="w-3 h-3 text-green-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Upgrade Button */}
              <Button
                className={cn(
                  "w-full text-xs py-2",
                  index === 1
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : index === 2
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                )}
                onClick={() => handleUpgrade(plan.id, plan.name)}
                aria-label={`Upgrade to ${plan.name} plan`}
              >
                Upgrade
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure payment • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;