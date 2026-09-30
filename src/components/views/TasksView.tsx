import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { Task, TaskPriority, TaskStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  Check,
  Calendar,
  Trash2,
  FolderKanban,
  Edit2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';

type FilterTab = 'today' | 'upcoming' | 'completed' | 'all';

export const TasksView: React.FC = () => {
  const { data, addTask, updateTask, deleteTask, toggleTaskStatus } = useWorkspace();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickDueDate, setQuickDueDate] = useState<string>('');
  const [quickProjectId, setQuickProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit Task modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => {
    return data.tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchTags = task.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      // Tab filter
      if (activeTab === 'today') {
        if (task.status === 'done') return false;
        // Either due today, overdue, or no due date set
        return !task.dueDate || task.dueDate <= todayStr;
      }
      if (activeTab === 'upcoming') {
        if (task.status === 'done') return false;
        return !!task.dueDate && task.dueDate > todayStr;
      }
      if (activeTab === 'completed') {
        return task.status === 'done';
      }
      // 'all'
      return true;
    });
  }, [data.tasks, activeTab, searchQuery, todayStr]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      status: 'todo',
      priority: quickPriority,
      dueDate: quickDueDate || undefined,
      projectId: quickProjectId || undefined,
      tags: [],
    });

    setQuickTitle('');
    showToast('Task created', 'success', 1500);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      dueDate: editingTask.dueDate || undefined,
      projectId: editingTask.projectId || undefined,
      tags: editingTask.tags,
    });
    setEditingTask(null);
    showToast('Task updated', 'success', 1500);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const p = data.projects.find((proj) => proj.id === projectId);
    return p ? p.name : null;
  };

  const counts = {
    today: data.tasks.filter((t) => t.status !== 'done' && (!t.dueDate || t.dueDate <= todayStr)).length,
    upcoming: data.tasks.filter((t) => t.status !== 'done' && !!t.dueDate && t.dueDate > todayStr).length,
    completed: data.tasks.filter((t) => t.status === 'done').length,
    all: data.tasks.length,
  };

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">Tasks</h1>
          </div>
          <p className="page-subtitle">
            Focused developer task tracker. Quick add with Enter or keyboard shortcut <strong>N</strong>.
          </p>
        </div>

        <div className="page-actions">
          <input
            type="text"
            placeholder="Search tasks or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 200, fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tasks-tabs-row">
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <span>Today</span>
          <span className="kbd-shortcut">{counts.today}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <span>Upcoming</span>
          <span className="kbd-shortcut">{counts.upcoming}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <span>Completed</span>
          <span className="kbd-shortcut">{counts.completed}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All</span>
          <span className="kbd-shortcut">{counts.all}</span>
        </button>
      </div>

      {/* Quick Add Bar without Modal (Press Enter to immediately add) */}
      <form onSubmit={handleQuickAdd} className="quick-add-task-bar">
        <Plus size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <input
          id="quick-task-input"
          type="text"
          className="quick-add-input"
          placeholder="Add a new task (e.g., Fix authentication bug)... Press Enter to save"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
            style={{ padding: '2px 6px', fontSize: 11.5 }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            value={quickDueDate}
            onChange={(e) => setQuickDueDate(e.target.value)}
            style={{ padding: '2px 6px', fontSize: 11.5 }}
            title="Due date"
          />

          {data.projects.length > 0 && (
            <select
              value={quickProjectId}
              onChange={(e) => setQuickProjectId(e.target.value)}
              style={{ padding: '2px 6px', fontSize: 11.5, maxWidth: 120 }}
            >
              <option value="">No Project</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button type="submit" className="btn btn-primary btn-sm" disabled={!quickTitle.trim()}>
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="task-list-box">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const projectName = getProjectName(task.projectId);
            const isDone = task.status === 'done';
            const isOverdue = !isDone && task.dueDate && task.dueDate < todayStr;

            return (
              <div key={task.id} className={`task-card ${isDone ? 'done' : ''}`}>
                <div className="task-card-left">
                  <button
                    className={`task-checkbox-circle ${isDone ? 'checked' : ''}`}
                    onClick={() => toggleTaskStatus(task.id)}
                    title={isDone ? 'Mark as todo' : 'Mark as done'}
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`${isDone ? 'Mark as todo' : 'Mark as done'}: ${task.title}`}
                  >
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="task-info-group">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta-line">
                      <span className={`priority-tag priority-${task.priority}`}>
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                            fontWeight: isOverdue ? 600 : 400,
                          }}
                        >
                          <Calendar size={11} />
                          {task.dueDate === todayStr ? 'Today' : task.dueDate}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}

                      {projectName && (
                        <span className="project-tag-pill">
                          <FolderKanban size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {projectName}
                        </span>
                      )}

                      {task.tags.map((tg) => (
                        <span key={tg} style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          #{tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-subtle btn-sm btn-icon"
                    onClick={() => setEditingTask(task)}
                    title="Edit task"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-subtle btn-sm btn-icon"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            No tasks found in this view.
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          title="Edit Task"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Task Title:
              </label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Description (optional):
              </label>
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                style={{ width: '100%', minHeight: '60px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Status:
                </label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                  style={{ width: '100%' }}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Priority:
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                  style={{ width: '100%' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Due Date:
                </label>
                <input
                  type="date"
                  value={editingTask.dueDate || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Project:
                </label>
                <select
                  value={editingTask.projectId || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, projectId: e.target.value || undefined })}
                  style={{ width: '100%' }}
                >
                  <option value="">None</option>
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
