// Enhanced Trial & Subscription Modal with Better UX
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, CheckCircle, AlertCircle, Crown, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SecureTrialService } from '@/services/secureTrialService';
import { RevenueCatService } from '@/services/revenueCatService';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import hapticService from '@/services/hapticFeedback';
import { useToast } from '@/components/ui/use-toast';

interface TrialSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
  onSubscribe?: (planId: string) => void; // Optional - purchases handled internally
  featureName?: string;
}

const TrialSubscriptionModal: React.FC<TrialSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onStartTrial,
  onSubscribe,
  featureName = 'this feature',
}) => {
  const { toast } = useToast();
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [status, pkgs] = await Promise.all([
        SecureTrialService.getTrialStatus(),
        RevenueCatService.getAllPackages()
      ]);
      setTrialStatus(status);
      setPackages(pkgs);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    await hapticService.success();
    await SecureTrialService.startTrial();
    onStartTrial();
    onClose();
  };

  const handleSubscribe = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    await hapticService.medium();
    try {
      const result = await RevenueCatService.purchasePackage(pkg);
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Subscription activated. Enjoy premium features!',
        });
        if (onSubscribe) onSubscribe(pkg.identifier);
        onClose();
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Unable to complete purchase',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const daysRemaining = trialStatus?.daysRemaining || 7;
  const isTrialActive = trialStatus?.isActive;
  const isTrialExpired = trialStatus?.isExpired;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              {isTrialActive ? (
                <Clock size={24} />
              ) : (
                <Crown size={24} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isTrialActive
                  ? `${daysRemaining} Days Left in Trial`
                  : isTrialExpired
                  ? 'Trial Expired - Upgrade Now'
                  : 'Unlock Premium Features'}
              </h2>
              <p className="text-white/90 text-sm">
                {isTrialActive
                  ? 'Continue enjoying full access'
                  : `Start your 7-day free trial to access ${featureName}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trial Status Banner */}
          {isTrialActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Trial Active - {daysRemaining} Days Remaining
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Upgrade now to continue after trial ends
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Premium Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="text-orange-500" size={20} />
              Premium Features Included
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Unlimited Orders & Products',
                'Advanced Reports & Analytics',
                'Expense Tracking',
                'Cloud Backup & Sync',
                'WhatsApp Integration',
                'Multi-Currency Support',
                'Priority Support',
                'No Ads',
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Option */}
          {!isTrialActive && !isTrialExpired && (
            <div className="border-2 border-orange-200 dark:border-orange-800 rounded-xl p-5 bg-orange-50 dark:bg-orange-900/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Zap className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                    Start 7-Day Free Trial
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Get full access to all premium features. No credit card required. Cancel anytime.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Full access for 7 days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Daily reminders of remaining days
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      No automatic charges
                    </li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={handleStartTrial}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Sparkles size={20} className="mr-2" />
                Start Free Trial Now
              </Button>
            </div>
          )}

          {/* Subscription Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Choose Your Plan
              {packages.length > 0 && (
                <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                  ✅ 7-day free trial • Cancel anytime
                </span>
              )}
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading plans...</span>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>Unable to load subscription plans. Please try again later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg, index) => {
                  const isYearly = pkg.identifier.toLowerCase().includes('yearly') || pkg.identifier.toLowerCase().includes('annual');
                  const isQuarterly = pkg.identifier.toLowerCase().includes('quarterly');
                  const priceString = pkg.product?.priceString || 'N/A';
                  const title = pkg.product?.title || pkg.identifier;
                  const description = pkg.product?.description || '';
                  
                  return (
                    <div
                      key={pkg.identifier}
                      className={cn(
                        'border-2 rounded-xl p-5 transition-all hover:shadow-lg relative',
                        isYearly
                          ? 'border-orange-500 dark:border-orange-600 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                      )}
                    >
                      {isYearly && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          BEST VALUE
                        </div>
                      )}
                      {isQuarterly && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          POPULAR
                        </div>
                      )}
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize">
                          {isYearly ? 'Yearly' : isQuarterly ? '3 Months' : 'Monthly'}
                        </p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {priceString}
                          </span>
                        </div>
                        {description && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                            {description}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSubscribe(pkg)}
                        disabled={purchasing}
                        className={cn(
                          'w-full font-semibold py-5',
                          isYearly
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg'
                            : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        )}
                        variant={isYearly ? 'default' : 'outline'}
                      >
                        {purchasing ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Processing...
                          </>
                        ) : (
                          <>
                            {isYearly && <Crown size={16} className="mr-2" />}
                            Subscribe {isYearly ? 'Yearly' : isQuarterly ? 'Quarterly' : 'Monthly'}
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrialSubscriptionModal;
