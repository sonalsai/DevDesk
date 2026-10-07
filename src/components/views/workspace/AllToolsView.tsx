import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks';
import { TOOLS_REGISTRY } from '@/registry/toolsRegistry';
import type { ToolCategory } from '@/types/tools';
import { Wrench, Search, Star, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks';

const CATEGORIES: Array<'All' | ToolCategory> = [
  'All',
  'Formatters & Parsers',
  'Encoding & Security',
  'Generators',
  'Inspectors & Helpers',
];

export const AllToolsView: React.FC = () => {
  const { setActiveView, isToolFavorite, toggleFavoriteTool, recordHistory } = useWorkspace();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ToolCategory>('All');

  const filteredTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((tool) => {
      if (selectedCategory !== 'All' && tool.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchKeywords) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleOpenTool = (tool: (typeof TOOLS_REGISTRY)[0]) => {
    recordHistory('tool', tool.id, tool.name, tool.description);
    setActiveView('tool', { toolId: tool.id });
  };

  return (
    <div className="workspace-page">
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">Developer Utilities ({TOOLS_REGISTRY.length})</h1>
          </div>
          <p className="page-subtitle">
            Curated daily developer utilities. Fast, local-first, zero telemetry.
          </p>
        </div>

        <div className="page-actions">
          <div style={{ position: 'relative', width: 260 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search tools or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ fontSize: 12 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="tools-grid">
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isFav = isToolFavorite(tool.id);

            return (
              <div key={tool.id} className="tool-card">
                <div className="tool-card-top">
                  <div className="tool-card-id">
                    <span className="quick-tool-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h2 className="tool-card-title">
                        <button className="tool-card-open" onClick={() => handleOpenTool(tool)}>
                          {tool.name}
                        </button>
                      </h2>
                      <span className="tool-card-cat">{tool.category}</span>
                    </div>
                  </div>

                  <button
                    className={`btn-icon pin-tool-btn ${isFav ? 'pinned' : ''}`}
                    onClick={() => {
                      toggleFavoriteTool(tool.id, tool.name, tool.description);
                      showToast(isFav ? 'Removed from favorites' : 'Added to favorites', 'info', 1500);
                    }}
                    title={isFav ? 'Unpin from favorites' : 'Pin to favorites'}
                    aria-label={isFav ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
                    aria-pressed={isFav}
                  >
                    <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <p className="tool-card-desc">{tool.description}</p>

                <div className="tool-card-footer">
                  <div className="tool-card-keywords">
                    {tool.keywords.slice(0, 3).map((kw) => (
                      <span key={kw}>{kw}</span>
                    ))}
                  </div>

                  <span className="tool-card-launch">
                    Launch <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="tools-empty">No developer tools found matching "{searchQuery}".</div>
        )}
      </div>
    </div>
  );
};
