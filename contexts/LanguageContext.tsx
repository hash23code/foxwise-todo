"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with 'en' to match SSR
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage only after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appLanguage') as Language;
      if (saved === 'en' || saved === 'fr') {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', lang);
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
