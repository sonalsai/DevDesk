import React from 'react';
import { useWorkspace } from '@/hooks';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import { Star, Sparkles, Code2, FolderKanban } from 'lucide-react';
import { useToast } from '@/hooks';

export const FavoritesView: React.FC = () => {
  const { data, setActiveView, removeFavorite, recordHistory } = useWorkspace();
  const { showToast } = useToast();

  const toolFavorites = data.favorites.filter((f) => f.type === 'tool');
  const snippetFavorites = data.favorites.filter((f) => f.type === 'snippet');
  const projectFavorites = data.favorites.filter((f) => f.type === 'project');

  const handleOpenTool = (toolId: string) => {
    const tool = TOOLS_REGISTRY.find((t) => t.id === toolId);
    if (tool) {
      recordHistory('tool', tool.id, tool.name, tool.description);
    }
    setActiveView('tool', { toolId });
  };

  const handleOpenSnippet = (_snippetId: string) => {
    setActiveView('snippets');
  };

  const handleOpenProject = (projectId: string) => {
    setActiveView('project-detail', { projectId });
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(id);
    showToast('Removed from favorites', 'info', 1500);
  };

  return (
    <div className="workspace-page">
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} style={{ color: 'var(--warning)' }} />
            <h1 className="page-title">Favorites</h1>
          </div>
          <p className="page-subtitle">
            Unified collection of your pinned tools, snippets, and project workspaces.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Tools Section */}
        <div>
          <div className="section-header-compact">
            <span className="section-title-compact">
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              Favorite Tools ({toolFavorites.length})
            </span>
          </div>

          {toolFavorites.length > 0 ? (
            <div className="quick-tools-grid">
              {toolFavorites.map((fav) => {
                const tool = TOOLS_REGISTRY.find((t) => t.id === fav.targetId);
                const Icon = tool ? tool.icon : Sparkles;

                return (
                  <div
                    key={fav.id}
                    className="quick-tool-card"
                    onClick={() => handleOpenTool(fav.targetId)}
                  >
                    <div className="quick-tool-info">
                      <div className="quick-tool-icon">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="quick-tool-name">{fav.title}</div>
                        {fav.subtitle && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {fav.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn-icon pin-tool-btn pinned"
                      onClick={(e) => handleRemove(fav.id, e)}
                      title="Unpin from favorites"
                    >
                      <Star size={13} fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
              No favorite tools pinned yet. Star tools from the sidebar or tool pages.
            </div>
          )}
        </div>

        {/* Snippets Section */}
        <div>
          <div className="section-header-compact">
            <span className="section-title-compact">
              <Code2 size={14} style={{ color: 'var(--cat-snippet)' }} />
              Favorite Snippets ({snippetFavorites.length})
            </span>
          </div>

          {snippetFavorites.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {snippetFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className="quick-tool-card"
                  onClick={() => handleOpenSnippet(fav.targetId)}
                >
                  <div className="quick-tool-info">
                    <div style={{ color: 'var(--cat-snippet)' }}>
                      <Code2 size={18} />
                    </div>
                    <div>
                      <div className="quick-tool-name">{fav.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fav.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-icon pin-tool-btn pinned"
                    onClick={(e) => handleRemove(fav.id, e)}
                    title="Remove from favorites"
                  >
                    <Star size={13} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
              No favorite snippets saved yet.
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div>
          <div className="section-header-compact">
            <span className="section-title-compact">
              <FolderKanban size={14} style={{ color: 'var(--cat-project)' }} />
              Favorite Projects ({projectFavorites.length})
            </span>
          </div>

          {projectFavorites.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {projectFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className="quick-tool-card"
                  onClick={() => handleOpenProject(fav.targetId)}
                >
                  <div className="quick-tool-info">
                    <div style={{ color: 'var(--cat-project)' }}>
                      <FolderKanban size={18} />
                    </div>
                    <div>
                      <div className="quick-tool-name">{fav.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {fav.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-icon pin-tool-btn pinned"
                    onClick={(e) => handleRemove(fav.id, e)}
                    title="Remove from favorites"
                  >
                    <Star size={13} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
              No favorite projects pinned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
