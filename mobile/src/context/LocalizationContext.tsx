import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import {
  formatCompactDateTime,
  formatDateTime,
  getCurrentLanguage,
  getPlanLevelLabel,
  getPlanStatusLabel,
  getRoleLabel,
  getTextAlign,
  getOppositeTextAlign,
  getRowDirection,
  getStartEdgeInsets,
  isRTL,
  setCurrentLanguage,
  translate,
} from '../i18n';
import { subscribeToProfileById } from '../repositories/profileRepository';
import { useAuth } from './AuthContext';
import type { AppLanguage } from '../types/profile';

const LANGUAGE_STORAGE_KEY = 'spots.languagePreference';

type LocalizationContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number | null | undefined>) => string;
  setLanguagePreference: (language: AppLanguage) => Promise<void>;
  formatDateTime: (value: Date | number | string) => string;
  formatCompactDateTime: (value: Date | number | string) => string;
  getRoleLabel: (role?: string | null) => string;
  getPlanLevelLabel: (plan?: string | null) => string;
  getPlanStatusLabel: (status?: string | null) => string;
  getTextAlign: () => 'left' | 'right';
  getOppositeTextAlign: () => 'left' | 'right';
  getRowDirection: () => 'row' | 'row-reverse';
  getStartEdgeInsets: (start: number, end: number) => { left: number; right: number };
};

const LocalizationContext = React.createContext<LocalizationContextValue | undefined>(
  undefined
);

export function LocalizationProvider({
  children,
}: React.PropsWithChildren) {
  const { user } = useAuth();
  const [language, setLanguage] = React.useState<AppLanguage>(getCurrentLanguage());
  const [hasStoredPreference, setHasStoredPreference] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(storedLanguage => {
        if (!isMounted || (storedLanguage !== 'en' && storedLanguage !== 'ar')) {
          return;
        }

        setHasStoredPreference(true);
        setLanguage(storedLanguage);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    setCurrentLanguage(language);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => undefined);
  }, [language]);

  React.useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    return subscribeToProfileById(
      user.id,
      user.email,
      profile => {
        if (!hasStoredPreference) {
          setLanguage(current => (current === profile.language ? current : profile.language));
        }
      },
      () => undefined
    );
  }, [hasStoredPreference, user?.email, user?.id]);

  const setLanguagePreference = React.useCallback(async (nextLanguage: AppLanguage) => {
    setHasStoredPreference(true);
    setLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const value = React.useMemo<LocalizationContextValue>(
    () => ({
      language,
      isRTL: isRTL(language),
      t: (key, params) => translate(key, params, language),
      setLanguagePreference,
      formatDateTime: value => formatDateTime(value, language),
      formatCompactDateTime: value => formatCompactDateTime(value, language),
      getRoleLabel: role => getRoleLabel(role, language),
      getPlanLevelLabel: plan => getPlanLevelLabel(plan, language),
      getPlanStatusLabel: status => getPlanStatusLabel(status, language),
      getTextAlign: () => getTextAlign(language),
      getOppositeTextAlign: () => getOppositeTextAlign(language),
      getRowDirection: () => getRowDirection(language),
      getStartEdgeInsets: (start, end) => getStartEdgeInsets(start, end, language),
    }),
    [language, setLanguagePreference]
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = React.useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
}
