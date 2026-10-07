import React, { useState, useCallback, useMemo } from 'react';
import type { SupportedLocale } from '../services/i18n/translations';
import {
  SUPPORTED_LOCALES,
  t as translateHelper,
  setActiveLocale,
  formatLocaleDateTime,
  formatLocaleRelativeTime,
  formatLocaleBytes,
  formatLocaleNumber,
} from '../services/i18n/i18nService';
import { I18nContext, type I18nContextType } from './i18nContextDef';

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLocale = 'en',
  onLocaleChange,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    setActiveLocale(initialLocale);
    return initialLocale;
  });

  const [prevInitialLocale, setPrevInitialLocale] = useState<SupportedLocale>(initialLocale);

  if (initialLocale !== prevInitialLocale) {
    setPrevInitialLocale(initialLocale);
    setLocaleState(initialLocale);
    setActiveLocale(initialLocale);
  }

  const handleSetLocale = useCallback(
    (newLoc: SupportedLocale) => {
      setActiveLocale(newLoc);
      setLocaleState(newLoc);
      onLocaleChange?.(newLoc);
    },
    [onLocaleChange]
  );

  const translate = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return translateHelper(path, params, locale);
    },
    [locale]
  );

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale: handleSetLocale,
      t: translate,
      locales: SUPPORTED_LOCALES,
      formatDateTime: (d, opt) => formatLocaleDateTime(d, opt, locale),
      formatRelativeTime: (ts) => formatLocaleRelativeTime(ts, locale),
      formatBytes: (b) => formatLocaleBytes(b, locale),
      formatNumber: (n) => formatLocaleNumber(n, locale),
    }),
    [locale, handleSetLocale, translate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
