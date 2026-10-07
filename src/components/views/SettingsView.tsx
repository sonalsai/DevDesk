import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkspace, useToast, useTranslation } from '@/hooks';
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
  Globe2,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { downloadWorkspaceBackup, parseImportedWorkspace } from '../../services/storage';
import {
  getStorageMetrics,
  calculateSha256,
  createExportEnvelope,
  verifyAndParseExportEnvelope,
  type StorageMetrics,
} from '../../services/storage/storageQuotaService';
import {
  saveSnapshotToDb,
  listSnapshotsFromDb,
  getSnapshotById,
  deleteSnapshotFromDb,
  type StoredSnapshot,
} from '../../services/storage/indexedDbStorage';
import { useSystemTelemetry } from '../../services/systemTelemetryService';
import type { SupportedLocale } from '../../services/i18n/translations';

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
  const { t, locale, setLocale, locales, formatBytes } = useTranslation();
  const telemetry = useSystemTelemetry(3000);

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage metrics & Snapshots state
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics | null>(null);
  const [currentChecksum, setCurrentChecksum] = useState<string>('Computing...');
  const [snapshots, setSnapshots] = useState<Array<Omit<StoredSnapshot, 'data'>>>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  const settings = data.settings;

  // Refresh storage metrics and compute checksum
  const refreshStorageData = useCallback(async () => {
    try {
      const metrics = await getStorageMetrics(data);
      setStorageMetrics(metrics);

      const raw = JSON.stringify(data);
      const hash = await calculateSha256(raw);
      setCurrentChecksum(hash);

      const snaps = await listSnapshotsFromDb();
      setSnapshots(snaps);
    } catch {
      // Fallback
    }
  }, [data]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const metrics = await getStorageMetrics(data);
        if (!active) return;
        setStorageMetrics(metrics);

        const raw = JSON.stringify(data);
        const hash = await calculateSha256(raw);
        if (!active) return;
        setCurrentChecksum(hash);

        const snaps = await listSnapshotsFromDb();
        if (!active) return;
        setSnapshots(snaps);
      } catch {
        // Fallback
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [data]);

  // Standard Export
  const handleExportStandard = () => {
    downloadWorkspaceBackup(data);
    showToast('Exported standard workspace JSON backup', 'success', 2000);
  };

  // Verified Export with SHA-256 Checksum
  const handleExportVerified = async () => {
    try {
      const envelopeJson = await createExportEnvelope(data, true);
      const blob = new Blob([envelopeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `devdesk-verified-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported verified workspace backup with SHA-256 checksum', 'success', 2500);
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error', 3000);
    }
  };

  // Import with Checksum Verification
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await verifyAndParseExportEnvelope(text);
        const parsed = parseImportedWorkspace(JSON.stringify(result.data));
        setWorkspaceData(parsed);

        if (result.checksumMatched) {
          showToast('Backup verified! SHA-256 checksum matched successfully.', 'success', 3000);
        } else {
          showToast('Workspace backup restored.', 'info', 2500);
        }
      } catch (err: any) {
        showToast(`Import failed: ${err.message}`, 'error', 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create Instant Snapshot Checkpoint
  const handleCreateSnapshot = async () => {
    setIsSavingSnapshot(true);
    try {
      const label = `Manual Snapshot - ${new Date().toLocaleTimeString()}`;
      await saveSnapshotToDb(label, data, currentChecksum);
      showToast('Created recovery snapshot in IndexedDB', 'success', 2000);
      refreshStorageData();
    } catch (err: any) {
      showToast(`Snapshot error: ${err.message}`, 'error', 2500);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Restore Snapshot
  const handleConfirmRestoreSnapshot = async () => {
    if (!showRestoreConfirm) return;
    try {
      const snapshotData = await getSnapshotById(showRestoreConfirm);
      if (snapshotData) {
        const parsed = parseImportedWorkspace(JSON.stringify(snapshotData));
        setWorkspaceData(parsed);
        showToast('Restored workspace from snapshot', 'success', 2500);
      }
    } catch (err: any) {
      showToast(`Restore failed: ${err.message}`, 'error', 3000);
    } finally {
      setShowRestoreConfirm(null);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteSnapshotFromDb(id);
    refreshStorageData();
    showToast('Snapshot removed', 'info', 1500);
  };

  const handleClearData = () => {
    resetToDefaults();
    showToast('Workspace cleared', 'info', 2000);
  };

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} style={{ color: 'var(--accent)' }} />
            <h1 className="page-title">{t('settings.title')}</h1>
          </div>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* 1. Appearance & Locale */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('settings.appearance')}
        </h2>

        {/* Theme */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">{t('settings.theme')}</span>
            <span className="settings-desc">Choose between dark, light, or system sync.</span>
          </div>

          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={12} />
              <span>{t('settings.themeDark')}</span>
            </button>
            <button
              className={`btn btn-sm ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={12} />
              <span>{t('settings.themeLight')}</span>
            </button>
            <button
              className={`btn btn-sm ${settings.theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0 }}
              onClick={() => updateSettings({ theme: 'system' })}
            >
              <Laptop size={12} />
              <span>{t('settings.themeSystem')}</span>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">{t('settings.language')}</span>
            <span className="settings-desc">Select active display language and regional formatting.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe2 size={16} style={{ color: 'var(--accent)' }} />
            <select
              value={locale}
              onChange={(e) => {
                const nextLoc = e.target.value as SupportedLocale;
                setLocale(nextLoc);
                updateSettings({ locale: nextLoc });
                showToast(`Language set to ${nextLoc}`, 'info', 1500);
              }}
              style={{ padding: '6px 12px', fontSize: 12, minWidth: 160 }}
            >
              {locales.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.nativeName} ({loc.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Storage Engine & Quota Sentinel */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('settings.storageSection')}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={refreshStorageData} title="Refresh metrics">
            <RefreshCw size={12} />
          </button>
        </div>
        <p className="settings-desc" style={{ marginBottom: 16 }}>
          {t('settings.storageDesc')}
        </p>

        {/* Storage Bar Meter */}
        {storageMetrics && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {t('settings.storageUsedLabel')}:{' '}
                <strong>{formatBytes(storageMetrics.usedBytes)}</strong> / {formatBytes(storageMetrics.quotaBytes)}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: storageMetrics.isCritical
                    ? 'var(--danger)'
                    : storageMetrics.isWarning
                    ? 'var(--warning)'
                    : 'var(--success)',
                }}
              >
                {storageMetrics.percentage}% Used
              </span>
            </div>

            <div
              style={{
                height: 8,
                background: 'var(--bg-sunken)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(2, storageMetrics.percentage)}%`,
                  background: storageMetrics.isCritical
                    ? 'var(--danger)'
                    : storageMetrics.isWarning
                    ? 'var(--warning)'
                    : 'linear-gradient(90deg, var(--accent) 0%, var(--brand-sky) 100%)',
                  transition: 'width 250ms ease',
                }}
              />
            </div>
          </div>
        )}

        {/* SHA-256 Workspace Integrity Fingerprint */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Workspace Integrity Fingerprint</span>
            <span className="settings-desc">SHA-256 checksum calculated over entire workspace state.</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '6px 10px',
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent)',
              maxWidth: 240,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={currentChecksum}
          >
            <Fingerprint size={12} style={{ display: 'inline', marginRight: 6 }} />
            {currentChecksum}
          </div>
        </div>

        {/* Recovery Snapshots */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Local Recovery Snapshots ({snapshots.length})
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCreateSnapshot}
              disabled={isSavingSnapshot}
            >
              <HardDrive size={12} />
              <span>Create Instant Snapshot</span>
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>
              No snapshots saved yet. Snapshots provide emergency rollback checkpoints stored in IndexedDB.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 160,
                overflowY: 'auto',
              }}
            >
              {snapshots.slice(0, 5).map((snap) => (
                <div
                  key={snap.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{snap.label}</span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(snap.timestamp).toLocaleString()} • {formatBytes(snap.sizeBytes)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowRestoreConfirm(snap.id)}
                      title="Restore this snapshot"
                    >
                      <RotateCcw size={12} />
                      <span>Restore</span>
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Delete snapshot"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Core Web Vitals & Runtime Health */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('settings.systemHealthTitle')}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Health Score</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color:
                  telemetry.status === 'optimal'
                    ? 'var(--success)'
                    : telemetry.status === 'good'
                    ? 'var(--accent)'
                    : 'var(--warning)',
              }}
            >
              {telemetry.healthScore} / 100
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TTFB Latency</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {telemetry.ttfbMs} ms
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DOM Elements</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {telemetry.domNodes}
            </div>
          </div>

          {telemetry.usedJsHeapBytes && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JS Memory Heap</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatBytes(telemetry.usedJsHeapBytes)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Editor Preferences */}
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

      {/* 5. Workspace Behavior */}
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

      {/* 6. Workspace Data Management (Standard & Verified Checksum Backups) */}
      <div className="settings-section-card">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('settings.backupSection')}
        </h2>

        {/* Standard Export */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">{t('settings.exportBackup')}</span>
            <span className="settings-desc">Standard unencrypted JSON export for migration and sharing.</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExportStandard}>
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Verified Export with SHA-256 Checksum */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">Export Verified Backup (SHA-256)</span>
            <span className="settings-desc">Cryptographically signed envelope format with integrity check.</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExportVerified}>
            <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
            <span>Export Verified</span>
          </button>
        </div>

        {/* Import */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title">{t('settings.importBackup')}</span>
            <span className="settings-desc">Restore workspace from standard JSON or verified envelope.</span>
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
              <span>Import Backup</span>
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="settings-row">
          <div className="settings-label-group">
            <span className="settings-title" style={{ color: 'var(--danger)' }}>
              {t('settings.resetWorkspace')}
            </span>
            <span className="settings-desc">Reset all workspace entities to pristine initial state.</span>
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

      {/* 7. Keyboard Shortcuts & Privacy */}
      <div className="settings-section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Keyboard Shortcuts & Local Privacy
            </h2>
            <span className="settings-desc">Zero telemetry, local processing, and instant keybindings.</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsShortcutsOpen(true)}
            >
              <Keyboard size={13} />
              <span>Shortcuts</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              <Shield size={13} />
              <span>Privacy Guarantee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Reset All Workspace Data?"
        message="This deletes all tasks, snippets, scratchpad notes, projects, collections, and history. Please export a backup first if you need to keep your data."
        confirmLabel="Reset Everything"
        isDestructive
      />

      {/* Confirmation Dialog for Snapshot Restore */}
      <ConfirmDialog
        isOpen={Boolean(showRestoreConfirm)}
        onClose={() => setShowRestoreConfirm(null)}
        onConfirm={handleConfirmRestoreSnapshot}
        title="Restore Recovery Snapshot?"
        message="Restoring this snapshot will replace current workspace state with the snapshot data. Unsaved changes since the snapshot will be overwritten."
        confirmLabel="Restore Snapshot"
      />
    </div>
  );
};
