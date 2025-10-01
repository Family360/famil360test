import React, { createContext, useContext, useEffect, useState } from 'react';
import languageService, { Language } from '../services/languageService';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLanguages: Language[];
  currentLanguageInfo: Language | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(languageService.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(languageService.getCurrentLanguage());
    };

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

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    supportedLanguages: languageService.getSupportedLanguages(),
    currentLanguageInfo: languageService.getCurrentLanguageInfo()
  };

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