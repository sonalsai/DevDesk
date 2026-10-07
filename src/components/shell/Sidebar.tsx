import React from 'react';
import { useWorkspace, useTranslation } from '@/hooks';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  FileText,
  CheckSquare,
  FolderKanban,
  Wrench,
  Star,
  Clock,
  Code2,
  Send,
  Globe,
  Layers,
  Webhook,
  Radio,
  Activity,
  Server,
  BookOpen,
  GitBranch,
  Terminal,
  ScrollText,
  FileCode,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    data,
    activeGitRepo,
  } = useWorkspace();
  const { t } = useTranslation();

  const pendingTasksCount = data.tasks.filter((t) => t.status !== 'done').length;
  const snippetsCount = data.snippets.length;
  const favoritesCount = data.favorites.length;
  const projectsCount = data.projects.length;
  const gitChangesCount = activeGitRepo?.changes.length || 0;

  return (
    <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Sidebar navigation">
      <div className="sidebar-brand">
        <button
          className="brand-toggle-btn"
          onClick={() => setActiveView('dashboard')}
          title="Return to Home Dashboard"
          aria-label="Return to Home Dashboard"
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
            title={t('nav.home')}
            aria-label={t('nav.home')}
          >
            <div className="nav-item-left">
              <Home size={16} />
              <span className="nav-item-label">{t('nav.home')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'scratchpad' ? 'active' : ''}`}
            onClick={() => setActiveView('scratchpad')}
            title={t('nav.scratchpad')}
            aria-label={t('nav.scratchpad')}
          >
            <div className="nav-item-left">
              <FileText size={16} />
              <span className="nav-item-label">{t('nav.scratchpad')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveView('tasks')}
            title={t('nav.tasks')}
            aria-label={t('nav.tasks')}
          >
            <div className="nav-item-left">
              <CheckSquare size={16} />
              <span className="nav-item-label">{t('nav.tasks')}</span>
            </div>
            {pendingTasksCount > 0 && (
              <span className="nav-item-badge">{pendingTasksCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'projects' || activeView === 'project-detail' ? 'active' : ''}`}
            onClick={() => setActiveView('projects')}
            title={t('nav.projects')}
            aria-label={t('nav.projects')}
          >
            <div className="nav-item-left">
              <FolderKanban size={16} />
              <span className="nav-item-label">{t('nav.projects')}</span>
            </div>
            {projectsCount > 0 && (
              <span className="nav-item-badge">{projectsCount}</span>
            )}
          </button>
        </div>

        {/* API DEVELOPMENT SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">API Development</div>

          <button
            className={`sidebar-nav-item ${activeView === 'api-client' ? 'active' : ''}`}
            onClick={() => setActiveView('api-client')}
            title={t('nav.apiClient')}
            aria-label={t('nav.apiClient')}
          >
            <div className="nav-item-left">
              <Send size={15} />
              <span className="nav-item-label">{t('nav.apiClient')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'graphql' ? 'active' : ''}`}
            onClick={() => setActiveView('graphql')}
            title={t('nav.graphql')}
            aria-label={t('nav.graphql')}
          >
            <div className="nav-item-left">
              <Layers size={15} style={{ color: '#e6009e' }} />
              <span className="nav-item-label">{t('nav.graphql')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'websocket' ? 'active' : ''}`}
            onClick={() => setActiveView('websocket')}
            title={t('nav.websocket')}
            aria-label={t('nav.websocket')}
          >
            <div className="nav-item-left">
              <Radio size={15} style={{ color: '#9b59b6' }} />
              <span className="nav-item-label">{t('nav.websocket')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'sse' ? 'active' : ''}`}
            onClick={() => setActiveView('sse')}
            title={t('nav.sse')}
            aria-label={t('nav.sse')}
          >
            <div className="nav-item-left">
              <Activity size={15} style={{ color: 'var(--success)' }} />
              <span className="nav-item-label">{t('nav.sse')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveView('collections')}
            title={t('nav.collections')}
            aria-label={t('nav.collections')}
          >
            <div className="nav-item-left">
              <FolderKanban size={15} />
              <span className="nav-item-label">{t('nav.collections')}</span>
            </div>
            {data.apiCollections?.length > 0 && (
              <span className="nav-item-badge">{data.apiCollections.length}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveView('environments')}
            title={t('nav.environments')}
            aria-label={t('nav.environments')}
          >
            <div className="nav-item-left">
              <Layers size={15} />
              <span className="nav-item-label">{t('nav.environments')}</span>
            </div>
            {data.environments?.length > 0 && (
              <span className="nav-item-badge">{data.environments.length}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'mock-server' ? 'active' : ''}`}
            onClick={() => setActiveView('mock-server')}
            title={t('nav.mockServer')}
            aria-label={t('nav.mockServer')}
          >
            <div className="nav-item-left">
              <Server size={15} style={{ color: 'var(--accent)' }} />
              <span className="nav-item-label">{t('nav.mockServer')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'openapi-explorer' ? 'active' : ''}`}
            onClick={() => setActiveView('openapi-explorer')}
            title={t('nav.openapi')}
            aria-label={t('nav.openapi')}
          >
            <div className="nav-item-left">
              <BookOpen size={15} style={{ color: 'var(--accent)' }} />
              <span className="nav-item-label">{t('nav.openapi')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveView('webhooks')}
            title={t('nav.webhooks')}
            aria-label={t('nav.webhooks')}
          >
            <div className="nav-item-left">
              <Webhook size={15} />
              <span className="nav-item-label">{t('nav.webhooks')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'http-inspector' ? 'active' : ''}`}
            onClick={() => setActiveView('http-inspector')}
            title={t('nav.httpInspector')}
            aria-label={t('nav.httpInspector')}
          >
            <div className="nav-item-left">
              <Globe size={15} />
              <span className="nav-item-label">{t('nav.httpInspector')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'git' ? 'active' : ''}`}
            onClick={() => setActiveView('git')}
            title={t('nav.git')}
            aria-label={t('nav.git')}
          >
            <div className="nav-item-left">
              <GitBranch size={15} style={{ color: '#f34f29' }} />
              <span className="nav-item-label">{t('nav.git')}</span>
            </div>
            {gitChangesCount > 0 && (
              <span className="nav-item-badge">{gitChangesCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'ssh' ? 'active' : ''}`}
            onClick={() => setActiveView('ssh')}
            title={t('nav.ssh')}
            aria-label={t('nav.ssh')}
          >
            <div className="nav-item-left">
              <Terminal size={15} style={{ color: '#38bdf8' }} />
              <span className="nav-item-label">{t('nav.ssh')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveView('logs')}
            title={t('nav.logs')}
            aria-label={t('nav.logs')}
          >
            <div className="nav-item-left">
              <ScrollText size={15} style={{ color: '#a78bfa' }} />
              <span className="nav-item-label">{t('nav.logs')}</span>
            </div>
          </button>
        </div>

        {/* TOOLS SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Tools</div>

          <button
            className={`sidebar-nav-item ${activeView === 'all-tools' || activeView === 'tool' ? 'active' : ''}`}
            onClick={() => setActiveView('all-tools')}
            title={t('nav.allTools')}
            aria-label={t('nav.allTools')}
          >
            <div className="nav-item-left">
              <Wrench size={16} />
              <span className="nav-item-label">{t('nav.allTools')}</span>
            </div>
            <span className="nav-item-badge">{TOOLS_REGISTRY.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'yaml-toolkit' ? 'active' : ''}`}
            onClick={() => setActiveView('yaml-toolkit')}
            title={t('nav.yamlToolkit')}
            aria-label={t('nav.yamlToolkit')}
          >
            <div className="nav-item-left">
              <FileCode size={16} style={{ color: '#f59e0b' }} />
              <span className="nav-item-label">{t('nav.yamlToolkit')}</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveView('favorites')}
            title={t('nav.favorites')}
            aria-label={t('nav.favorites')}
          >
            <div className="nav-item-left">
              <Star size={16} />
              <span className="nav-item-label">{t('nav.favorites')}</span>
            </div>
            {favoritesCount > 0 && (
              <span className="nav-item-badge">{favoritesCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveView('recent')}
            title={t('nav.recent')}
            aria-label={t('nav.recent')}
          >
            <div className="nav-item-left">
              <Clock size={16} />
              <span className="nav-item-label">{t('nav.recent')}</span>
            </div>
          </button>
        </div>

        {/* LIBRARY SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Library</div>

          <button
            className={`sidebar-nav-item ${activeView === 'snippets' ? 'active' : ''}`}
            onClick={() => setActiveView('snippets')}
            title={t('nav.snippets')}
            aria-label={t('nav.snippets')}
          >
            <div className="nav-item-left">
              <Code2 size={16} />
              <span className="nav-item-label">{t('nav.snippets')}</span>
            </div>
            {snippetsCount > 0 && (
              <span className="nav-item-badge">{snippetsCount}</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
