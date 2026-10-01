import React from 'react';
import { useWorkspace } from '@/hooks';
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
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
              <Home size={16} />
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

        {/* API DEVELOPMENT SECTION */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">API Development</div>

          <button
            className={`sidebar-nav-item ${activeView === 'api-client' ? 'active' : ''}`}
            onClick={() => setActiveView('api-client')}
            title="REST API Client"
          >
            <div className="nav-item-left">
              <Send size={15} />
              <span className="nav-item-label">API Client</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'graphql' ? 'active' : ''}`}
            onClick={() => setActiveView('graphql')}
            title="GraphQL Explorer & Schema Introspection"
          >
            <div className="nav-item-left">
              <Layers size={15} style={{ color: '#e6009e' }} />
              <span className="nav-item-label">GraphQL</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'websocket' ? 'active' : ''}`}
            onClick={() => setActiveView('websocket')}
            title="WebSocket Client"
          >
            <div className="nav-item-left">
              <Radio size={15} style={{ color: '#9b59b6' }} />
              <span className="nav-item-label">WebSocket</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'sse' ? 'active' : ''}`}
            onClick={() => setActiveView('sse')}
            title="Server-Sent Events (SSE) Client"
          >
            <div className="nav-item-left">
              <Activity size={15} style={{ color: 'var(--success)' }} />
              <span className="nav-item-label">SSE</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveView('collections')}
            title="API Collections & History"
          >
            <div className="nav-item-left">
              <FolderKanban size={15} />
              <span className="nav-item-label">Collections</span>
            </div>
            {data.apiCollections?.length > 0 && (
              <span className="nav-item-badge">{data.apiCollections.length}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveView('environments')}
            title="Environments & Variables"
          >
            <div className="nav-item-left">
              <Layers size={15} />
              <span className="nav-item-label">Environments</span>
            </div>
            {data.environments?.length > 0 && (
              <span className="nav-item-badge">{data.environments.length}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'mock-server' ? 'active' : ''}`}
            onClick={() => setActiveView('mock-server')}
            title="Local Mock Server"
          >
            <div className="nav-item-left">
              <Server size={15} style={{ color: 'var(--accent)' }} />
              <span className="nav-item-label">Mock Server</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'openapi-explorer' ? 'active' : ''}`}
            onClick={() => setActiveView('openapi-explorer')}
            title="OpenAPI & Swagger Explorer"
          >
            <div className="nav-item-left">
              <BookOpen size={15} style={{ color: 'var(--accent)' }} />
              <span className="nav-item-label">OpenAPI</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveView('webhooks')}
            title="Webhook Inspector"
          >
            <div className="nav-item-left">
              <Webhook size={15} />
              <span className="nav-item-label">Webhooks</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${activeView === 'http-inspector' ? 'active' : ''}`}
            onClick={() => setActiveView('http-inspector')}
            title="HTTP & Header Inspector"
          >
            <div className="nav-item-left">
              <Globe size={15} />
              <span className="nav-item-label">HTTP Inspector</span>
            </div>
          </button>
        </div>
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
    </aside>
  );
};
