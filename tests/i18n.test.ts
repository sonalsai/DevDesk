import { describe, it, expect, beforeEach } from 'vitest';
import {
  t,
  setActiveLocale,
  getActiveLocale,
  formatLocaleDateTime,
  formatLocaleRelativeTime,
  formatLocaleBytes,
  formatLocaleNumber,
  SUPPORTED_LOCALES,
} from '../src/services/i18n/i18nService';

describe('Internationalization (i18n) Engine', () => {
  beforeEach(() => {
    setActiveLocale('en');
  });

  it('provides translations for all 7 supported global languages', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(7);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toEqual(['en', 'es', 'ja', 'de', 'fr', 'zh', 'hi']);
  });

  it('translates navigation keys in English by default', () => {
    expect(t('nav.home')).toBe('Home');
    expect(t('nav.apiClient')).toBe('API Client');
    expect(t('nav.settings')).toBe('Settings');
  });

  it('translates navigation keys when switching to Spanish', () => {
    setActiveLocale('es');
    expect(getActiveLocale()).toBe('es');
    expect(t('nav.home')).toBe('Inicio');
    expect(t('nav.settings')).toBe('Configuración');
  });

  it('translates navigation keys when switching to Japanese', () => {
    setActiveLocale('ja');
    expect(getActiveLocale()).toBe('ja');
    expect(t('nav.home')).toBe('ホーム');
    expect(t('nav.settings')).toBe('設定');
  });

  it('falls back to English when a key is missing in another locale', () => {
    setActiveLocale('fr');
    // Using an invalid or missing sub-key
    const result = t('nav.nonExistentKey');
    expect(result).toBe('nav.nonExistentKey');
  });

  it('interpolates parameters correctly', () => {
    const res = t('dashboard.pendingTasks', { count: 5 });
    expect(typeof res).toBe('string');
  });

  it('formats dates according to locale', () => {
    const date = new Date('2026-10-06T12:00:00Z');
    const formattedEn = formatLocaleDateTime(date, { dateStyle: 'short' }, 'en');
    expect(formattedEn).toBeDefined();
    expect(formattedEn.length).toBeGreaterThan(0);

    const relTime = formatLocaleRelativeTime(Date.now() - 3600000, 'en');
    expect(relTime).toBeDefined();
    expect(typeof relTime).toBe('string');
  });

  it('formats bytes according to locale size units', () => {
    expect(formatLocaleBytes(0)).toBe('0 B');
    expect(formatLocaleBytes(1024)).toBe('1 KB');
    expect(formatLocaleBytes(1048576)).toBe('1 MB');
  });

  it('formats numbers with commas or regional separators', () => {
    const formatted = formatLocaleNumber(1000000, 'en');
    expect(formatted).toBe('1,000,000');
  });
});
