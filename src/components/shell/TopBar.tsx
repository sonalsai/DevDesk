import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import { Search, Moon, Sun, Keyboard, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

  const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Compute page title (no breadcrumbs/path needed anywhere)
  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard';
      case 'scratchpad':
        return 'Scratchpad';
      case 'tasks':
        return 'Tasks';
      case 'projects':
        return 'Projects';
      case 'project-detail': {
        const proj = data.projects.find((p) => p.id === selectedProjectId);
        return proj ? proj.name : 'Project Details';
      }
      case 'snippets':
        return 'Code Snippets';
      case 'all-tools':
        return 'All Utilities';
      case 'tool': {
        const tool = TOOLS_REGISTRY.find((t) => t.id === selectedToolId);
        return tool ? tool.name : 'Utility';
      }
      case 'favorites':
        return 'Favorites';
      case 'recent':
        return 'Recent History';
      case 'settings':
        return 'Settings';
      case 'api-client':
        return 'API Client';
      case 'collections':
        return 'Collections & History';
      case 'environments':
        return 'Environments';
      case 'webhooks':
        return 'Webhook Inspector';
      case 'http-inspector':
        return 'HTTP Inspector';
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
    // The theme reveal (index.css) grows from the button that was clicked
    const rect = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`);
    const nextTheme = data.settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    showToast(`Switched to ${nextTheme} mode`, 'info', 1500);
  };

  const isHome = activeView === 'dashboard';

  return (
    <header className="top-bar">
      {/* Left: Back Arrow (only when not on home) + Page Title (no path anywhere) */}
      <div className="top-bar-left">
        {!isHome && (
          <button
            type="button"
            className="top-bar-back-btn"
            onClick={handleBack}
            title={`Back (${isMac ? '⌥←' : 'Alt+←'})`}
            aria-label="Back"
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
        >
          <div className="search-placeholder-group">
            <Search size={13} />
            <span>Search tools, snippets, projects...</span>
          </div>

          <span className="kbd-group">
            <span className="kbd-shortcut">{modKey}</span>
            <span className="kbd-shortcut">K</span>
          </span>
        </button>
      </div>

      {/* Right: Quick actions, Theme toggle, Shortcuts, Privacy, Avatar */}
      <div className="top-bar-right">
        <button
          className="top-bar-btn"
          onClick={handleToggleTheme}
          title={`Theme: currently ${data.settings.theme}`}
          aria-label="Toggle theme"
        >
          {data.settings.theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button
          className="top-bar-btn"
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={15} />
        </button>

        <button
          className="top-bar-btn"
          onClick={() => setIsPrivacyModalOpen(true)}
          title="100% Local-first privacy"
          aria-label="Privacy information"
        >
          <Shield size={15} />
        </button>

        <button
          className="user-avatar-badge"
          title="DevDesk Local Workspace"
          aria-label="Open settings"
          onClick={() => setActiveView('settings')}
        >
          DEV
        </button>
      </div>
    </header>
  );
};
