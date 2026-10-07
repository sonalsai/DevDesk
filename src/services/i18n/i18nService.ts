import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  translations,
} from './translations';

let currentLocale: SupportedLocale = 'en';

export function getActiveLocale(): SupportedLocale {
  return currentLocale;
}

export function setActiveLocale(locale: SupportedLocale): void {
  if (translations[locale]) {
    currentLocale = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      const meta = SUPPORTED_LOCALES.find((l) => l.code === locale);
      document.documentElement.dir = meta?.direction || 'ltr';
    }
  }
}

/**
 * Nested key path resolution for translation keys, e.g. 'nav.home' or 'common.save'
 */
export function t(
  path: string,
  params?: Record<string, string | number>,
  fallbackLocale?: SupportedLocale
): string {
  const loc = fallbackLocale || currentLocale;
  const dict = translations[loc] || translations.en;

  const parts = path.split('.');
  let val: any = dict;

  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      // Fallback to English if key missing in chosen locale
      let fallbackVal: any = translations.en;
      for (const fPart of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && fPart in fallbackVal) {
          fallbackVal = fallbackVal[fPart];
        } else {
          return path;
        }
      }
      val = fallbackVal;
      break;
    }
  }

  if (typeof val !== 'string') {
    return path;
  }

  if (params) {
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }, val);
  }

  return val;
}

/**
 * Localized date & time formatting using Intl.DateTimeFormat
 */
export function formatLocaleDateTime(
  dateOrIso: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: SupportedLocale
): string {
  try {
    const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number'
      ? new Date(dateOrIso)
      : dateOrIso;
    return new Intl.DateTimeFormat(locale || currentLocale, options || {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return String(dateOrIso);
  }
}

/**
 * Localized relative time formatter
 */
export function formatLocaleRelativeTime(
  timestamp: string | number,
  locale?: SupportedLocale
): string {
  const target = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffSec = Math.round((target - Date.now()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale || currentLocale, { numeric: 'auto' });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

/**
 * Localized byte size formatter (B, KB, MB, GB)
 */
export function formatLocaleBytes(bytes: number, locale?: SupportedLocale): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return `${new Intl.NumberFormat(locale || currentLocale).format(num)} ${sizes[i]}`;
}

/**
 * Localized number formatter
 */
export function formatLocaleNumber(num: number, locale?: SupportedLocale): string {
  return new Intl.NumberFormat(locale || currentLocale).format(num);
}

export * from './translations';
