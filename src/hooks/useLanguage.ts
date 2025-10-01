import { useState, useEffect } from "react";
import languageService, { SUPPORTED_LANGUAGES } from "../services/languageService";

export function useLanguage() {
  const [language, setLanguage] = useState<string>(languageService.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(languageService.getCurrentLanguage());
    };

    // Listen for language changes
    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const changeLanguage = (lang: string) => {
    languageService.setLanguage(lang);
  };

  const t = (key: string, params: Record<string, string | number> = {}) => {
    return languageService.translate(key, params);
  };

  return { 
    language, 
    changeLanguage, 
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageInfo: languageService.getCurrentLanguageInfo()
  };
}