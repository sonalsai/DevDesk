import React, { useState } from 'react';
import { useWorkspace } from '@/hooks';
import type { Project, ProjectLink } from '../../types';
import { generateUniqueId } from '../../utils/date';
import {
  FolderKanban,
  Plus,
  Star,
  ExternalLink,
  CheckCircle2,
  Code2,
  FileText,
  Trash2,
  Edit2,
  ArrowLeft,
  Link as LinkIcon,
  Send,
  Layers,
  Folder,
} from 'lucide-react';
import { useToast } from '@/hooks';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const ProjectsView: React.FC = () => {
  const {
    data,
    activeView,
    selectedProjectId,
    setActiveView,
    addProject,
    updateProject,
    deleteProject,
    toggleFavoriteProject,
    toggleTaskStatus,
    openRequestInTab,
    addCollection,
  } = useWorkspace();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [color, setColor] = useState<string>('#4750DD');
  const [status, setStatus] = useState<Project['status']>('active');

  // Detail view notes editing
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  // Link adding in detail
  const [newLinkLabel, setNewLinkLabel] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');

  const currentProject = selectedProjectId
    ? data.projects.find((p) => p.id === selectedProjectId)
    : null;

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDesc('');
    setColor('#4750DD');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name);
    setDesc(proj.description);
    setColor(proj.color);
    setStatus(proj.status);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!name.trim()) {
      showToast('Project name is required', 'error', 2000);
      return;
    }

    if (editingProject) {
      updateProject(editingProject.id, {
        name: name.trim(),
        description: desc.trim(),
        color,
        status,
      });
      showToast('Project updated', 'success', 1500);
    } else {
      const p = addProject({
        name: name.trim(),
        description: desc.trim(),
        color,
        status,
        isFavorite: false,
        links: [],
        notes: '',
      });
      showToast('Project created', 'success', 1500);
      setActiveView('project-detail', { projectId: p.id });
    }

    setIsModalOpen(false);
  };

  const handleAddLink = () => {
    if (!currentProject || !newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const newLink: ProjectLink = {
      id: generateUniqueId('link'),
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
    };
    updateProject(currentProject.id, {
      links: [...currentProject.links, newLink],
    });
    setNewLinkLabel('');
    setNewLinkUrl('');
    showToast('Link added', 'success', 1500);
  };

  const handleRemoveLink = (linkId: string) => {
    if (!currentProject) return;
    updateProject(currentProject.id, {
      links: currentProject.links.filter((l) => l.id !== linkId),
    });
    showToast('Link removed', 'info', 1500);
  };

  const handleSaveNotes = () => {
    if (!currentProject) return;
    updateProject(currentProject.id, { notes: notesDraft });
    setIsEditingNotes(false);
    showToast('Project notes saved', 'success', 1500);
  };

  if (activeView === 'project-detail' && currentProject) {
    const projectTasks = data.tasks.filter((t) => t.projectId === currentProject.id);
    const projectSnippets = data.snippets.filter((s) => s.projectId === currentProject.id);
    const projectCollections = (data.apiCollections || []).filter((c) => c.projectId === currentProject.id);
    const projectEnvironments = (data.environments || []).filter((e) => e.projectId === currentProject.id);

    return (
      <div className="workspace-page">
        {/* Back and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveView('projects')}
          >
            <ArrowLeft size={13} />
            <span>All Projects</span>
          </button>
        </div>

        <div className="page-header-row">
          <div className="page-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: currentProject.color,
                }}
              />
              <h1 className="page-title">{currentProject.name}</h1>
              <button
                className={`btn-icon pin-tool-btn ${currentProject.isFavorite ? 'pinned' : ''}`}
                onClick={() => toggleFavoriteProject(currentProject.id)}
              >
                <Star size={16} fill={currentProject.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="page-subtitle">{currentProject.description}</p>
          </div>

          <div className="page-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => openEditModal(currentProject)}
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => {
                deleteProject(currentProject.id);
                setActiveView('projects');
                showToast('Project deleted', 'info', 1500);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* 2-Column Content: Tasks & Snippets, Notes & Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          {/* Left Column: Tasks and Snippets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Project Tasks */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                  Tasks ({projectTasks.length})
                </span>
                <button
                  className="btn btn-subtle btn-sm"
                  onClick={() => setActiveView('tasks')}
                >
                  <Plus size={12} />
                  <span>Add Task</span>
                </button>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projectTasks.length > 0 ? (
                  projectTasks.map((t) => (
                    <div
                      key={t.id}
                      className="dash-task-item"
                      onClick={() => toggleTaskStatus(t.id)}
                    >
                      <div
                        className={`task-checkbox-circle ${t.status === 'done' ? 'checked' : ''}`}
                      >
                        {t.status === 'done' && <CheckCircle2 size={11} />}
                      </div>
                      <span className="dash-task-title">{t.title}</span>
                      <span className={`priority-tag priority-${t.priority}`}>{t.priority}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                    No tasks assigned to this project yet.
                  </div>
                )}
              </div>
            </div>

            {/* Project Snippets */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={14} style={{ color: 'var(--accent)' }} />
                  Code Snippets ({projectSnippets.length})
                </span>
                <button
                  className="btn btn-subtle btn-sm"
                  onClick={() => setActiveView('snippets')}
                >
                  <Plus size={12} />
                  <span>Add Snippet</span>
                </button>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projectSnippets.length > 0 ? (
                  projectSnippets.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent)' }}>{s.language}</div>
                      </div>
                      <button
                        className="btn btn-subtle btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(s.code);
                          showToast('Copied code', 'success', 1500);
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                    No snippets linked to this project yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Project Notes & Useful Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Project Notes */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} style={{ color: 'var(--warning)' }} />
                  Project Notes & Documentation
                </span>
                {isEditingNotes ? (
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>
                    Save Notes
                  </button>
                ) : (
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() => {
                      setNotesDraft(currentProject.notes || '');
                      setIsEditingNotes(true);
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div style={{ padding: '14px' }}>
                {isEditingNotes ? (
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Write project notes, architecture details, deployment links..."
                    style={{
                      width: '100%',
                      minHeight: '140px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12.5,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                    }}
                  >
                    {currentProject.notes || 'No project notes written yet. Click Edit to add notes.'}
                  </div>
                )}
              </div>
            </div>

            {/* Useful Links */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LinkIcon size={14} style={{ color: 'var(--cat-link)' }} />
                  Project Links ({currentProject.links.length})
                </span>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentProject.links.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                    }}
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>{link.label}</span>
                    </a>

                    <button
                      className="btn btn-subtle btn-sm btn-icon"
                      onClick={() => handleRemoveLink(link.id)}
                      title="Remove link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Add Link Form */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    placeholder="Link name (e.g. Docs)"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    style={{ flex: 1, fontSize: 11.5 }}
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    style={{ flex: 1.5, fontSize: 11.5 }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddLink}
                    disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2: API & Environment Integrations for Project */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          {/* API Collections */}
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} style={{ color: 'var(--accent-hover)' }} />
                API Collections ({projectCollections.length})
              </span>
              <button
                className="btn btn-subtle btn-sm"
                onClick={() => {
                  addCollection({
                    name: `${currentProject.name} API`,
                    projectId: currentProject.id,
                    description: `API endpoints for ${currentProject.name}`,
                    isFavorite: false,
                  });
                  setActiveView('collections');
                  showToast('Created API collection for project', 'success', 1500);
                }}
              >
                <Plus size={12} />
                <span>New Collection</span>
              </button>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projectCollections.length > 0 ? (
                projectCollections.map((coll) => (
                  <div
                    key={coll.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Folder size={13} style={{ color: 'var(--accent-hover)' }} />
                        <span>{coll.name}</span>
                      </div>
                      <button
                        className="btn btn-subtle btn-sm"
                        onClick={() => setActiveView('collections')}
                      >
                        Manage
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {data.apiRequests.filter((r) => r.collectionId === coll.id).map((r) => (
                        <div
                          key={r.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-surface)',
                            fontSize: 11,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 9.5, color: r.method === 'GET' ? 'var(--success)' : 'var(--accent-hover)' }}>
                              {r.method}
                            </span>
                            <span>{r.name}</span>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: 10 }}
                            onClick={() => {
                              openRequestInTab(r);
                              setActiveView('api-client');
                            }}
                          >
                            Open in Client
                          </button>
                        </div>
                      ))}
                      {data.apiRequests.filter((r) => r.collectionId === coll.id).length === 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          No endpoints yet. Click Manage to add requests.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                  No API collections assigned to this project.
                </div>
              )}
            </div>
          </div>

          {/* Project Environments */}
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} style={{ color: 'var(--info)' }} />
                Project Environments ({projectEnvironments.length})
              </span>
              <button
                className="btn btn-subtle btn-sm"
                onClick={() => setActiveView('environments')}
              >
                <Plus size={12} />
                <span>Configure</span>
              </button>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projectEnvironments.length > 0 ? (
                projectEnvironments.map((env) => (
                  <div
                    key={env.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{env.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {env.variables.length} environment variables
                      </div>
                    </div>
                    <button
                      className="btn btn-subtle btn-sm"
                      onClick={() => setActiveView('environments')}
                    >
                      View Vars
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                  No environments linked to this project yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Projects List View
  return (
    <div className="workspace-page">
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderKanban size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">Projects</h1>
          </div>
          <p className="page-subtitle">
            Lightweight project workspaces grouping tasks, notes, snippets, and links.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={14} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {data.projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Group related tasks, snippets, notes and links into a project workspace."
          actionLabel="Create your first project"
          onAction={openCreateModal}
        />
      )}

      <div className="projects-grid">
        {data.projects.map((proj) => {
          const taskCount = data.tasks.filter((t) => t.projectId === proj.id).length;
          const snippetCount = data.snippets.filter((s) => s.projectId === proj.id).length;
          const apiCount = (data.apiCollections || []).filter((c) => c.projectId === proj.id).length;

          return (
            <div
              key={proj.id}
              className="project-card"
              onClick={() => setActiveView('project-detail', { projectId: proj.id })}
            >
              <div className="project-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className="project-color-badge"
                    style={{ backgroundColor: proj.color }}
                  />
                  <h2 className="project-card-title">{proj.name}</h2>
                </div>

                <button
                  className={`btn-icon pin-tool-btn ${proj.isFavorite ? 'pinned' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteProject(proj.id);
                  }}
                  title={proj.isFavorite ? 'Unfavorite project' : 'Favorite project'}
                >
                  <Star size={14} fill={proj.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <p className="project-card-desc">{proj.description}</p>

              <div className="project-counts-row">
                <span>{taskCount} tasks</span>
                <span>•</span>
                <span>{snippetCount} snippets</span>
                <span>•</span>
                <span>{apiCount} APIs</span>
                <span>•</span>
                <span>{proj.links.length} links</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New / Edit Project Modal */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingProject ? 'Edit Project' : 'New Project'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveModal}>
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Project Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Payment Service API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Description:
              </label>
              <textarea
                placeholder="High level overview of what this project does..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                style={{ width: '100%', minHeight: '60px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Color Badge:
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: 36, height: 32, padding: 2, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Status:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Project['status'])}
                  style={{ width: '100%' }}
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
