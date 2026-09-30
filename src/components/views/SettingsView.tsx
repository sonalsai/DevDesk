import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Settings,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Trash2,
  Shield,
  Keyboard,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { downloadWorkspaceBackup, parseImportedWorkspace } from '../../services/storage';

export const SettingsView: React.FC = () => {
  const {
    data,
    updateSettings,
    setWorkspaceData,
    resetToDefaults,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
  } = useWorkspace();
  const { showToast } = useToast();

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settings = data.settings;

  const handleExport = () => {
    downloadWorkspaceBackup(data);
    showToast('Exported DevDesk workspace JSON', 'success', 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedData = parseImportedWorkspace(text);
        setWorkspaceData(parsedData);
        showToast('Successfully imported workspace backup!', 'success', 2500);
      } catch (err: any) {
        showToast(`Import failed: ${err.message}`, 'error', 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    resetToDefaults();
    showToast('DevDesk reset to default workspace', 'info', 2000);
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">Settings</h1>
          </div>
          <p className="page-subtitle">
            Configure application appearance, editor behavior, data backup, and privacy.
          </p>
        </div>
      </div>

      {/* 1. Appearance */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Appearance
        </h2>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Interface Theme</span>
            <span className="settings-desc">Choose between dark, light, or system sync.</span>
          </div>

          <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={12} />
              <span>Dark</span>
            </button>
            <button
              className={`btn btn-sm ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={12} />
              <span>Light</span>
            </button>
            <button
              className={`btn btn-sm ${settings.theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'system' })}
            >
              <Laptop size={12} />
              <span>System</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Editor Preferences */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Editor Preferences
        </h2>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Font Size</span>
            <span className="settings-desc">Base font size for tool inputs, diffs, and code editors.</span>
          </div>

          <select
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            style={{ padding: '4px 8px', fontSize: 12 }}
          >
            <option value={12}>12px (Compact)</option>
            <option value={13}>13px (Default)</option>
            <option value={14}>14px (Medium)</option>
            <option value={15}>15px (Large)</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Tab Size</span>
            <span className="settings-desc">Number of spaces to insert when pressing Tab key.</span>
          </div>

          <select
            value={settings.tabSize}
            onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
            style={{ padding: '4px 8px', fontSize: 12 }}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Show Line Numbers</span>
            <span className="settings-desc">Display line numbers gutter in code and JSON editors.</span>
          </div>

          <input
            type="checkbox"
            checked={settings.lineNumbers}
            onChange={(e) => updateSettings({ lineNumbers: e.target.checked })}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Word Wrap</span>
            <span className="settings-desc">Wrap long lines automatically in editors.</span>
          </div>

          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
          />
        </div>
      </div>

      {/* 3. Behavior */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Workspace Behavior
        </h2>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Auto-save</span>
            <span className="settings-desc">Save tasks, scratchpad, and snippets continuously to local storage.</span>
          </div>

          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => updateSettings({ autoSave: e.target.checked })}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Confirm Destructive Actions</span>
            <span className="settings-desc">Ask for confirmation before clearing data or deleting items.</span>
          </div>

          <input
            type="checkbox"
            checked={settings.confirmDestructive}
            onChange={(e) => updateSettings({ confirmDestructive: e.target.checked })}
          />
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Track Recent History</span>
            <span className="settings-desc">Keep track of recently used tools and visited items locally.</span>
          </div>

          <input
            type="checkbox"
            checked={settings.trackHistory}
            onChange={(e) => updateSettings({ trackHistory: e.target.checked })}
          />
        </div>
      </div>

      {/* 4. Keyboard Shortcuts */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Keyboard Shortcuts
            </h2>
            <span className="settings-desc">Boost productivity with fast keybindings.</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsShortcutsOpen(true)}
          >
            <Keyboard size={13} />
            <span>View All Shortcuts</span>
          </button>
        </div>
      </div>

      {/* 5. Privacy & Security */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Privacy & Local Processing
            </h2>
            <span className="settings-desc">Learn how DevDesk keeps your data 100% on your machine.</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsPrivacyModalOpen(true)}
          >
            <Shield size={13} />
            <span>Read Privacy Policy</span>
          </button>
        </div>
      </div>

      {/* 6. Workspace Data Management (Export / Import / Clear) */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Workspace Data & Backups
        </h2>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Export Workspace Backup</span>
            <span className="settings-desc">Download a complete JSON backup of your tasks, snippets, notes, and projects.</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Import Workspace Backup</span>
            <span className="settings-desc">Restore your workspace from a previously exported DevDesk JSON backup file.</span>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title" style={{ color: 'var(--danger)' }}>
              Reset Workspace Data
            </span>
            <span className="settings-desc">Clear all tasks, notes, snippets, and return to default starter state.</span>
          </div>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={13} />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Reset All Workspace Data?"
        message="This action will delete your current tasks, custom snippets, scratchpad content, and project records, restoring DevDesk to initial starter defaults. Make sure you have exported a backup if you need to keep your data."
        confirmLabel="Reset Everything"
        isDestructive
      />
    </div>
  );
};
