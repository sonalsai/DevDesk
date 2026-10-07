import { useContext } from 'react';
import { I18nContext, type I18nContextType } from '../context/i18nContextDef';
import {
  getActiveLocale,
  setActiveLocale,
  t as translateHelper,
  formatLocaleDateTime,
  formatLocaleRelativeTime,
  formatLocaleBytes,
  formatLocaleNumber,
  SUPPORTED_LOCALES,
} from '../services/i18n/i18nService';

export function useTranslation(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: getActiveLocale(),
      setLocale: setActiveLocale,
      t: (path: string, params?: Record<string, string | number>) => translateHelper(path, params),
      locales: SUPPORTED_LOCALES,
      formatDateTime: formatLocaleDateTime,
      formatRelativeTime: formatLocaleRelativeTime,
      formatBytes: formatLocaleBytes,
      formatNumber: formatLocaleNumber,
    };
  }
  return ctx;
}
