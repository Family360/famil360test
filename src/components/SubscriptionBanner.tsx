// src/components/SubscriptionBanner.tsx
import React from "react";
import {
  subscriptionPlans,
  SubscriptionService,
  SubscriptionPlan,
} from "../services/subscriptionService";

interface Props {
  onSubscribe?: (plan: SubscriptionPlan) => void;
}

const SubscriptionBanner: React.FC<Props> = ({ onSubscribe }) => {
  const activatePlan = (planId: SubscriptionPlan["id"]) => {
    SubscriptionService.activateSubscription(planId);
    const plan = subscriptionPlans.find((p) => p.id === planId);
    if (plan && onSubscribe) onSubscribe(plan);
    alert(`✅ You have subscribed to the ${plan?.name} plan!`);
  };

  return (
    <div className="subscription-banner">
      <h2 className="text-xl font-bold mb-4">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-gray-600">${plan.price.toFixed(2)}</p>
            {plan.savings && (
              <p className="text-green-600 text-sm">{plan.savings}</p>
            )}
            <button
              onClick={() => activatePlan(plan.id)}
              className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionBanner;
