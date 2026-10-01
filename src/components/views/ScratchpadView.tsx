import React, { useState } from 'react';
import { useWorkspace } from '@/hooks';
import {
  FileText,
  Pin,
  Trash2,
  Columns,
  Eye,
  Edit3,
  Copy,
  Check,
  Heading,
  List,
  CheckSquare,
  Code,
} from 'lucide-react';
import { useToast } from '@/hooks';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ScratchpadView: React.FC = () => {
  const { data, updateScratchpad, clearScratchpad, scratchpadSaveStatus } = useWorkspace();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [copied, setCopied] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const content = data.scratchpad.content;
  const isPinned = data.scratchpad.isPinned;

  const handleChange = (newVal: string) => {
    updateScratchpad(newVal);
  };

  const handleTogglePin = () => {
    updateScratchpad(content, !isPinned);
    showToast(isPinned ? 'Unpinned scratchpad' : 'Pinned scratchpad', 'info', 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    showToast('Copied scratchpad contents', 'success', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  const insertSnippet = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('scratchpad-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    updateScratchpad(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  };

  // Basic markdown renderer for preview
  const renderPreview = () => {
    if (!content.trim()) {
      return (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 20 }}>
          Scratchpad is empty. Start typing notes, commands, or markdown snippets.
        </div>
      );
    }

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} style={{ fontSize: 18, fontWeight: 700, margin: '14px 0 8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 6px' }}>
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} style={{ fontSize: 13.5, fontWeight: 600, margin: '10px 0 4px' }}>
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
            <input type="checkbox" checked readOnly style={{ accentColor: 'var(--accent)' }} />
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
              {line.replace(/- \[[xX]\] /, '')}
            </span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
            <input type="checkbox" readOnly />
            <span>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} style={{ marginLeft: 20, margin: '2px 0' }}>
            {line.replace(/^[-*] /, '')}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div
            key={idx}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--accent)',
              margin: '6px 0 2px',
            }}
          >
            {line}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: 10 }} />;
      }
      return (
        <p key={idx} style={{ margin: '3px 0', lineHeight: 1.6 }}>
          {line}
        </p>
      );
    });
  };

  const lineCount = content ? content.split('\n').length : 1;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content ? content.length : 0;

  return (
    <div className="scratchpad-container">
      {/* Top Toolbar */}
      <div className="scratchpad-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Scratchpad</span>
          </div>

          {/* Auto-save indicator */}
          <div className="save-status-indicator">
            <span
              className={`save-status-dot ${scratchpadSaveStatus === 'saving' ? 'saving' : ''}`}
            />
            <span>{scratchpadSaveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>

        {/* Formatting Quick Buttons */}
        <div className="toolbar-group">
          <button
            className="btn btn-subtle btn-sm"
            onClick={() => insertSnippet('## ')}
            title="Heading"
          >
            <Heading size={13} />
          </button>
          <button
            className="btn btn-subtle btn-sm"
            onClick={() => insertSnippet('- [ ] ')}
            title="Task checkbox"
          >
            <CheckSquare size={13} />
          </button>
          <button
            className="btn btn-subtle btn-sm"
            onClick={() => insertSnippet('- ')}
            title="List item"
          >
            <List size={13} />
          </button>
          <button
            className="btn btn-subtle btn-sm"
            onClick={() => insertSnippet('```bash\n', '\n```')}
            title="Code block"
          >
            <Code size={13} />
          </button>
        </div>

        {/* View Mode & Actions */}
        <div className="toolbar-group">
          <input
            type="text"
            placeholder="Filter text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '3px 8px', fontSize: 11.5, width: 120 }}
          />

          <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('editor')}
              title="Editor only"
            >
              <Edit3 size={12} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('split')}
              title="Split View"
            >
              <Columns size={12} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('preview')}
              title="Preview only"
            >
              <Eye size={12} />
            </button>
          </div>

          <button
            className={`btn btn-subtle btn-sm ${isPinned ? 'btn-primary' : ''}`}
            onClick={handleTogglePin}
            title={isPinned ? 'Pinned to top' : 'Pin to top'}
          >
            <Pin size={13} />
          </button>

          <button
            className={`btn btn-subtle btn-sm ${copied ? 'btn-primary' : ''}`}
            onClick={handleCopy}
            title="Copy all text"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          <button
            className="btn btn-subtle btn-sm"
            onClick={() => setShowClearConfirm(true)}
            title="Clear scratchpad"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Scratchpad Pane */}
      <div className="scratchpad-editor-wrap">
        {viewMode !== 'preview' && (
          <textarea
            id="scratchpad-editor"
            className="scratchpad-textarea"
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type anything here... Markdown, SQL snippets, terminal commands, or thoughts. Auto-saves continuously."
            spellCheck={false}
            style={viewMode === 'split' ? { width: '50%' } : { width: '100%' }}
          />
        )}

        {viewMode !== 'editor' && (
          <div
            className="scratchpad-preview-pane"
            style={viewMode === 'split' ? { width: '50%' } : { width: '100%' }}
          >
            {renderPreview()}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          padding: '0 4px',
        }}
      >
        <span>
          {lineCount} lines • {wordCount} words • {charCount} chars
        </span>
        <span>Autosaved locally in browser storage</span>
      </div>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearScratchpad}
        title="Clear Scratchpad?"
        message="Are you sure you want to clear your scratchpad? All current notes and text will be erased."
        confirmLabel="Clear All"
        isDestructive
      />
    </div>
  );
};
