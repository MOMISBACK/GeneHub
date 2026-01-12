import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en';
import fr from './translations/fr';
import es from './translations/es';
import hi from './translations/hi';
import zh from './translations/zh';
import ru from './translations/ru';

// Supported languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const translations: Record<LanguageCode, typeof en> = {
  en,
  fr,
  es,
  hi,
  zh,
  ru,
};

type TranslationKeys = typeof en;

const LANGUAGE_STORAGE_KEY = '@genehub/language';

// Get device language without expo-localization (works without native module)
function getDeviceLanguage(): LanguageCode {
  let deviceLang = 'en';
  
  try {
    // Try to get locale from native modules
    if (Platform.OS === 'ios') {
      deviceLang = NativeModules.SettingsManager?.settings?.AppleLocale?.substring(0, 2) ||
                   NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]?.substring(0, 2) ||
                   'en';
    } else if (Platform.OS === 'android') {
      deviceLang = NativeModules.I18nManager?.localeIdentifier?.substring(0, 2) || 'en';
    }
  } catch {
    deviceLang = 'en';
  }
  
  if (deviceLang in translations) {
    return deviceLang as LanguageCode;
  }
  return 'en';
}

type I18nContextType = {
  t: TranslationKeys;
  locale: LanguageCode;
  setLocale: (lang: LanguageCode) => Promise<void>;
  isRTL: boolean;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && saved in translations) {
          setLocaleState(saved as LanguageCode);
        } else {
          setLocaleState(getDeviceLanguage());
        }
      } catch {
        setLocaleState(getDeviceLanguage());
      } finally {
        setIsLoading(false);
      }
    }
    loadLanguage();
  }, []);

  const setLocale = async (lang: LanguageCode) => {
    setLocaleState(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = translations[locale];
  const isRTL = false;

  if (isLoading) {
    return null;
  }

  const value = { t, locale, setLocale, isRTL };

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

let currentTranslations = en;

export function setGlobalTranslations(locale: LanguageCode) {
  currentTranslations = translations[locale];
}

export function getT() {
  return currentTranslations;
}
