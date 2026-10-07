import { createContext } from 'react';
import type { SupportedLocale, LocaleMeta } from '../services/i18n/translations';

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  locales: LocaleMeta[];
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (timestamp: string | number) => string;
  formatBytes: (bytes: number) => string;
  formatNumber: (num: number) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);
