// Onboarding Tutorial for First-Time Users
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, Users, Calendar, ShoppingCart, TrendingUp, 
  Settings, ArrowRight, ArrowLeft, X, HelpCircle
} from 'lucide-react';
import languageService from '@/services/languageService';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  videoUrl?: string;
}

interface OnboardingTutorialProps {
  open?: boolean;
  onClose?: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ open: controlledOpen, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  const t = (key: string) => languageService.translate(key);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      icon: <ChefHat size={48} className="text-[#ff7043]" />,
      title: t('welcome_to_foodcart360') || 'Welcome to FoodCart360',
      description: t('welcome_desc') || 'Your complete restaurant management solution. Let\'s take a quick tour to get you started!',
    },
    {
      id: 'menu',
      icon: <ShoppingCart size={48} className="text-[#ff7043]" />,
      title: t('setup_menu') || 'Setup Your Menu',
      description: t('setup_menu_desc') || 'Add your food items, set prices, and organize categories. Tap on Menu to get started.',
    },
    {
      id: 'staff',
      icon: <Users size={48} className="text-[#ff7043]" />,
      title: t('manage_staff') || 'Manage Staff',
      description: t('manage_staff_desc') || 'Add team members, track attendance, and manage salaries. Go to Staff section to begin.',
    },
    {
      id: 'attendance',
      icon: <Calendar size={48} className="text-[#ff7043]" />,
      title: t('track_attendance') || 'Track Attendance',
      description: t('track_attendance_desc') || 'Monitor staff check-ins and check-outs. View daily attendance reports in the Attendance section.',
    },
    {
      id: 'orders',
      icon: <ShoppingCart size={48} className="text-[#ff7043]" />,
      title: t('manage_orders') || 'Manage Orders',
      description: t('manage_orders_desc') || 'Take orders, track sales, and manage transactions. Access from the New Sale button.',
    },
    {
      id: 'reports',
      icon: <TrendingUp size={48} className="text-[#ff7043]" />,
      title: t('view_reports') || 'View Reports',
      description: t('view_reports_desc') || 'Track sales, expenses, and business insights. Find comprehensive reports in the Reports section.',
    },
    {
      id: 'settings',
      icon: <Settings size={48} className="text-[#ff7043]" />,
      title: t('customize_settings') || 'Customize Settings',
      description: t('customize_settings_desc') || 'Configure language, currency, backup settings, and more in the Settings menu.',
    },
  ];

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
      return;
    }

    // Check if user has seen tutorial
    const seenTutorial = localStorage.getItem('hasSeenOnboarding');
    if (!seenTutorial) {
      setIsOpen(true);
      setHasSeenTutorial(false);
    } else {
      setHasSeenTutorial(true);
    }
  }, [controlledOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenTutorial(true);
    setIsOpen(false);
    setCurrentStep(0);
    if (onClose) onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenTutorial(true);
    setIsOpen(false);
    setCurrentStep(0);
    if (onClose) onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleSkip();
      setIsOpen(open);
    }}>
      <DialogContent
        description={t('onboarding_tutorial_desc') || 'Interactive tutorial to help you get started with FoodCart360'}
        className="sm:max-w-[500px] glass-card border border-white/10 dark:border-gray-700/30"
      >
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <HelpCircle size={20} className="text-[#ff7043]" />
            {t('getting_started') || 'Getting Started'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Step Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-[#ff7043]/20 to-[#ff9f43]/20 rounded-full">
              {currentStepData.icon}
            </div>
          </div>

          {/* Step Title */}
          <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-3">
            {currentStepData.title}
          </h3>

          {/* Step Description */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 px-4">
            {currentStepData.description}
          </p>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  idx === currentStep 
                    ? 'w-8 bg-[#ff7043]' 
                    : idx < currentStep
                    ? 'w-2 bg-[#ff7043]/50'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft size={16} className="mr-1" />
              {t('previous') || 'Previous'}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c]"
              >
                {t('next') || 'Next'}
                <ArrowRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
              >
                {t('get_started') || 'Get Started'}
              </Button>
            )}
          </div>

          {/* Skip Button */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              {t('skip_tutorial') || 'Skip Tutorial'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Help Icon Component to trigger tutorial anytime
export const HelpIcon: React.FC<{ className?: string }> = ({ className }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const t = (key: string) => languageService.translate(key);

  return (
    <>
      <button
        onClick={() => setShowTutorial(true)}
        className={cn(
          'p-2 rounded-full bg-[#ff7043]/10 hover:bg-[#ff7043]/20 transition-colors',
          className
        )}
        aria-label={t('show_help') || 'Show Help'}
      >
        <HelpCircle size={20} className="text-[#ff7043]" />
      </button>
      <OnboardingTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
};

export default OnboardingTutorial;
