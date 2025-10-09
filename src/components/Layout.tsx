import React, { useState, useEffect, memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChevronDown, Sparkles } from 'lucide-react';
import Button from './Button';
import { cn } from '@/lib/utils';

// Define interface for language service
interface LanguageService {
  getCurrentLanguage: () => string;
  setLanguage: (code: string) => void;
  translate: (key: string) => string;
}

// Mock languageService (replace with actual implementation)
export const languageService: LanguageService = {
  getCurrentLanguage: () => localStorage.getItem('language') || 'en',
  setLanguage: (code: string) => localStorage.setItem('language', code),
  translate: (key: string) => key, // Placeholder, replace with i18n library
};

// Define supported languages
export const SUPPORTED_LANGUAGES = [
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

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showLanguageSelector?: boolean;
}

// Memoized LanguageItem component
const LanguageItem = memo(({ lang, isSelected, onSelect }: {
  lang: typeof SUPPORTED_LANGUAGES[0];
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <div
    dir={lang.rtl ? 'rtl' : 'ltr'}
    className={cn(
      "p-3 rounded-xl cursor-pointer transition-all duration-200 text-sm flex items-center",
      isSelected
        ? "bg-white/30 dark:bg-gray-800/30 text-[#ff7043] font-medium shadow-sm"
        : "hover:bg-white/20 dark:hover:bg-gray-800/20 text-gray-700 dark:text-gray-300"
    )}
    onClick={onSelect}
    role="option"
    aria-selected={isSelected}
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onSelect()}
  >
    {lang.name}
  </div>
));

const Layout: React.FC<LayoutProps> = ({ children, className = '', showLanguageSelector = false }) => {
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => {
    const langCode = languageService.getCurrentLanguage();
    return SUPPORTED_LANGUAGES.find(lang => lang.code === langCode) || SUPPORTED_LANGUAGES[0];
  });

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = currentLang.rtl ? 'rtl' : 'ltr';
  }, [currentLang]);

  const handleLanguageChange = (code: string) => {
    languageService.setLanguage(code);
    const newLang = SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLang(newLang);
    setIsLanguageSheetOpen(false);
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-[#FFF5F0] via-[#FFECE0] to-[#FFD7C8] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] relative overflow-x-hidden",
        className,
        currentLang.rtl ? "direction-rtl" : ""
      )}
      dir={currentLang.rtl ? 'rtl' : 'ltr'}
    >
      <style>
        {`
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
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          }
          .dark .glass-card {
            background: rgba(26, 26, 46, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
        `}
      </style>

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-[#FFD7C8]/20 animate-float"></div>
        <div className="absolute top-30 right-10 w-16 h-16 rounded-full bg-[#FFECE0]/30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-15 w-24 h-24 rounded-full bg-[#FFF5F0]/20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-[#FFD7C8]/10 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-28 h-28 rounded-full bg-[#FFECE0]/15 animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Language Selector (only shown if showLanguageSelector is true) */}
      {showLanguageSelector && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-30 animate-fade-in">
          <div className="glass-card p-1 shadow-md">
            <Sheet open={isLanguageSheetOpen} onOpenChange={setIsLanguageSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300 border-white/10 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto text-gray-700 dark:text-gray-300"
                  aria-label={`Select language, current language is ${currentLang.name}`}
                >
                  <span dir={currentLang.rtl ? 'rtl' : 'ltr'} className="flex-1 truncate max-w-[120px] sm:max-w-[150px] text-sm font-medium">
                    {currentLang.name}
                  </span>
                  <ChevronDown size={16} className="text-[#ff7043]" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-2xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border-l border-white/10 p-4 sm:p-6">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left text-gray-800 dark:text-gray-100 flex items-center">
                    <Sparkles size={18} className="mr-2 text-[#ff7043]" />
                    {languageService.translate('language')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 max-h-[80vh] overflow-y-auto pr-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <LanguageItem
                      key={lang.code}
                      lang={lang}
                      isSelected={languageService.getCurrentLanguage() === lang.code}
                      onSelect={() => handleLanguageChange(lang.code)}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer z-0" />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default Layout;