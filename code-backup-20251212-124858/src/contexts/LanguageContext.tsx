/**
 * ANKR Language Context - 100+ Languages Support
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  t, 
  LabelKey, 
  getAvailableLanguages, 
  getPrimaryLanguages,
  getIndianLanguages,
  getSpeechCode, 
  isRTL 
} from '../config/i18n';
import { ANKR_LANGUAGES, LanguageConfig } from '../config/languages';

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: LabelKey) => string;
  speechCode: string;
  isRTL: boolean;
  languages: LanguageConfig[];
  primaryLanguages: LanguageConfig[];
  indianLanguages: LanguageConfig[];
  currentLanguage: LanguageConfig | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ankr-language') || 'hi'; // Default to Hindi
    }
    return 'hi';
  });

  const setLang = (newLang: string) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ankr-language', newLang);
      // Set document direction for RTL languages
      document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
    }
  };

  useEffect(() => {
    // Set initial direction
    if (typeof window !== 'undefined') {
      document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    }
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    setLang,
    t: (key: LabelKey) => t(key, lang),
    speechCode: getSpeechCode(lang),
    isRTL: isRTL(lang),
    languages: getAvailableLanguages(),
    primaryLanguages: getPrimaryLanguages(),
    indianLanguages: getIndianLanguages(),
    currentLanguage: ANKR_LANGUAGES.find(l => l.code === lang),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export { LanguageContext };
