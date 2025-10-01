import React, { useState, useEffect, memo } from 'react';

// Define interface for language service
interface LanguageService {
  getCurrentLanguage: () => string;
  setLanguage: (code: string) => void;
  translate: (key: string) => string;
}

// Mock languageService (replace with actual implementation)
export const languageService: LanguageService = {
  getCurrentLanguage: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'en';
    }
    return 'en';
  },
  setLanguage: (code: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', code);
    }
  },
  translate: (key: string) => {
    // Simple translation mapping - replace with your actual translation system
    const translations: Record<string, string> = {
      'select_language': 'Select Language',
      'language': 'Language',
      // Add more translations as needed
    };
    return translations[key] || key;
  },
};

// Define supported languages with flags
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

// Memoized LanguageOption component
const LanguageOption = memo(({ lang, isSelected }: { lang: typeof SUPPORTED_LANGUAGES[0]; isSelected: boolean }) => (
  <option 
    value={lang.code} 
    dir={lang.rtl ? 'rtl' : 'ltr'} 
    className={`${lang.rtl ? 'text-right' : 'text-left'} ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
  >
    {lang.flag} {lang.name}
  </option>
));

LanguageOption.displayName = 'LanguageOption';

const LanguageSwitch: React.FC = () => {
  const [currentLang, setCurrentLang] = useState(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return SUPPORTED_LANGUAGES[0];
    }
    
    const langCode = languageService.getCurrentLanguage();
    const lang = SUPPORTED_LANGUAGES.find(lang => lang.code === langCode);
    if (!lang) {
      console.warn(`Unsupported language code: ${langCode}. Falling back to English.`);
      languageService.setLanguage('en');
      return SUPPORTED_LANGUAGES[0];
    }
    return lang;
  });

  const [mounted, setMounted] = useState(false);

  // Set mounted state after component mounts (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update document direction when language changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = currentLang.rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLang.code;
    }
  }, [currentLang, mounted]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    languageService.setLanguage(code);
    const newLang = SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLang(newLang);
    
    // Optional: Dispatch event for other components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: code }));
    }
  };

  // Don't render on server-side to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="glass rounded-lg p-1">
        <select 
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm w-full max-w-[200px] sm:max-w-[250px]"
          disabled
        >
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-1">
      <select
        value={currentLang.code}
        onChange={handleLanguageChange}
        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full max-w-[200px] sm:max-w-[250px] transition-colors duration-200"
        aria-label={languageService.translate('select_language')}
        dir={currentLang.rtl ? 'rtl' : 'ltr'}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <LanguageOption
            key={lang.code}
            lang={lang}
            isSelected={currentLang.code === lang.code}
          />
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitch;