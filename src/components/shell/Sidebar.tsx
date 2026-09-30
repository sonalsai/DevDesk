import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  FileText,
  CheckSquare,
  FolderKanban,
  Wrench,
  Star,
  Clock,
  Code2,
  Settings,
  Keyboard,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
    data,
  } = useWorkspace();

  const pendingTasksCount = data.tasks.filter((t) => t.status !== 'done').length;
  const snippetsCount = data.snippets.length;
  const favoritesCount = data.favorites.length;
  const projectsCount = data.projects.length;

  return (
    <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <button
          className="brand-toggle-btn"
          onClick={() => setActiveView('dashboard')}
          title="Return to Home Dashboard"
        >
          <span className="brand-logo-icon">D</span>
          <span className="brand-name">DevDesk</span>
        </button>

        <button
          className="btn-icon sidebar-collapse-btn"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className="sidebar-content">
        {/* WORKSPACE SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Workspace</div>

          <button
            className={`sidebar-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
            title="Home Dashboard"
          >
            <div className="nav-item-left">
              <Sparkles size={16} />
              <span className="nav-item-label">Home</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'scratchpad' ? 'active' : ''}`}
            onClick={() => setActiveView('scratchpad')}
            title="Scratchpad"
          >
            <div className="nav-item-left">
              <FileText size={16} />
              <span className="nav-item-label">Scratchpad</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveView('tasks')}
            title="Tasks"
          >
            <div className="nav-item-left">
              <CheckSquare size={16} />
              <span className="nav-item-label">Tasks</span>
            </div>
            {pendingTasksCount > 0 && (
              <span className="nav-item-badge">{pendingTasksCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'projects' || activeView === 'project-detail' ? 'active' : ''}`}
            onClick={() => setActiveView('projects')}
            title="Projects"
          >
            <div className="nav-item-left">
              <FolderKanban size={16} />
              <span className="nav-item-label">Projects</span>
            </div>
            {projectsCount > 0 && (
              <span className="nav-item-badge">{projectsCount}</span>
            )}
          </button>
        </div>

        {/* TOOLS SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Tools</div>

          <button
            className={`sidebar-nav-item ${activeView === 'all-tools' || activeView === 'tool' ? 'active' : ''}`}
            onClick={() => setActiveView('all-tools')}
            title="All Tools"
          >
            <div className="nav-item-left">
              <Wrench size={16} />
              <span className="nav-item-label">All Tools</span>
            </div>
            <span className="nav-item-badge">{TOOLS_REGISTRY.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveView('favorites')}
            title="Favorites"
          >
            <div className="nav-item-left">
              <Star size={16} />
              <span className="nav-item-label">Favorites</span>
            </div>
            {favoritesCount > 0 && (
              <span className="nav-item-badge">{favoritesCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveView('recent')}
            title="Recent History"
          >
            <div className="nav-item-left">
              <Clock size={16} />
              <span className="nav-item-label">Recent</span>
            </div>
          </button>
        </div>

        {/* LIBRARY SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Library</div>

          <button
            className={`sidebar-nav-item ${activeView === 'snippets' ? 'active' : ''}`}
            onClick={() => setActiveView('snippets')}
            title="Snippets"
          >
            <div className="nav-item-left">
              <Code2 size={16} />
              <span className="nav-item-label">Snippets</span>
            </div>
            {snippetsCount > 0 && (
              <span className="nav-item-badge">{snippetsCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* FOOTER SECTION: Settings, Keyboard Shortcuts, Privacy */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
          title="Settings"
        >
          <div className="nav-item-left">
            <Settings size={16} />
            <span className="nav-item-label">Settings</span>
          </div>
        </button>

        <button
          className="sidebar-nav-item"
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard Shortcuts"
        >
          <div className="nav-item-left">
            <Keyboard size={16} />
            <span className="nav-item-label">Shortcuts</span>
          </div>
        </button>

        <button
          className="sidebar-nav-item"
          onClick={() => setIsPrivacyModalOpen(true)}
          title="Privacy Policy"
        >
          <div className="nav-item-left">
            <Shield size={16} />
            <span className="nav-item-label">Privacy</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
