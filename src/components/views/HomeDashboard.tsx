import React, { useState } from 'react';
import { useWorkspace } from '@/hooks';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import {
  Sparkles,
  Star,
  CheckCircle2,
  FileEdit,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Plus,
  FolderKanban,
  Code2,
  Zap,
  Braces,
  Terminal,
  GitBranch,
  Compass,
} from 'lucide-react';
import { useToast } from '@/hooks';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export const HomeDashboard: React.FC = () => {
  const {
    data,
    setActiveView,
    toggleTaskStatus,
    isToolFavorite,
    toggleFavoriteTool,
    recordHistory,
  } = useWorkspace();
  const { showToast } = useToast();

  const [today] = useState(() =>
    new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  );

  const incompleteTasks = data.tasks.filter((t) => t.status !== 'done');
  const doneCount = data.tasks.length - incompleteTasks.length;
  const donePct = data.tasks.length ? Math.round((doneCount / data.tasks.length) * 100) : 0;
  const activeProjects = data.projects.filter((p) => p.status === 'active').length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const nextTask = [...incompleteTasks].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])[0];

  const quickTools = TOOLS_REGISTRY.slice(0, 8);

  const stats = [
    { label: 'Pending tasks', value: incompleteTasks.length, icon: CheckCircle2, tone: 'accent', view: 'tasks' },
    { label: 'Active projects', value: activeProjects, icon: FolderKanban, tone: 'info', view: 'projects' },
    { label: 'Saved snippets', value: data.snippets.length, icon: Code2, tone: 'success', view: 'snippets' },
    { label: 'Favorites', value: data.favorites.length, icon: Star, tone: 'warning', view: 'favorites' },
  ] as const;

  const handleOpenTool = (toolId: string) => {
    const tool = TOOLS_REGISTRY.find((t) => t.id === toolId);
    if (tool) {
      recordHistory('tool', tool.id, tool.name, tool.description);
    }
    setActiveView('tool', { toolId });
  };

  const handleNewTask = () => {
    setActiveView('tasks');
    setTimeout(() => {
      document.getElementById('quick-task-input')?.focus();
    }, 80);
  };


  const historyIcon = { tool: Sparkles, snippet: Code2, project: FolderKanban } as const;

  return (
    <div className="workspace-page">
      <div className="bento">
        {/* Hero */}
        <section className="dashboard-hero bento-hero">
          <div>
            <p className="hero-eyebrow">
              <span className="hero-dot" />
              {today}
            </p>
            <h1 className="greeting-text">
              {getGreeting()}{' '}
              <span className="hero-wave" aria-hidden="true">
                👋
              </span>
            </h1>
            <p className="greeting-sub">
              {incompleteTasks.length > 0
                ? `${plural(incompleteTasks.length, 'task')} waiting · ${plural(activeProjects, 'active project')}`
                : 'All caught up. Pick a tool and ship something.'}
            </p>
            {nextTask && (
              <button className="hero-next" onClick={() => setActiveView('tasks')}>
                <span className="hero-next-label">Up next</span>
                <span className="hero-next-title">{nextTask.title}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="hero-art" aria-hidden="true">
            <span className="hero-chip hero-chip-1">
              <Braces size={20} />
            </span>
            <span className="hero-chip hero-chip-2">
              <Terminal size={18} />
            </span>
            <span className="hero-chip hero-chip-3">
              <GitBranch size={18} />
            </span>
          </div>

          <div className="hero-actions">
            <button className="hero-btn hero-btn-primary" onClick={handleNewTask}>
              <Plus size={15} />
              <span>New task</span>
            </button>
            <button className="hero-btn hero-btn-ghost" onClick={() => setActiveView('scratchpad')}>
              <FileEdit size={15} />
              <span>Scratchpad</span>
            </button>
            <button
              className="hero-btn hero-btn-ghost"
              onClick={() => setActiveView('docs')}
              title="Explore full app documentation and tutorial"
            >
              <Compass size={15} />
              <span>App Guide & Tour</span>
            </button>
          </div>
        </section>

        {/* Stats */}
        <div className="bento-stats">
          {stats.map(({ label, value, icon: Icon, tone, view }) => (
            <button key={label} className={`stat-tile tone-${tone}`} onClick={() => setActiveView(view)}>
              <span className="stat-icon">
                <Icon size={18} />
              </span>
              <ArrowUpRight size={16} className="stat-arrow" />
              <span>
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Quick launch */}
        <section className="bento-wide">
          <div className="section-header-compact">
            <h2 className="section-title-compact">
              <Zap size={16} />
              Launchpad
            </h2>
            <button className="btn btn-subtle btn-sm" onClick={() => setActiveView('all-tools')}>
              <span>All {TOOLS_REGISTRY.length} tools</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="quick-tools-grid">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              const isFav = isToolFavorite(tool.id);

              return (
                <div key={tool.id} className="quick-tool-wrap">
                  <button className="quick-tool-card" onClick={() => handleOpenTool(tool.id)}>
                    <span className="quick-tool-info">
                      <span className="quick-tool-icon">
                        <Icon size={18} />
                      </span>
                      <span className="quick-tool-text">
                        <span className="quick-tool-name">{tool.name}</span>
                        <span className="quick-tool-meta">{tool.category}</span>
                      </span>
                    </span>
                  </button>

                  <button
                    className={`btn-icon pin-tool-btn ${isFav ? 'pinned' : ''}`}
                    onClick={() => {
                      toggleFavoriteTool(tool.id, tool.name, tool.description);
                      showToast(isFav ? 'Removed from favorites' : 'Pinned to favorites', 'info', 1500);
                    }}
                    title={isFav ? 'Unpin tool' : 'Pin tool'}
                    aria-label={isFav ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
                    aria-pressed={isFav}
                  >
                    <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tasks */}
        <section className="dashboard-panel bento-half">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">
              <span className="panel-icon tone-accent">
                <CheckCircle2 size={16} />
              </span>
              Tasks
            </h2>
            <button className="btn btn-subtle btn-sm" onClick={() => setActiveView('tasks')}>
              <span>View all</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {data.tasks.length > 0 && (
            <div className="panel-progress">
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={donePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tasks completed"
              >
                <span className="progress-fill" style={{ width: `${donePct}%` }} />
              </div>
              <span className="progress-label">
                {doneCount}/{data.tasks.length} done
              </span>
            </div>
          )}

          <div className="dashboard-panel-body">
            {incompleteTasks.length > 0 ? (
              incompleteTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="dash-task-item">
                  <button
                    className="task-checkbox-circle"
                    role="checkbox"
                    aria-checked={false}
                    aria-label={`Mark "${task.title}" as done`}
                    title="Mark as done"
                    onClick={() => {
                      toggleTaskStatus(task.id);
                      showToast('Task completed', 'success', 1500);
                    }}
                  />
                  <span className="dash-task-title">{task.title}</span>
                  {task.priority === 'high' && <span className="priority-tag priority-high">High</span>}
                </div>
              ))
            ) : (
              <div className="panel-empty">
                <span>{data.tasks.length === 0 ? 'No tasks yet.' : 'All caught up! No pending tasks.'}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleNewTask}>
                  <Plus size={13} />
                  <span>Add a task</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Scratchpad */}
        <section className="dashboard-panel bento-quarter">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">
              <span className="panel-icon tone-info">
                <FileEdit size={16} />
              </span>
              Scratchpad
            </h2>
            <button className="btn btn-subtle btn-sm" onClick={() => setActiveView('scratchpad')}>
              <span>Open</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="dashboard-panel-body">
            <button
              className="scratchpad-preview-box"
              onClick={() => setActiveView('scratchpad')}
              title="Open the full Scratchpad editor"
            >
              {data.scratchpad.content
                ? data.scratchpad.content.slice(0, 320)
                : 'Scratchpad is empty. Click to jot down quick notes, commands, or thoughts.'}
            </button>
          </div>
        </section>

        {/* Recent */}
        <section className="dashboard-panel bento-quarter">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">
              <span className="panel-icon tone-warning">
                <Clock size={16} />
              </span>
              Recent
            </h2>
            <button className="btn btn-subtle btn-sm" onClick={() => setActiveView('recent')}>
              <span>History</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="dashboard-panel-body">
            {data.history.length > 0 ? (
              data.history.slice(0, 5).map((item) => {
                const Icon = historyIcon[item.type];
                return (
                  <button
                    key={item.id}
                    className="recent-mini-item"
                    onClick={() => {
                      if (item.type === 'tool') handleOpenTool(item.targetId);
                      else if (item.type === 'snippet') setActiveView('snippets');
                      else if (item.type === 'project') setActiveView('project-detail', { projectId: item.targetId });
                    }}
                  >
                    <span className="recent-mini-left">
                      <span className={`recent-icon tone-${item.type}`}>
                        <Icon size={14} />
                      </span>
                      <span className="recent-mini-title">{item.title}</span>
                    </span>
                    <span className="recent-mini-time">{formatRelativeTime(item.timestamp)}</span>
                  </button>
                );
              })
            ) : (
              <div className="panel-empty">No recent activity recorded yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
