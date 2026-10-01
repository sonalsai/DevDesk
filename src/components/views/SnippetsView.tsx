import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/hooks';
import type { Snippet } from '../../types';
import {
  Code2,
  Plus,
  Star,
  Copy,
  Check,
  Trash2,
  CopyPlus,
  Edit2,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks';
import { Modal } from '../common/Modal';

const POPULAR_LANGUAGES = [
  'All',
  'typescript',
  'javascript',
  'python',
  'sql',
  'bash',
  'html',
  'css',
  'json',
  'go',
  'rust',
];

export const SnippetsView: React.FC = () => {
  const {
    data,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    duplicateSnippet,
    toggleFavoriteSnippet,
  } = useWorkspace();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('All');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDesc, setModalDesc] = useState<string>('');
  const [modalCode, setModalCode] = useState<string>('');
  const [modalLang, setModalLang] = useState<string>('typescript');
  const [modalTags, setModalTags] = useState<string>('');
  const [modalProjectId, setModalProjectId] = useState<string>('');

  const filteredSnippets = useMemo(() => {
    return data.snippets.filter((s) => {
      if (onlyFavorites && !s.isFavorite) return false;
      if (selectedLang !== 'All' && s.language.toLowerCase() !== selectedLang.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCode && !matchTags) return false;
      }
      return true;
    });
  }, [data.snippets, selectedLang, onlyFavorites, searchQuery]);

  const handleCopyCode = (snippet: Snippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    showToast('Copied to clipboard', 'success', 1500);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openCreateModal = () => {
    setEditingSnippet(null);
    setModalTitle('');
    setModalDesc('');
    setModalCode('');
    setModalLang('typescript');
    setModalTags('');
    setModalProjectId('');
    setIsModalOpen(true);
  };

  const openEditModal = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setModalTitle(snippet.title);
    setModalDesc(snippet.description || '');
    setModalCode(snippet.code);
    setModalLang(snippet.language);
    setModalTags(snippet.tags.join(', '));
    setModalProjectId(snippet.projectId || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!modalTitle.trim() || !modalCode.trim()) {
      showToast('Title and Code are required', 'error', 2000);
      return;
    }

    const parsedTags = modalTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingSnippet) {
      updateSnippet(editingSnippet.id, {
        title: modalTitle.trim(),
        description: modalDesc.trim() || undefined,
        code: modalCode,
        language: modalLang,
        tags: parsedTags,
        projectId: modalProjectId || undefined,
      });
      showToast('Snippet updated', 'success', 1500);
    } else {
      addSnippet({
        title: modalTitle.trim(),
        description: modalDesc.trim() || undefined,
        code: modalCode,
        language: modalLang,
        tags: parsedTags,
        projectId: modalProjectId || undefined,
        isFavorite: false,
      });
      showToast('Snippet created', 'success', 1500);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="snippets-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code2 size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">Code Snippet Library</h1>
          </div>
          <p className="page-subtitle">
            Curate, search, and reuse daily code snippets with instantaneous copy-paste.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={14} />
            <span>New Snippet</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="snippets-filter-row">
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
          <div style={{ position: 'relative', width: '100%' }}>
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
              placeholder="Search snippets by title, code, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 30 }}
            />
          </div>
        </div>

        {/* Favorite toggle & Lang Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${onlyFavorites ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Star size={13} fill={onlyFavorites ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {POPULAR_LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`btn btn-sm ${selectedLang.toLowerCase() === lang.toLowerCase() ? 'btn-primary' : 'btn-subtle'}`}
                style={{ fontSize: 11.5, padding: '3px 8px' }}
                onClick={() => setSelectedLang(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snippets Grid */}
      <div className="snippets-grid">
        {filteredSnippets.length > 0 ? (
          filteredSnippets.map((snippet) => {
            const isCopied = copiedId === snippet.id;

            return (
              <div key={snippet.id} className="snippet-card">
                <div className="snippet-card-header">
                  <div>
                    <h2 className="snippet-card-title">{snippet.title}</h2>
                    {snippet.description && (
                      <p className="snippet-card-desc">{snippet.description}</p>
                    )}
                  </div>

                  <button
                    className={`btn-icon pin-tool-btn ${snippet.isFavorite ? 'pinned' : ''}`}
                    onClick={() => toggleFavoriteSnippet(snippet.id)}
                    title={snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star size={14} fill={snippet.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="snippet-code-box">
                  <code>{snippet.code}</code>
                </div>

                <div className="snippet-card-footer">
                  <div className="snippet-tags-row">
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      {snippet.language}
                    </span>
                    {snippet.tags.map((t) => (
                      <span key={t} className="snippet-tag">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="btn btn-subtle btn-sm btn-icon"
                      onClick={() => duplicateSnippet(snippet.id)}
                      title="Duplicate snippet"
                    >
                      <CopyPlus size={13} />
                    </button>
                    <button
                      className="btn btn-subtle btn-sm btn-icon"
                      onClick={() => openEditModal(snippet)}
                      title="Edit snippet"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-subtle btn-sm btn-icon"
                      onClick={() => deleteSnippet(snippet.id)}
                      title="Delete snippet"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      className={`btn btn-sm ${isCopied ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleCopyCode(snippet)}
                      style={{ marginLeft: 4 }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied ✓' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '48px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            No snippets found matching your filters.
          </div>
        )}
      </div>

      {/* New / Edit Snippet Modal */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={editingSnippet ? 'Edit Snippet' : 'New Code Snippet'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveModal}>
                {editingSnippet ? 'Save Changes' : 'Create Snippet'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Snippet Title:
              </label>
              <input
                type="text"
                placeholder="e.g. React Debounce Hook"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Description (optional):
              </label>
              <input
                type="text"
                placeholder="Brief description of what this does"
                value={modalDesc}
                onChange={(e) => setModalDesc(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Language:
                </label>
                <select
                  value={modalLang}
                  onChange={(e) => setModalLang(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash / Shell</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Project (optional):
                </label>
                <select
                  value={modalProjectId}
                  onChange={(e) => setModalProjectId(e.target.value)}
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

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Tags (comma separated):
              </label>
              <input
                type="text"
                placeholder="react, hooks, debounce"
                value={modalTags}
                onChange={(e) => setModalTags(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Code:
              </label>
              <textarea
                value={modalCode}
                onChange={(e) => setModalCode(e.target.value)}
                placeholder="Paste code here..."
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  minHeight: '160px',
                }}
                spellCheck={false}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
