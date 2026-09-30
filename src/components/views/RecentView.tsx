import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import { Clock, Trash2, Sparkles, Code2, FolderKanban, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const RecentView: React.FC = () => {
  const { data, clearHistory, setActiveView, recordHistory } = useWorkspace();
  const { showToast } = useToast();

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const handleOpenItem = (item: (typeof data.history)[0]) => {
    if (item.type === 'tool') {
      const tool = TOOLS_REGISTRY.find((t) => t.id === item.targetId);
      if (tool) recordHistory('tool', tool.id, tool.name, tool.description);
      setActiveView('tool', { toolId: item.targetId });
    } else if (item.type === 'snippet') {
      setActiveView('snippets');
    } else if (item.type === 'project') {
      setActiveView('project-detail', { projectId: item.targetId });
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    showToast('Recent history cleared', 'info', 1500);
  };

  return (
    <div className="workspace-page">
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} style={{ color: 'var(--warning)' }} />
            <h1 className="page-title">Recent History</h1>
          </div>
          <p className="page-subtitle">
            Local activity log of tools, snippets, and workspaces you visited recently.
          </p>
        </div>

        <div className="page-actions">
          {data.history.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleClearHistory}>
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <span>
          <strong>Privacy Guaranteed:</strong> DevDesk stores only lightweight metadata (item name, type, and timestamp). Tool inputs, credentials, tokens, and code contents are never stored in history.
        </span>
      </div>

      {/* History List */}
      <div className="tool-panel">
        <div className="tool-panel-header">
          <span>Recent Activity ({data.history.length} items)</span>
        </div>

        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.history.length > 0 ? (
            data.history.map((item) => (
              <div
                key={item.id}
                className="recent-mini-item"
                onClick={() => handleOpenItem(item)}
                style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="recent-mini-left" style={{ gap: 12 }}>
                  {item.type === 'tool' && (
                    <div style={{ color: 'var(--accent)' }}>
                      <Sparkles size={16} />
                    </div>
                  )}
                  {item.type === 'snippet' && (
                    <div style={{ color: 'var(--cat-snippet)' }}>
                      <Code2 size={16} />
                    </div>
                  )}
                  {item.type === 'project' && (
                    <div style={{ color: 'var(--cat-project)' }}>
                      <FolderKanban size={16} />
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 550, fontSize: 13, color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-input)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {item.type}
                  </span>
                  <span className="recent-mini-time">{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No history recorded yet. As you use tools and navigate workspaces, your visits will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
