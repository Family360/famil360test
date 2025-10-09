// Trial Reminder Banner - Shows days remaining
import React, { useState, useEffect } from 'react';
import { Clock, X, Crown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SecureTrialService } from '@/services/secureTrialService';

interface TrialReminderBannerProps {
  onUpgrade: () => void;
  className?: string;
}

const TrialReminderBanner: React.FC<TrialReminderBannerProps> = ({
  onUpgrade,
  className,
}) => {
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadTrialStatus();
    
    // Check trial status every hour
    const interval = setInterval(loadTrialStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTrialStatus = async () => {
    const status = await SecureTrialService.getTrialStatus();
    setTrialStatus(status);
  };

  if (!trialStatus?.isActive || isDismissed) return null;

  const daysRemaining = trialStatus.daysRemaining;
  const isLastDay = daysRemaining <= 1;
  const isLastThreeDays = daysRemaining <= 3;

  // Determine urgency level
  const urgencyLevel = isLastDay ? 'critical' : isLastThreeDays ? 'warning' : 'info';

  const getBannerStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
    }
  };

  const getIcon = () => {
    switch (urgencyLevel) {
      case 'critical':
        return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />;
      case 'warning':
        return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
      default:
        return <Clock className="text-blue-600 dark:text-blue-400" size={20} />;
    }
  };

  const getMessage = () => {
    if (isLastDay) {
      return 'Last day of your free trial!';
    } else if (daysRemaining === 2) {
      return '2 days left in your trial';
    } else if (daysRemaining === 3) {
      return '3 days left in your trial';
    } else {
      return `${daysRemaining} days left in your trial`;
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 mb-4 animate-in slide-in-from-top duration-300',
        getBannerStyles(),
        className
      )}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {getMessage()}
          </p>
          <p className="text-xs opacity-90 mt-0.5">
            {isLastDay
              ? 'Upgrade now to continue using premium features'
              : 'Upgrade anytime to keep full access'}
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap',
            urgencyLevel === 'critical'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : urgencyLevel === 'warning'
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <Crown size={14} className="inline mr-1" />
          Upgrade Now
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TrialReminderBanner;
