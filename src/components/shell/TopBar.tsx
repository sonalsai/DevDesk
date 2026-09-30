import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import { Search, Moon, Sun, Keyboard, Shield } from 'lucide-react';
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
  } = useWorkspace();
  const { showToast } = useToast();

  const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Compute breadcrumb & title
  const getPageInfo = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'Dashboard', breadcrumb: 'Workspace' };
      case 'scratchpad':
        return { title: 'Scratchpad', breadcrumb: 'Workspace' };
      case 'tasks':
        return { title: 'Tasks', breadcrumb: 'Workspace' };
      case 'projects':
        return { title: 'Projects', breadcrumb: 'Workspace' };
      case 'project-detail': {
        const proj = data.projects.find((p) => p.id === selectedProjectId);
        return { title: proj ? proj.name : 'Project Details', breadcrumb: 'Projects' };
      }
      case 'snippets':
        return { title: 'Code Snippets', breadcrumb: 'Library' };
      case 'all-tools':
        return { title: 'All Utilities', breadcrumb: 'Tools' };
      case 'tool': {
        const tool = TOOLS_REGISTRY.find((t) => t.id === selectedToolId);
        return { title: tool ? tool.name : 'Utility', breadcrumb: 'Tools' };
      }
      case 'favorites':
        return { title: 'Favorites', breadcrumb: 'Workspace' };
      case 'recent':
        return { title: 'Recent History', breadcrumb: 'Workspace' };
      case 'settings':
        return { title: 'Settings', breadcrumb: 'Preferences' };
      case 'api-client':
        return { title: 'API Client', breadcrumb: 'Development' };
      case 'collections':
        return { title: 'Collections & History', breadcrumb: 'Development' };
      case 'environments':
        return { title: 'Environments', breadcrumb: 'Development' };
      case 'webhooks':
        return { title: 'Webhook Inspector', breadcrumb: 'Development' };
      case 'http-inspector':
        return { title: 'HTTP Inspector', breadcrumb: 'Development' };
      default:
        return { title: 'Workspace', breadcrumb: '' };
    }
  };

  const pageInfo = getPageInfo();

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    // The theme reveal (index.css) grows from the button that was clicked
    const rect = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`);
    const nextTheme = data.settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    showToast(`Switched to ${nextTheme} mode`, 'info', 1500);
  };

  return (
    <header className="top-bar">
      {/* Left: Breadcrumbs */}
      <div className="top-bar-left">
        <span className="top-bar-crumb">{pageInfo.breadcrumb}</span>

        <span className="breadcrumb-separator">/</span>

        <span className="top-bar-title">{pageInfo.title}</span>
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
