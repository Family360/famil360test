// src/screens/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import Button from '../components/Button';
import CashBalanceModal from '../components/CashBalanceModal';
import { localStorageService } from '../services/localStorage';
import { currencyService } from '../services/currencyService';
import { SubscriptionService } from '../services/subscriptionService';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import {
  List,
  DollarSign,
  Package,
  CreditCard,
  Wallet,
  Briefcase,
  ShoppingCart,
  RefreshCw,
  ShoppingBag,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  Utensils,
  ChefHat,
  Salad,
  Truck,
  Receipt,
  Sparkles,
  Moon,
  Sun,
  BarChart3,
  Coffee,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'; // Added missing imports
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Order } from '../services/localStorage';

interface DashboardProps {
  userProfile: { fullName: string; email: string };
  onNavigate: (screen: string) => void;
  isSubscribed?: boolean;
  loadingSubscription?: boolean;
}

interface SUPPORTED_LANGUAGES {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
}

const SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸' },
  { code: 'ar', name: 'العربية (Arabic)', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी (Hindi)', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳' },
  { code: 'ur', name: 'اردو (Urdu)', nativeName: 'اردو', rtl: true, flag: '🇵🇰' },
  { code: 'zh', name: '中文 (Chinese)', nativeName: '中文', rtl: false, flag: '🇨🇳' },
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', rtl: false, flag: '🇹🇷' },
  { code: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili', rtl: false, flag: '🇰🇪' },
  { code: 'th', name: 'ไทย (Thai)', nativeName: 'ไทย', rtl: false, flag: '🇹🇭' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', rtl: false, flag: '🇵🇭' },
  { code: 'ja', name: '日本語 (Japanese)', nativeName: '日本語', rtl: false, flag: '🇯🇵' },
  { code: 'es', name: 'Español', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
  { code: 'pt', name: 'Português', nativeName: 'Português', rtl: false, flag: '🇵🇹' },
  { code: 'ru', name: 'Русский (Russian)', nativeName: 'Русский', rtl: false, flag: '🇷🇺' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', nativeName: 'മലയാളം', rtl: false, flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', nativeName: 'বাংলা', rtl: false, flag: '🇧🇩' },
  { code: 'te', name: 'తెలుగు (Telugu)', nativeName: 'తెలుగు', rtl: false, flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', nativeName: 'தமிழ்', rtl: false, flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', nativeName: 'ગુજરાતી', rtl: false, flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', nativeName: 'ಕನ್ನಡ', rtl: false, flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', nativeName: 'मराठी', rtl: false, flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', nativeName: 'ਪੰਜਾਬੀ', rtl: false, flag: '🇮🇳' },
  { code: 'ps', name: 'پښتو (Pashto)', nativeName: 'پښتو', rtl: true, flag: '🇦🇫' },
  { code: 'fr', name: 'Français', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', rtl: false, flag: '🇮🇹' },
  { code: 'ko', name: '한국어 (Korean)', nativeName: '한국어', rtl: false, flag: '🇰🇷' },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', rtl: false, flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', rtl: false, flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', nativeName: 'Bahasa Melayu', rtl: false, flag: '🇲🇾' },
  { code: 'fa', name: 'فارسی (Persian)', nativeName: 'فارسی', rtl: true, flag: '🇮🇷' },
  { code: 'he', name: 'עברית (Hebrew)', nativeName: 'עברית', rtl: true, flag: '🇮🇱' },
  { code: 'el', name: 'Ελληνικά (Greek)', nativeName: 'Ελληνικά', rtl: false, flag: '🇬🇷' },
];

const DEFAULT_TRANSLATIONS = {
  dashboard: 'Dashboard',
  chef: 'Chef',
  Your_food_cart_control_center: 'Your food cart control center',
  change_language: 'Change Language',
  language: 'Language',
  refresh: 'Refresh',
  refresh_data: 'Refresh Data',
  orders: 'Orders',
  total_sales: 'Total Sales',
  inventory: 'Inventory',
  expenses: 'Expenses',
  opening: 'Opening',
  closing: 'Closing',
  in_hand: 'In Hand',
  cash_balance: 'Cash Balance',
  Available_cash: 'Available Cash',
  End_of_day: 'End of Day',
  quick_actions: 'Quick Actions',
  new_sale: 'New Sale',
  menu: 'Menu',
  reports: 'Reports',
  recent_activity: 'Recent Activity',
  view_all: 'View All',
  no_orders_today: 'No orders today',
  sales_will_appear_here: 'Sales will appear here',
  settings: 'Settings',
  Todays_orders: "Today's Orders",
  Todays_revenue: "Today's Revenue",
  Low_stock_items: 'Low Stock Items',
  stock_levels_good: 'Stock levels good',
  Pending_expenses: 'Pending Expenses',
  failed_to_load_dashboard_data: 'Failed to load dashboard data',
  error: 'Error',
  unable_to_load_dashboard_data: 'Unable to load dashboard data',
  latest_data_loaded_successfully: 'Latest data loaded successfully',
  retry: 'Retry',
  low_stock_alert: 'Low Stock Alert',
  items_low_in_stock: 'items are low in stock',
  View_low_stock_items: 'View low stock items',
  inventory_status: 'Inventory Status',
  switch_to_light_mode: 'Switch to Light Mode',
  switch_to_dark_mode: 'Switch to Dark Mode',
  create_new_sale: 'Create New Sale',
  view_orders: 'View Orders',
  view_menu: 'View Menu',
  view_inventory: 'View Inventory',
  view_reports: 'View Reports',
  manage_cash_balance: 'Manage Cash Balance',
  view_opening_balance: 'View Opening Balance',
  view_cash_in_hand: 'View Cash In Hand',
  view_closing_balance: 'View Closing Balance',
  view_all_orders: 'View All Orders',
  retry_loading_data: 'Retry Loading Data',
  cash_balance_updated: 'Cash balance updated successfully',
};

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate, isSubscribed }) => {
  const { toast } = useToast();
  const { language: currentLanguage, changeLanguage } = useLanguage();

  const translate = useCallback(
    (key: string, params?: Record<string, any>) => {
      try {
        return DEFAULT_TRANSLATIONS[key as keyof typeof DEFAULT_TRANSLATIONS] || key;
      } catch (error) {
        console.warn(`Translation failed for key: ${key}`, error);
        return DEFAULT_TRANSLATIONS[key as keyof typeof DEFAULT_TRANSLATIONS] || key;
      }
    },
    []
  );

  const [stats, setStats] = useState({
    orders: 0,
    sales: 0,
    lowStock: 0,
    pendingExpenses: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [cashBalance, setCashBalance] = useState({
    openingBalance: 0,
    closingBalance: 0,
    cashInHand: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);

  const loadDashboardData = useCallback(() => {
    try {
      setIsLoading(true);
      const todayOrders = localStorageService.getTodayOrders();
      const todaySales = localStorageService.getTodaySales();
      const lowStockItems = localStorageService.getLowStockItems();
      const todayExpenses = localStorageService.getTodayExpenses();
      const allOrders = localStorageService.getOrders();
      const balance = localStorageService.getCashBalance();

      setStats({
        orders: todayOrders.length,
        sales: todaySales,
        lowStock: lowStockItems.length,
        pendingExpenses: todayExpenses,
      });

      setRecentOrders(allOrders.slice(0, 3));

      if (balance) {
        setCashBalance({
          openingBalance: balance.openingBalance,
          closingBalance: balance.closingBalance,
          cashInHand: balance.cashInHand,
        });
      }
      setError(null);
    } catch (err) {
      const errorMessage = (err as Error).message || translate('failed_to_load_dashboard_data');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: translate('error'),
        description: errorMessage,
        className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      });
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, translate]);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      toast({
        title: translate('dashboard'),
        description: translate('latest_data_loaded_successfully'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg',
      });
      loadDashboardData();
    }, 800);
  }, [loadDashboardData, toast, translate]);

  const handleCashBalanceSave = useCallback(
    (balances: { openingBalance: number; closingBalance: number; cashInHand: number }) => {
      try {
        localStorageService.saveCashBalance({ ...balances, lastUpdated: new Date().toISOString() });
        setCashBalance(balances);
        toast({
          title: translate('cash_balance'),
          description: translate('cash_balance_updated'),
          className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg',
        });
        refreshData();
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to update cash balance';
        console.error('Failed to save cash balance:', error);
        toast({
          variant: 'destructive',
          title: translate('error'),
          description: errorMessage,
          className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
        });
      }
    },
    [toast, translate, refreshData]
  );

  useEffect(() => {
    loadDashboardData();
    // Add trial reminder
    if (isSubscribed && SubscriptionService.shouldShowReminder()) {
      toast({
        title: 'Trial Reminder',
        description: 'Your 7-day trial is ending soon! Subscribe to continue.',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
        duration: 5000,
      });
      SubscriptionService.markReminderShown();
    }
  }, [loadDashboardData, isSubscribed, toast]);

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const isRtl = currentLang.rtl;

  const handleLanguageChange = useCallback(
    (code: string) => {
      try {
        changeLanguage(code);
        setIsLanguageSheetOpen(false);
        setForceRender(prev => prev + 1);
        setTimeout(() => {
          toast({
            title: 'Language Changed',
            description: `Language switched to ${SUPPORTED_LANGUAGES.find(l => l.code === code)?.nativeName || 'Selected Language'}`,
            className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg',
          });
          loadDashboardData();
        }, 100);
      } catch (error) {
        console.error('Language change failed:', error);
        toast({
          variant: 'destructive',
          title: 'Language Change Failed',
          description: 'Failed to change language. Please try again.',
        });
      }
    },
    [changeLanguage, loadDashboardData, toast]
  );

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('darkMode', newDarkMode.toString());
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedDarkMode);
      document.documentElement.classList.toggle('dark', savedDarkMode);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => {
        setDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const StatSkeleton = () => (
    <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/10 dark:border-gray-700/30 relative overflow-hidden animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
        <div className="h-6 w-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
      </div>
      <div className="h-7 w-20 bg-gray-200/50 dark:bg-gray-700/50 mb-2 rounded-md" />
      <div className="h-4 w-24 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer" />
    </div>
  );

  const RecentActivitySkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl border border-white/10 dark:border-gray-700/30 relative overflow-hidden animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
              <div className="h-3 w-24 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
            </div>
          </div>
          <div className="h-4 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      key={forceRender}
      className={cn(
        'min-h-screen px-4 py-4 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] overflow-hidden',
        isRtl ? 'direction-rtl' : ''
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .animate-pulse-slow {
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes gradientText {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gradient-text {
            background: linear-gradient(90deg, #ff7043, #ff9f43, #ff7043);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: gradientText 4s ease infinite;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .dark .glass-card {
            background: rgba(26, 26, 46, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .mobile-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .mobile-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          }
          .stat-card {
            position: relative;
            overflow: hidden;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff7043, #ff9f43);
            border-radius: 8px 8px 0 0;
          }
          .direction-rtl {
            direction: rtl;
          }
        `}
      </style>

      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#e3f2fd]/50 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg-[#f3e5f5]/50 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg-[#e8f5e8]/50 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-[#fff3e0]/50 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-28 h-28 rounded-full bg-[#e0f7fa]/50 animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Enhanced Header Section */}
      <div className="mb-6 p-5 glass-card shadow-lg animate-fade-in z-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center">
                <Utensils size={24} className="mr-2 text-[#ff7043] animate-pulse-slow" />
                {translate('dashboard')}, {userProfile?.fullName?.split(' ')[0] || translate('chef')}!
              </h1>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-white/70 dark:bg-gray-800/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
                aria-label={darkMode ? translate('switch_to_light_mode') : translate('switch_to_dark_mode')}
              >
                {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 animate-fade-in delay-100 flex items-center">
              <Calendar size={14} className="mr-1" />
              {translate('Your_food_cart_control_center')} –{' '}
              {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi' })},{' '}
              {new Date().toLocaleDateString('en-US', {
                timeZone: 'Asia/Karachi',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Sheet open={isLanguageSheetOpen} onOpenChange={setIsLanguageSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/20 hover:bg-white/90 dark:hover:bg-gray-800/30 transition-all duration-300 border-white/30 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto text-gray-700 dark:text-gray-300"
                  aria-label={translate('change_language')}
                >
                  <span className="text-sm font-medium">
                    {currentLang.flag} {currentLang.nativeName}
                  </span>
                  <ChevronDown size={16} className="text-[#ff7043]" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] rounded-l-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-l border-white/30"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left text-gray-800 dark:text-gray-100 flex items-center">
                    <Sparkles size={18} className="mr-2 text-[#ff7043]" />
                    {translate('language')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 max-h-[80vh] overflow-y-auto pr-2">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <div
                      key={lang.code}
                      dir={lang.rtl ? 'rtl' : 'ltr'}
                      className={cn(
                        'p-3 rounded-xl cursor-pointer transition-all duration-200 text-sm flex items-center',
                        currentLanguage === lang.code
                          ? 'bg-white/50 dark:bg-gray-800/50 text-[#ff7043] font-medium shadow-sm'
                          : 'hover:bg-white/40 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                      )}
                      onClick={() => handleLanguageChange(lang.code)}
                      aria-label={`Change language to ${lang.name}`}
                    >
                      <span className="text-base mr-3">{lang.flag}</span>
                      <span className="font-medium">{lang.nativeName}</span>
                      {currentLanguage === lang.code && (
                        <div className="ml-auto w-2 h-2 bg-[#ff7043] rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="secondary"
              onClick={refreshData}
              className="flex items-center gap-1 bg-white/70 dark:bg-gray-800/20 hover:bg-white/90 dark:hover:bg-gray-800/30 transition-all duration-300 border-white/30 rounded-xl px-3 py-2 text-sm shadow-sm hover:shadow-md w-full sm:w-auto mt-2 sm:mt-0 text-gray-700 dark:text-gray-300"
              disabled={isRefreshing}
              aria-label={translate('refresh_data')}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {translate('refresh')}
            </Button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer z-0" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        {isLoading ? (
          [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
        ) : error ? (
          <div className="col-span-2 text-center py-6 glass-card">
            <p className="text-red-500 dark:text-red-400 text-sm mb-3" role="alert">
              {error}
            </p>
            <Button
              variant="primary"
              onClick={refreshData}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#ff7043] to-[#ff9f43] hover:from-[#ff8a5b] hover:to-[#ffb86c] shadow-md"
              aria-label={translate('retry_loading_data')}
            >
              <RefreshCw size={14} className="mr-1" />
              {translate('retry')}
            </Button>
          </div>
        ) : (
          <>
            <div
              className="glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in mobile-card stat-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#2A1F1A]/50 dark:to-[#3C2B23]/50"
              aria-label={translate('todays_orders_stat')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{translate('orders')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <List size={16} className="text-[#ff7043]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{stats.orders}</div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <TrendingUp size={12} className="mr-1 text-green-500" />
                {translate('Todays_orders')}
              </div>
            </div>

            <div
              className="glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in delay-100 mobile-card stat-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#3C2B23]/50 dark:to-[#4D362A]/50"
              aria-label={translate('todays_revenue_stat')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{translate('total_sales')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <DollarSign size={16} className="text-[#ff9f43]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#ff9f43] dark:text-[#ffb86c] mb-1">
                {currencyService.formatAmount(stats.sales)}
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <TrendingUp size={12} className="mr-1 text-green-500" />
                {translate('Todays_revenue')}
              </div>
            </div>

            <div
              className={cn(
                'glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in delay-200 mobile-card stat-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#4D362A]/50 dark:to-[#5D4037]/50',
                stats.lowStock > 0 && 'cursor-pointer'
              )}
              onClick={() =>
                stats.lowStock > 0 &&
                toast({
                  title: translate('low_stock_alert'),
                  description: translate('items_low_in_stock', { count: stats.lowStock }),
                  className: 'bg-[#ffccbc]/50 dark:bg-[#ff8a80]/20 text-[#ff7043] dark:text-[#ffab91] border border-[#ffccbc]/20 dark:border-[#ff8a80]/10',
                })
              }
              aria-label={stats.lowStock > 0 ? translate('View_low_stock_items') : translate('inventory_status')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{translate('inventory')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <Package size={16} className="text-[#ffab91]" />
                </div>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold mb-1',
                  stats.lowStock > 0 ? 'text-[#ff7043] dark:text-[#ffab91]' : 'text-gray-800 dark:text-gray-100'
                )}
              >
                {stats.lowStock}
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                {stats.lowStock > 0 ? (
                  <>
                    <AlertTriangle size={12} className="mr-1 text-[#ff7043]" />
                    {translate('Low_stock_items')}
                  </>
                ) : (
                  <>
                    <TrendingUp size={12} className="mr-1 text-green-500" />
                    {translate('stock_levels_good')}
                  </>
                )}
              </div>
            </div>

            <div
              className="glass-card p-4 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in delay-300 mobile-card stat-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#5D4037]/50 dark:to-[#6D4C41]/50"
              aria-label={translate('pending_expenses_stat')}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{translate('expenses')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <CreditCard size={16} className="text-[#ff80ab]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#ff80ab] dark:text-[#ff99c2] mb-1">
                {currencyService.formatAmount(stats.pendingExpenses)}
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Clock size={12} className="mr-1 text-[#ff80ab]" />
                {translate('Pending_expenses')}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cash Balance Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-3 shadow-sm animate-pulse relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 w-12 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
                <div className="h-6 w-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
              </div>
              <div className="h-5 w-16 mb-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
              <div className="h-3 w-20 bg-gray-200/50 dark:bg-gray-700/50 rounded-md" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer" />
            </div>
          ))
        ) : (
          <>
            <div
              className="glass-card p-3 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in delay-100 mobile-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#3C2B23]/50 dark:to-[#4D362A]/50"
              onClick={() => setShowCashModal(true)}
              aria-label={translate('view_opening_balance')}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{translate('opening')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <Wallet size={14} className="text-[#ff9f43]" />
                </div>
              </div>
              <div className="text-lg font-bold text-[#ff9f43] dark:text-[#ffb86c] mb-1">
                {currencyService.formatAmount(cashBalance.openingBalance)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{translate('cash_balance')}</div>
            </div>

            <div
              className="glass-card p-3 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in delay-200 mobile-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#4D362A]/50 dark:to-[#5D4037]/50"
              onClick={() => setShowCashModal(true)}
              aria-label={translate('view_cash_in_hand')}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{translate('in_hand')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <DollarSign size={14} className="text-[#ff80ab]" />
                </div>
              </div>
              <div className="text-lg font-bold text-[#ff80ab] dark:text-[#ff99c2] mb-1">
                {currencyService.formatAmount(cashBalance.cashInHand)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{translate('Available_cash')}</div>
            </div>

            <div
              className="glass-card p-3 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in delay-300 mobile-card bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 dark:from-[#5D4037]/50 dark:to-[#6D4C41]/50"
              onClick={() => setShowCashModal(true)}
              aria-label={translate('view_closing_balance')}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{translate('closing')}</span>
                <div className="p-1.5 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                  <Briefcase size={14} className="text-[#ffab91]" />
                </div>
              </div>
              <div className="text-lg font-bold text-[#ffab91] dark:text-[#ffccbc] mb-1">
                {currencyService.formatAmount(cashBalance.closingBalance)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{translate('End_of_day')}</div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="glass-card p-5 shadow-lg animate-fade-in delay-400 relative z-10 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center">
          <Sparkles size={20} className="mr-2 text-[#ff7043]" />
          {translate('quick_actions')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="primary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ff7043] to-[#ff9f43] text-white rounded-xl hover:from-[#ff8a5b] hover:to-[#ffb86c] transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 mobile-card"
            onClick={() => onNavigate('newSale')}
            aria-label={translate('create_new_sale')}
          >
            <ShoppingCart size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('new_sale')}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 text-[#ff80ab] rounded-xl hover:bg-[#ffffff]/90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 mobile-card"
            onClick={() => onNavigate('orders')}
            aria-label={translate('view_orders')}
          >
            <ChefHat size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('orders')}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 text-[#ff9f43] rounded-xl hover:bg-[#ffffff]/90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 mobile-card"
            onClick={() => onNavigate('menu')}
            aria-label={translate('view_menu')}
          >
            <Salad size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('menu')}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 text-[#ff80ab] rounded-xl hover:bg-[#ffffff]/90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 mobile-card"
            onClick={() => onNavigate('inventory')}
            aria-label={translate('view_inventory')}
          >
            <Truck size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('inventory')}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 text-[#ffab91] rounded-xl hover:bg-[#ffffff]/90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 mobile-card"
            onClick={() => onNavigate('reports')}
            aria-label={translate('view_reports')}
          >
            <BarChart3 size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('reports')}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff]/70 to-[#f5f5f5]/70 text-[#ff7043] rounded-xl hover:bg-[#ffffff]/90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 mobile-card"
            onClick={() => setShowCashModal(true)}
            aria-label={translate('manage_cash_balance')}
          >
            <Receipt size={20} className="mb-1.5" />
            <span className="text-xs font-medium">{translate('cash_balance')}</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-4 shadow-md animate-fade-in delay-400 relative z-10 mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <Coffee size={20} className="mr-2 text-[#ff7043]" />
            {translate('recent_activity')}
          </h2>
          {recentOrders.length > 0 && (
            <button
              className="text-xs text-[#ff7043] hover:text-[#ff9f43] p-0 h-auto flex items-center bg-transparent border-none cursor-pointer"
              onClick={() => onNavigate('orders')}
              aria-label={translate('view_all_orders')}
            >
              {translate('view_all')}
              <ArrowRight size={12} className="ml-1" />
            </button>
          )}
        </div>

        {isLoading ? (
          <RecentActivitySkeleton />
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="glass-card p-3 hover:bg-white/60 dark:hover:bg-gray-800/40 transition-all duration-200 cursor-pointer mobile-card bg-gradient-to-br from-[#ffffff]/50 to-[#f5f5f5]/50 dark:from-[#3C2B23]/30 dark:to-[#4D362A]/30"
                onClick={() => onNavigate(`order/${order.id}`)}
                onKeyDown={e => e.key === 'Enter' && onNavigate(`order/${order.id}`)}
                tabIndex={0}
                role="button"
                aria-label={`View order details for ${order.items.map(item => item.name).join(', ')}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                      <ShoppingBag size={16} className="text-[#ff7043]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100 text-sm line-clamp-1 max-w-[140px] md:max-w-[200px]">
                        {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#ff9f43] dark:text-[#ffb86c]">
                    {currencyService.formatAmount(order.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <ShoppingCart size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">{translate('no_orders_today')}</p>
            <p className="text-xs">{translate('sales_will_appear_here')}</p>
          </div>
        )}
      </div>

      <CashBalanceModal isOpen={showCashModal} onClose={() => setShowCashModal(false)} onSave={handleCashBalanceSave} />
    </div>
  );
};

export default Dashboard;