import React from 'react';
import { Modal } from '../common/Modal';
import { useWorkspace } from '@/hooks';

interface ShortcutRow {
  keys: string[];
  description: string;
  context: string;
}

const SHORTCUTS: ShortcutRow[] = [
  {
    keys: ['⌘', 'K', '/', 'Ctrl', 'K'],
    description: 'Open Command Palette & Global Search',
    context: 'Global',
  },
  {
    keys: ['N'],
    description: 'Quick create new task',
    context: 'Global (when not typing)',
  },
  {
    keys: ['S'],
    description: 'Jump to Scratchpad',
    context: 'Global (when not typing)',
  },
  {
    keys: ['/'],
    description: 'Focus global search input',
    context: 'Global (when not typing)',
  },
  {
    keys: ['Alt', '←', '/', '⌘', '['],
    description: 'Navigate back in workspace history',
    context: 'Global navigation',
  },
  {
    keys: ['Alt', '→', '/', '⌘', ']'],
    description: 'Navigate forward in workspace history',
    context: 'Global navigation',
  },
  {
    keys: ['Esc'],
    description: 'Close active dialog, modal, or command palette',
    context: 'Global',
  },
  {
    keys: ['⌘', 'Enter', '/', 'Ctrl', 'Enter'],
    description: 'Run tool, format JSON, or submit active form',
    context: 'Tools / Editors',
  },
  {
    keys: ['⌘', 'S', '/', 'Ctrl', 'S'],
    description: 'Save scratchpad or project notes',
    context: 'Scratchpad / Editors',
  },
  {
    keys: ['Tab'],
    description: 'Indent spaces in code editor without losing focus',
    context: 'Code Editor',
  },
  {
    keys: ['⌘', '⇧', 'G', '/', 'Ctrl', 'Shift', 'G'],
    description: 'Open Git & Version Control Workspace',
    context: 'Global',
  },
  {
    keys: ['⌘', '⇧', 'L', '/', 'Ctrl', 'Shift', 'L'],
    description: 'Open Local Log Viewer',
    context: 'Global',
  },
  {
    keys: ['⌘', '⇧', 'Y', '/', 'Ctrl', 'Shift', 'Y'],
    description: 'Open YAML / Configuration Toolkit',
    context: 'Global',
  },
  {
    keys: ['⌘', '⇧', 'E', '/', 'Ctrl', 'Shift', 'E'],
    description: 'Open Environment & .env File Manager',
    context: 'Global',
  },
  {
    keys: ['⌘', 'Enter', '/', 'Ctrl', 'Enter'],
    description: 'Commit staged changes (when focused on commit message)',
    context: 'Git Workspace',
  },
  {
    keys: ['↑', '↓', 'Enter'],
    description: 'Navigate and select command palette items',
    context: 'Command Palette',
  },
];

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useWorkspace();

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={() => setIsShortcutsOpen(false)}
      title="Keyboard Shortcuts Reference"
      maxWidth={540}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          DevDesk is keyboard-first. Keybindings are automatically suppressed whenever you are typing inside a text input or code editor.
        </p>

        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: idx < SHORTCUTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-input)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {s.description}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {s.context}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.keys.map((k, kIdx) =>
                  k === '/' ? (
                    <span key={kIdx} style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 2px' }}>
                      or
                    </span>
                  ) : (
                    <span key={kIdx} className="kbd-shortcut">
                      {k}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
