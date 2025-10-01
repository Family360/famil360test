import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import { localStorageService } from "../services/localStorage";
import languageService from '../services/languageService';
import { currencyService } from "../services/currencyService";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, Moon, Sun, Bell, Download, LogOut, Lock, ArrowLeft, Settings as SettingsIcon, User, Shield, Database, Info, Languages } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Define the AppSettings interface that matches localStorage Settings
interface AppSettings {
  currency: string;
  language: string;
  country: string;
  theme: "light" | "dark";
  notifications: boolean;
}

interface SettingsProps {
  onNavigate?: (screen: string) => void;
}

const defaultSettings: AppSettings = {
  currency: "₹",
  language: "en",
  country: "India",
  theme: "light",
  notifications: true,
};

// Custom debounce hook implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom click outside hook implementation
function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Moved constants outside component to prevent recreation on every render
const languages = [
  { code: "en", name: "English", nativeName: "English", rtl: false, flag: "🇺🇸" },
  { code: "ar", name: "العربية (Arabic)", nativeName: "العربية", rtl: true, flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी (Hindi)", nativeName: "हिन्दी", rtl: false, flag: "🇮🇳" },
  { code: "ur", name: "اردو (Urdu)", nativeName: "اردو", rtl: true, flag: "🇵🇰" },
  { code: "zh", name: "中文 (Chinese)", nativeName: "中文", rtl: false, flag: "🇨🇳" },
  { code: "tr", name: "Türkçe", nativeName: "Türkçe", rtl: false, flag: "🇹🇷" },
  { code: "sw", name: "Kiswahili", nativeName: "Kiswahili", rtl: false, flag: "🇰🇪" },
  { code: "th", name: "ไทย (Thai)", nativeName: "ไทย", rtl: false, flag: "🇹🇭" },
  { code: "fil", name: "Filipino", nativeName: "Filipino", rtl: false, flag: "🇵🇭" },
  { code: "ja", name: "日本語 (Japanese)", nativeName: "日本語", rtl: false, flag: "🇯🇵" },
  { code: "es", name: "Español", nativeName: "Español", rtl: false, flag: "🇪🇸" },
  { code: "pt", name: "Português", nativeName: "Português", rtl: false, flag: "🇵🇹" },
  { code: "ru", name: "Русский (Russian)", nativeName: "Русский", rtl: false, flag: "🇷🇺" },
  { code: "ml", name: "മലയാളം (Malayalam)", nativeName: "മലയാളം", rtl: false, flag: "🇮🇳" },
  { code: "bn", name: "বাংলা (Bengali)", nativeName: "বাংলা", rtl: false, flag: "🇧🇩" },
  { code: "te", name: "తెలుగు (Telugu)", nativeName: "తెలుగు", rtl: false, flag: "🇮🇳" },
  { code: "ta", name: "தமிழ் (Tamil)", nativeName: "தமிழ்", rtl: false, flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી (Gujarati)", nativeName: "ગુજરાતી", rtl: false, flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)", nativeName: "ಕನ್ನಡ", rtl: false, flag: "🇮🇳" },
  { code: "mr", name: "मराठी (Marathi)", nativeName: "मराठी", rtl: false, flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", nativeName: "ਪੰਜਾਬੀ", rtl: false, flag: "🇮🇳" },
  { code: "ps", name: "پښتو (Pashto)", nativeName: "पश्तो", rtl: true, flag: "🇦🇫" },
  { code: "fr", name: "Français", nativeName: "Français", rtl: false, flag: "🇫🇷" },
  { code: "de", name: "Deutsch", nativeName: "Deutsch", rtl: false, flag: "🇩🇪" },
  { code: "it", name: "Italiano", nativeName: "Italiano", rtl: false, flag: "🇮🇹" },
  { code: "ko", name: "한국어 (Korean)", nativeName: "한국어", rtl: false, flag: "🇰🇷" },
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt", rtl: false, flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", nativeName: "Bahasa Indonesia", rtl: false, flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", nativeName: "Bahasa Melayu", rtl: false, flag: "🇲🇾" },
  { code: "fa", name: "فارسی (Persian)", nativeName: "فارسی", rtl: true, flag: "🇮🇷" },
  { code: "he", name: "עברית (Hebrew)", nativeName: "עברית", rtl: true, flag: "🇮🇱" },
  { code: "el", name: "Ελληνικά (Greek)", nativeName: "Ελληνικά", rtl: false, flag: "🇬🇷" },
];

const currencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "₣" },
  { code: "SEK", name: "Swedish Krona", symbol: "Kr" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₹" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
];

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite book?",
  "What city were you born in?",
];

