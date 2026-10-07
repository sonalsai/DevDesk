import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace, useToast, useTranslation } from '@/hooks';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import {
  Search,
  Moon,
  Sun,
  Keyboard,
  Shield,
  ArrowLeft,
  Settings,
  BookOpen,
  Globe2,
  HardDrive,
  Check,
} from 'lucide-react';
import { useNetworkStatus } from '../../services/networkStatusService';
import type { SupportedLocale } from '../../services/i18n/translations';

export const TopBar: React.FC = () => {
  const {
    activeView,
    selectedToolId,
    selectedProjectId,
    data,
    updateSettings,
    setIsCommandPaletteOpen,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
    setActiveView,
    canGoBack,
    goBack,
  } = useWorkspace();
  const { showToast } = useToast();
  const { t, locale, setLocale, locales, formatBytes } = useTranslation();
  const { isOnline } = useNetworkStatus();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title (comprehensive for all views)
  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return t('nav.home');
      case 'docs':
        return t('nav.docs');
      case 'scratchpad':
        return t('nav.scratchpad');
      case 'tasks':
        return t('nav.tasks');
      case 'projects':
        return t('nav.projects');
      case 'project-detail': {
        const proj = data.projects.find((p) => p.id === selectedProjectId);
        return proj ? proj.name : 'Project Details';
      }
      case 'snippets':
        return t('nav.snippets');
      case 'all-tools':
        return t('nav.allTools');
      case 'tool': {
        const tool = TOOLS_REGISTRY.find((t) => t.id === selectedToolId);
        return tool ? tool.name : 'Utility';
      }
      case 'favorites':
        return t('nav.favorites');
      case 'recent':
        return t('nav.recent');
      case 'settings':
        return t('nav.settings');
      case 'api-client':
        return t('nav.apiClient');
      case 'collections':
        return t('nav.collections');
      case 'environments':
        return t('nav.environments');
      case 'graphql':
        return t('nav.graphql');
      case 'websocket':
        return t('nav.websocket');
      case 'sse':
        return t('nav.sse');
      case 'mock-server':
        return t('nav.mockServer');
      case 'openapi-explorer':
        return t('nav.openapi');
      case 'webhooks':
        return t('nav.webhooks');
      case 'http-inspector':
        return t('nav.httpInspector');
      case 'git':
        return t('nav.git');
      case 'ssh':
        return t('nav.ssh');
      case 'logs':
        return t('nav.logs');
      case 'yaml-toolkit':
        return t('nav.yamlToolkit');
      default:
        return 'DevDesk';
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      setActiveView('dashboard');
    }
  };

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`);
    const nextTheme = data.settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    showToast(`Switched to ${nextTheme} mode`, 'info', 1500);
  };

  const isHome = activeView === 'dashboard';
  const currentLocaleMeta = locales.find((l) => l.code === locale) || locales[0];

  // Approximate serialized memory/storage consumption
  const usedBytes = typeof window !== 'undefined'
    ? new Blob([JSON.stringify(data)]).size
    : 0;

  return (
    <header className="top-bar" role="banner">
      {/* Left: Back Arrow + Page Title */}
      <div className="top-bar-left">
        {!isHome && (
          <button
            type="button"
            className="top-bar-back-btn"
            onClick={handleBack}
            title={`${t('topbar.back')} (${isMac ? '⌥←' : 'Alt+←'})`}
            aria-label={t('topbar.back')}
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <span className="top-bar-title">{getPageTitle()}</span>
      </div>

      {/* Center: Global Search Bar trigger (Cmd+K) */}
      <div className="top-bar-center">
        <button
          className="global-search-trigger"
          onClick={() => setIsCommandPaletteOpen(true)}
          title={`Global search (${modKey} K)`}
          aria-label={t('topbar.searchPlaceholder')}
        >
          <div className="search-placeholder-group">
            <Search size={13} />
            <span>{t('topbar.searchPlaceholder')}</span>
          </div>

          <span className="kbd-group">
            <span className="kbd-shortcut">{modKey}</span>
            <span className="kbd-shortcut">K</span>
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="top-bar-right">
        {/* Network Status Beacon */}
        <div
          className={`network-status-indicator ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? t('topbar.online') : t('topbar.offline')}
          role="status"
          aria-live="polite"
        >
          <span className="status-beacon-dot" />
          <span className="status-beacon-text">{isOnline ? t('topbar.online') : t('topbar.offline')}</span>
        </div>

        {/* Storage Usage Pill */}
        <button
          className="top-bar-status-pill"
          onClick={() => setActiveView('settings')}
          title={`${t('topbar.storageUsed')}: ${formatBytes(usedBytes)}`}
          aria-label={`${t('topbar.storageUsed')}: ${formatBytes(usedBytes)}`}
        >
          <HardDrive size={13} style={{ color: 'var(--accent)' }} />
          <span>{formatBytes(usedBytes)}</span>
        </button>

        {/* Global Multi-Language Selector Dropdown */}
        <div className="locale-dropdown-wrapper" ref={langDropdownRef} style={{ position: 'relative' }}>
          <button
            className="top-bar-btn"
            onClick={() => setIsLangDropdownOpen((prev) => !prev)}
            title={`Language: ${currentLocaleMeta.nativeName}`}
            aria-label={`Language: ${currentLocaleMeta.nativeName}`}
            aria-expanded={isLangDropdownOpen}
          >
            <span style={{ fontSize: 13, marginRight: 2 }}>{currentLocaleMeta.flag}</span>
            <Globe2 size={14} />
          </button>

          {isLangDropdownOpen && (
            <div
              className="locale-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-dropdown)',
                padding: '6px 0',
                minWidth: 170,
                zIndex: 1000,
                backdropFilter: 'blur(16px)',
              }}
            >
              {locales.map((loc) => {
                const isSelected = loc.code === locale;
                return (
                  <button
                    key={loc.code}
                    onClick={() => {
                      setLocale(loc.code as SupportedLocale);
                      updateSettings({ locale: loc.code as SupportedLocale });
                      setIsLangDropdownOpen(false);
                      showToast(`Language set to ${loc.nativeName}`, 'info', 1500);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{loc.flag}</span>
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{loc.nativeName}</span>
                    </span>
                    {isSelected && <Check size={13} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Documentation / Guide */}
        <button
          className={`top-bar-btn ${activeView === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveView('docs')}
          title={t('topbar.guide')}
          aria-label={t('topbar.guide')}
        >
          <BookOpen size={15} />
        </button>

        {/* Theme Toggle */}
        <button
          className="top-bar-btn"
          onClick={handleToggleTheme}
          title={`${t('topbar.toggleTheme')}: ${data.settings.theme}`}
          aria-label={t('topbar.toggleTheme')}
        >
          {data.settings.theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Keyboard Shortcuts */}
        <button
          className="top-bar-btn"
          onClick={() => setIsShortcutsOpen(true)}
          title={t('topbar.shortcuts')}
          aria-label={t('topbar.shortcuts')}
        >
          <Keyboard size={15} />
        </button>

        {/* Privacy Guarantee */}
        <button
          className="top-bar-btn"
          onClick={() => setIsPrivacyModalOpen(true)}
          title={t('topbar.privacy')}
          aria-label={t('topbar.privacy')}
        >
          <Shield size={15} />
        </button>

        {/* Settings */}
        <button
          className={`top-bar-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
          title={t('topbar.settings')}
          aria-label={t('topbar.settings')}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
