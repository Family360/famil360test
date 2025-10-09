import React, { createContext, useContext, useEffect, useState } from 'react';
import languageService, { Language } from '../services/languageService';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguageInfo: Language | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(languageService.getCurrentLanguage());

  const handleLanguageChange = React.useCallback(() => {
    setLanguage(languageService.getCurrentLanguage());
  }, []);

  useEffect(() => {
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [handleLanguageChange]);

  const changeLanguage = React.useCallback((lang: string) => {
    languageService.setLanguage(lang);
  }, []);

  const t = React.useCallback((key: string, params?: Record<string, string | number>) => {
    return languageService.translate(key, params || {});
  }, [language]);

  const value = React.useMemo(() => ({
    currentLanguage: language,
    changeLanguage,
    t,
    supportedLanguages: languageService.getSupportedLanguages(),
    currentLanguageInfo: languageService.getCurrentLanguageInfo(),
  }), [language, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};