const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/1_xwPf0grP6HwbBkpnilaBdNgZ7jS-IaDuGRNig7D6lk/edit?usp=sharing";

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    securityAnswer: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let translation = languageService.translate(key);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(`{${key}}`, value.toString());
      });
    }
    return translation;
  }, []);

  // Random security question
  const randomQuestion = useMemo(
    () => securityQuestions[Math.floor(Math.random() * securityQuestions.length)],
    []
  );

  // Load settings on mount
  const loadSettings = useCallback(() => {
    try {
      const saved = localStorageService.getSettings();
      if (saved) {
        // Ensure all required fields are present
        const completeSettings: AppSettings = {
          currency: saved.currency || defaultSettings.currency,
          language: saved.language || defaultSettings.language,
          country: saved.country || defaultSettings.country,
          theme: (saved.theme as "light" | "dark") || defaultSettings.theme,
          notifications: saved.notifications !== undefined ? saved.notifications : defaultSettings.notifications,
        };
        setSettings(completeSettings);
        currencyService.setCurrency(completeSettings.currency);
        languageService.setLanguage(completeSettings.language);
        document.documentElement.classList.toggle("dark", completeSettings.theme === "dark");
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("settings_load_error"),
        variant: "destructive",
      });
    }
  }, [toast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle settings changes with validation
  const handleChange = useCallback(
    (field: keyof AppSettings, value: string | boolean) => {
      if (field === "language" && !languages.some((lang) => lang.code === value)) {
        toast({
          title: t("invalid_language"),
          description: t("invalid_language_desc"),
          variant: "destructive",
        });
        return;
      }
      if (field === "currency" && !currencies.some((curr) => curr.symbol === value)) {
        toast({
          title: t("invalid_currency"),
          description: t("invalid_currency_desc"),
          variant: "destructive",
        });
        return;
      }

      const newSettings = { ...settings, [field]: value };
      setSettings(newSettings);

      if (field === "currency") {
        currencyService.setCurrency(value as string);
      } else if (field === "language") {
        languageService.setLanguage(value as string);
      } else if (field === "theme") {
        document.documentElement.classList.toggle("dark", value === "dark");
      }

      // Save immediately when changing theme
      if (field === "theme") {
        localStorageService.saveSettings(newSettings);
      }
    },
    [settings, toast, t]
  );

  // Handle settings save with debounce
  const debouncedSettings = useDebounce(settings, 500);

useEffect(() => {
  localStorageService.saveSettings(debouncedSettings);
}, [debouncedSettings]);

// Handle settings save
const handleSave = useCallback(
  async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      localStorageService.saveSettings(settings); // direct save (no debouncedSave)
      toast({
        title: t("settings_updated"),
        description: t("settings_updated_desc"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("settings_save_error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  },
  [settings, isLoading, toast, t] // removed debouncedSave
);


  // Handle data export
  const handleExportData = useCallback(() => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
      const link = document.createElement("a");
      link.href = dataStr;
      link.download = "app-settings.json";
      link.click();
      toast({
        title: t("export_success"),
        description: t("export_success_desc"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("export_error"),
        variant: "destructive",
      });
    }
  }, [settings, toast, t]);

  // Handle sign-out (placeholder)
  const handleSignOut = useCallback(() => {
    try {
      // Placeholder: Implement sign-out logic
      toast({
        title: t("sign_out_success"),
        description: t("sign_out_success_desc"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("sign_out_error"),
        variant: "destructive",
      });
    }
  }, [toast, t]);

  // Handle password reset
  const handlePasswordReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;
      setIsLoading(true);

      try {
        // Validate inputs
        if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
          toast({
            title: t("error"),
            description: t("passwords_do_not_match"),
            variant: "destructive",
          });
          return;
        }
        if (passwordResetData.newPassword.length < 8) {
          toast({
            title: t("error"),
            description: t("password_too_short"),
            variant: "destructive",
          });
          return;
        }
        // Placeholder: Verify security answer and reset password
        toast({
          title: t("password_reset_success"),
          description: t("password_reset_success_desc"),
        });
        setIsPasswordResetOpen(false);
        setPasswordResetData({ securityAnswer: "", newPassword: "", confirmPassword: "" });
      } catch (error) {
        toast({
          title: t("error"),
          description: t("password_reset_error"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [passwordResetData, isLoading, toast, t]
  );

  // Handle opening privacy policy URL
  const handleOpenPrivacyPolicy = useCallback(() => {
    window.open(PRIVACY_POLICY_URL, '_blank');
  }, []);

  // Close sheet when clicking outside
  useOnClickOutside(sheetRef, () => {
    if (isLanguageSheetOpen) setIsLanguageSheetOpen(false);
    if (isPasswordResetOpen) setIsPasswordResetOpen(false);
  });

  const currentLang = languages.find((lang) => lang.code === settings.language);
  const isRtl = currentLang?.rtl;

  return (
    <div 
      className="px-4 py-4 pb-24 bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] min-h-screen"
      dir={isRtl ? "rtl" : "ltr"}
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
          background: rgba(255, 255, 255, 0.95);
          color: #000000;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 20px;
        }
        .dark .glass-card {
          background: rgba(26, 26, 46, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .mobile-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .mobile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        }
        /* Mobile optimization */
        @media (max-width: 640px) {
          .currency-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
          .currency-button {
            padding: 0.75rem;
            min-height: 40px;
          }
          .setting-item {
            padding: 0.75rem;
          }
        }
        `}
      </style>

      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#FFD7C8]/20 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg-[#FFECE0]/30 animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg-[#FFF5F0]/20 animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Enhanced Header Section */}
      <div className="mb-6 p-5 glass-card shadow-lg animate-fade-in z-10 relative overflow-hidden mobile-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate ? onNavigate("dashboard") : window.history.back()}
                className="mr-3 p-2 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all min-h-[44px]"
                aria-label={t("go_back")}
              >
                <ArrowLeft size={18} className="text-[#ff7043]" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center">
                <SettingsIcon size={24} className="mr-2 text-[#ff7043] animate-pulse-slow" />
                {t("Settings")}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 animate-fade-in delay-100 flex items-center">
              {t("Manage_Your_Preferences")} – {new Date().toLocaleTimeString()}, {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer z-0" />
      </div>

      {/* Settings Summary Card */}
      <div className="glass-card p-5 mb-6 animate-fade-in z-10 relative mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <SettingsIcon size={20} className="mr-2 text-[#ff7043]" />
          {t("Settings_Summary")}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            {settings.theme === "dark" ? <Moon size={16} className="mr-1" /> : <Sun size={16} className="mr-1" />}
            {settings.theme === "dark" ? t("dark_mode") : t("light_mode")}
          </span>
          <span className="flex items-center">
            {currentLang?.flag} {currentLang?.name || t("english")}
          </span>
          <span className="flex items-center">{settings.currency} {t("currency")}</span>
          <span className="flex items-center">
            <Bell size={16} className="mr-1" />
            {t("Notifications")} {settings.notifications ? t("on") : t("off")}
          </span>
        </div>
      </div>

      {/* Language Selection Card */}
      <div className="glass-card p-5 mb-6 animate-fade-in delay-100 mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <Languages size={20} className="mr-2 text-[#ff7043]" />
          {t("language")}
        </h2>
        <Sheet open={isLanguageSheetOpen} onOpenChange={setIsLanguageSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
              aria-label={t("select_language")}
            >
              <span className="flex items-center">
                <span className="text-lg mr-2">{currentLang?.flag}</span>
                <span
                  dir={currentLang?.rtl ? "rtl" : "ltr"}
                  className={currentLang?.rtl ? "text-right flex-1" : "flex-1"}
                >
                  {currentLang?.name || t("select_language")}
                </span>
              </span>
              <ChevronDown className="ml-2 text-muted-foreground" size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className="w-full sm:w-[400px] glass-card border-l border-white/10 max-h-[80vh] sm:max-h-full"
            ref={sheetRef}
          >
            <SheetHeader>
              <SheetTitle className="text-gray-800 dark:text-gray-100">{t("language")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  dir={lang.rtl ? "rtl" : "ltr"}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all duration-200 text-sm min-h-[44px] flex items-center",
                    settings.language === lang.code
                      ? "bg-white/30 dark:bg-gray-800/30 text-[#ff7043] font-medium shadow-sm"
                      : "hover:bg-white/20 dark:hover:bg-gray-800/20 text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => {
                    handleChange("language", lang.code);
                    setIsLanguageSheetOpen(false);
                  }}
                  aria-label={`Select ${lang.name} language`}
                >
                  <span className="text-base mr-3">{lang.flag}</span>
                  {lang.name}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* App Settings */}
      <div className="glass-card p-5 mb-6 animate-fade-in delay-200 mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <SettingsIcon size={20} className="mr-2 text-[#ff7043]" />
          {t("App_Settings")}
        </h2>
        <form className="space-y-6" onSubmit={handleSave}>
          {/* Currency Selection */}
          <div>
            <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("Currency")}
            </label>
            <div className="grid grid-cols-3 gap-2 currency-grid">
              {currencies.slice(0, 6).map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  className={cn(
                    "p-3 rounded-xl text-center transition-all duration-200 min-h-[44px] currency-button",
                    settings.currency === currency.symbol
                      ? "bg-[#ff7043]/20 text-[#ff7043] font-medium shadow-sm"
                      : "bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40"
                  )}
                  onClick={() => handleChange("currency", currency.symbol)}
                  aria-label={`Select ${currency.name} currency`}
                >
                  <div className="font-bold text-lg">{currency.symbol}</div>
                  <div className="text-xs truncate">{currency.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl setting-item">
            <div className="flex items-center">
              {settings.theme === "dark" ? (
                <Moon size={20} className="mr-3 text-[#ff7043]" />
              ) : (
                <Sun size={20} className="mr-3 text-[#ff9f43]" />
              )}
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">{t("Theme")}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.theme === "dark" ? t("dark_mode") : t("light_mode")}
                </div>
              </div>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={(checked) => handleChange("theme", checked ? "dark" : "light")}
              className="data-[state=checked]:bg-[#ff7043]"
              aria-label={t("toggle_theme")}
            />
          </div>

          {/* Notification Preferences */}
          <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl setting-item">
            <div className="flex items-center">
              <Bell size={20} className="mr-3 text-[#ff7043]" />
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">{t("Notifications")}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.notifications ? t("enabled") : t("Disabled")}
                </div>
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleChange("notifications", checked)}
              className="data-[state=checked]:bg-[#ff7043]"
              aria-label={t("toggle_notifications")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] min-h-[44px]"
            disabled={isLoading}
            aria-label={t("Save_Changes")}
          >
            {isLoading ? t("Saving") : t("Save_Changes")}
          </Button>
        </form>
  </div>

      {/* Account Management */}
      <div className="glass-card p-5 mb-6 animate-fade-in delay-300 mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <User size={20} className="mr-2 text-[#ff7043]" />
          {t("Account")}
        </h2>
        <div className="space-y-3">
          <Sheet open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
                aria-label={t("Reset_Password")}
              >
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("Reset_Password")}
                </span>
                <ChevronDown className="ml-2 text-muted-foreground" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className="w-full sm:w-[400px] glass-card border-l border-white/10 max-h-[80vh] sm:max-h-full"
              ref={sheetRef}
            >
              <SheetHeader>
                <SheetTitle className="text-gray-800 dark:text-gray-100">{t("reset_password")}</SheetTitle>
              </SheetHeader>
              <form onSubmit={handlePasswordReset} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Security_Question")}
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
                    {randomQuestion}
                  </p>
                  <Input
                    placeholder={t("enter_security_answer")}
                    value={passwordResetData.securityAnswer}
                    onChange={(value: string) =>
                      setPasswordResetData((prev) => ({ ...prev, securityAnswer: value }))
                    }
                    required
                    className="bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30"
                    aria-label={t("security_answer")}
                  />
                </div>
                <Input
                  placeholder={t("enter_new_password")}
                  type="password"
                  value={passwordResetData.newPassword}
                  onChange={(value: string) =>
                    setPasswordResetData((prev) => ({ ...prev, newPassword: value }))
                    }
                  required
                  className="bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30"
                  aria-label={t("new_password")}
                />
                <Input
                  placeholder={t("confirm_new_password")}
                  type="password"
                  value={passwordResetData.confirmPassword}
                  onChange={(value: string) =>
                    setPasswordResetData((prev) => ({ ...prev, confirmPassword: value }))
                    }
                  required
                  className="bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30"
                  aria-label={t("Confirm_Password")}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c] min-h-[44px]"
                  disabled={isLoading}
                  aria-label={t("Reset_Password_Button")}
                >
                  {isLoading ? t("Saving") : t("Reset_password")}
                </Button>
              </form>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 min-h-[44px]"
            onClick={handleSignOut}
            aria-label={t("Sign_out")}
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              {t("Sign_out")}
            </span>
          </Button>
        </div>
      </div>

      {/* Legal */}
      <div className="glass-card p-5 mb-6 animate-fade-in delay-400 mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <Shield size={20} className="mr-2 text-[#ff7043]" />
          {t("Legal")}
        </h2>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
            onClick={handleOpenPrivacyPolicy}
            aria-label={t("View_Privacy_Policy")}
          >
            {t("View_Privacy_Policy")}
            <ChevronDown className="ml-2 text-muted-foreground" size={20} />
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-5 mb-6 animate-fade-in mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <Database size={20} className="mr-2 text-[#ff7043]" />
          {t("Data_Management")}
        </h2>
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
          onClick={handleExportData}
          aria-label={t("Export_Data")}
        >
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("Export_Data")}
          </span>
        </Button>
      </div>

      {/* App Information */}
      <div className="glass-card p-5 animate-fade-in mobile-card">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <Info size={20} className="mr-2 text-[#ff7043]" />
          {t("App_information")}
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("App_Name")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Foodcart360</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Version")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">1.0.0</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Developer")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Exogrow</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Contact")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">exogrow.app@gmail.com</div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/20 dark:bg-gray-800/20 border-t border-white/10 p-2 flex justify-around items-center shadow-lg backdrop-blur-md z-20">
        <button
          className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-[#ff7043] dark:hover:text-[#ff9f43] transition-all min-h-[44px]"
          onClick={() => onNavigate ? onNavigate("dashboard") : window.history.back()}
          aria-label={t("go_back")}
        >
          <div className="p-1.5 rounded-lg mb-1">
            <ArrowLeft size={18} />
          </div>
          <span className="text-xs">{t("back")}</span>
        </button>

        <button
          className="flex flex-col items-center text-[#ff7043] dark:text-[#ff9f43] transition-transform hover:scale-105 min-h-[44px]"
          aria-label={t("settings")}
        >
          <div className="p-1.5 bg-white/30 dark:bg-gray-800/30 rounded-lg mb-1">
            <SettingsIcon size={18} />
          </div>
          <span className="text-xs font-medium">{t("settings")}</span>
        </button>

        <button
          className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-[#ff7043] dark:hover:text-[#ff9f43] transition-all min-h-[44px]"
          onClick={handleExportData}
          aria-label={t("export")}
        >
          <div className="p-1.5 rounded-lg mb-1">
            <Download size={18} />
          </div>
          <span className="text-xs">{t("export")}</span>
        </button>
      </nav>
    </div>
  );
};

export default Settings;