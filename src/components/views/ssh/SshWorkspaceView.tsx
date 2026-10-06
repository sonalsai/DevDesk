import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Terminal,
  Server,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Play,
  Square,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useWorkspace } from '@/hooks';
import { useToast } from '@/hooks';
import type { SSHProfile, SSHTerminalLine } from '../../../types/ssh';
import {
  validateSSHProfile,
  simulateSSHCommand,
  createWelcomeBanner,
} from '../../../services/ssh';
import './ssh.css';

export const SshWorkspaceView: React.FC = () => {
  const {
    sshProfiles,
    addSSHProfile,
    updateSSHProfile,
    deleteSSHProfile,
    duplicateSSHProfile,
  } = useWorkspace();

  const { showToast } = useToast();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    sshProfiles.length > 0 ? sshProfiles[0].id : null
  );

  const [connectedProfileId, setConnectedProfileId] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<SSHTerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Profile Form Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SSHProfile>>({
    name: '',
    host: '',
    port: 22,
    username: '',
    authMethod: 'key',
    keyPath: '~/.ssh/id_rsa',
    tags: [],
  });

  // Delete Confirmation Modal State
  const [profileToDelete, setProfileToDelete] = useState<SSHProfile | null>(null);

  const activeProfile = useMemo(() => {
    return sshProfiles.find((p) => p.id === selectedProfileId) || sshProfiles[0] || null;
  }, [sshProfiles, selectedProfileId]);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const handleConnect = useCallback((profile: SSHProfile) => {
    setConnectedProfileId(profile.id);
    const banner = createWelcomeBanner(profile);
    setTerminalLines(banner);
    showToast(`Connected session to ${profile.name}`, 'info');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [showToast]);

  const handleDisconnect = () => {
    if (!connectedProfileId) return;
    setTerminalLines((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        type: 'system',
        text: 'Session disconnected by client.',
        timestamp: new Date().toISOString(),
      },
    ]);
    setConnectedProfileId(null);
    showToast('Session disconnected', 'info');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedProfileId || !currentInput.trim()) return;

    const cmd = currentInput.trim();
    const targetProfile = sshProfiles.find((p) => p.id === connectedProfileId);
    if (!targetProfile) return;

    if (cmd.toLowerCase() === 'clear') {
      setTerminalLines([]);
      setCurrentInput('');
      setCommandHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      return;
    }

    const inputLine: SSHTerminalLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      text: `${targetProfile.username}@${targetProfile.host}:~$ ${cmd}`,
      timestamp: new Date().toISOString(),
    };

    const res = simulateSSHCommand(cmd, targetProfile);

    const outputLine: SSHTerminalLine = {
      id: `out-${Date.now()}`,
      type: res.type,
      text: res.output,
      timestamp: new Date().toISOString(),
    };

    setTerminalLines((prev) => [...prev, inputLine, outputLine]);
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCurrentInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCurrentInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCurrentInput(commandHistory[nextIdx]);
      }
    }
  };

  const openCreateModal = () => {
    setEditingProfileId(null);
    setFormData({
      name: '',
      host: '',
      port: 22,
      username: '',
      authMethod: 'key',
      keyPath: '~/.ssh/id_rsa',
      tags: [],
    });
    setIsEditingProfile(true);
  };

  const openEditModal = (profile: SSHProfile) => {
    setEditingProfileId(profile.id);
    setFormData({ ...profile });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSSHProfile(formData);
    if (!validation.isValid) {
      showToast(validation.error || 'Please fill required fields', 'error');
      return;
    }

    if (editingProfileId) {
      updateSSHProfile(editingProfileId, formData);
      showToast('Profile updated', 'info');
    } else {
      const created = addSSHProfile({
        name: formData.name || 'New Profile',
        host: formData.host || '',
        port: formData.port || 22,
        username: formData.username || '',
        authMethod: formData.authMethod || 'key',
        keyPath: formData.keyPath,
        tags: formData.tags || [],
      });
      setSelectedProfileId(created.id);
      showToast('SSH profile created', 'info');
    }
    setIsEditingProfile(false);
  };

  return (
    <div className="ssh-workspace">
      {/* Sidebar: Profiles List */}
      <div className="ssh-sidebar">
        <div className="ssh-sidebar-header">
          <h2>
            <Server size={18} color="var(--accent-color, #0ea5e9)" />
            SSH Profiles
          </h2>
          <button className="ssh-action-btn primary" onClick={openCreateModal}>
            <Plus size={13} />
            New
          </button>
        </div>

        <div className="ssh-profiles-list">
          {sshProfiles.map((p) => {
            const isSelected = activeProfile?.id === p.id;
            const isConnected = connectedProfileId === p.id;

            return (
              <div
                key={p.id}
                className={`ssh-profile-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedProfileId(p.id)}
              >
                <div className="ssh-profile-card-top">
                  <div className="ssh-profile-title">{p.name}</div>
                  {isConnected && (
                    <span className="ssh-status-chip connected" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                      Connected
                    </span>
                  )}
                </div>

                <div className="ssh-profile-host">
                  {p.username}@{p.host}:{p.port}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Auth: {p.authMethod === 'key' ? 'Key' : p.authMethod === 'agent' ? 'Agent' : 'Password'}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="ssh-action-btn"
                      style={{ padding: '2px 6px' }}
                      title="Edit Profile"
                      onClick={() => openEditModal(p)}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      className="ssh-action-btn"
                      style={{ padding: '2px 6px' }}
                      title="Duplicate Profile"
                      onClick={() => {
                        duplicateSSHProfile(p.id);
                        showToast('Profile duplicated', 'info');
                      }}
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      className="ssh-action-btn danger"
                      style={{ padding: '2px 6px' }}
                      title="Delete Profile"
                      onClick={() => setProfileToDelete(p)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {p.tags && p.tags.length > 0 && (
                  <div className="ssh-profile-tags">
                    {p.tags.map((t: string) => (
                      <span key={t} className="ssh-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="ssh-main">
        {activeProfile ? (
          <>
            <div className="ssh-terminal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={16} color="#38bdf8" />
                <span style={{ fontWeight: 600 }}>{activeProfile.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ({activeProfile.username}@{activeProfile.host}:{activeProfile.port})
                </span>
                {connectedProfileId === activeProfile.id ? (
                  <span className="ssh-status-chip connected" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    Active
                  </span>
                ) : (
                  <span className="ssh-status-chip stopped" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    Disconnected
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {connectedProfileId === activeProfile.id ? (
                  <button className="ssh-action-btn danger" onClick={handleDisconnect}>
                    <Square size={12} />
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="ssh-action-btn primary"
                    onClick={() => handleConnect(activeProfile)}
                  >
                    <Play size={12} />
                    Connect
                  </button>
                )}

                <button
                  className="ssh-action-btn"
                  onClick={() => setTerminalLines([])}
                  title="Clear Terminal"
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              </div>
            </div>

            <div className="ssh-terminal-screen">
              {terminalLines.map((line) => (
                <div key={line.id} className={`ssh-line ${line.type}`}>
                  {line.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {connectedProfileId === activeProfile.id && (
              <form className="ssh-input-row" onSubmit={handleCommandSubmit}>
                <span className="ssh-prompt-label">
                  {activeProfile.username}@{activeProfile.host}:~$
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  className="ssh-input-field"
                  placeholder="Type command ('help', 'uptime', 'ps aux', etc.)..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </form>
            )}
          </>
        ) : (
          <div className="ssh-empty-state">
            <Server size={36} />
            <p>No SSH profile selected.</p>
            <button className="ssh-action-btn primary" onClick={openCreateModal}>
              <Plus size={13} />
              Create Profile
            </button>
          </div>
        )}
      </div>

      {/* Edit / Create Profile Modal */}
      {isEditingProfile && (
        <div className="ssh-modal-backdrop" onClick={() => setIsEditingProfile(false)}>
          <div className="ssh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ssh-modal-header">
              <span style={{ fontWeight: 600 }}>
                {editingProfileId ? 'Edit SSH Profile' : 'New SSH Connection Profile'}
              </span>
              <button className="ssh-action-btn" onClick={() => setIsEditingProfile(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="ssh-modal-body">
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Production Cluster Node"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                      Host / IP Address *
                    </label>
                    <input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.host || ''}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="e.g. 192.168.1.50 or host.example.com"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                      Port *
                    </label>
                    <input
                      type="number"
                      required
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.port || 22}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 22 })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. ubuntu or deploy"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Authentication Method
                  </label>
                  <select
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.authMethod}
                    onChange={(e) => setFormData({ ...formData, authMethod: e.target.value as SSHProfile['authMethod'] })}
                  >
                    <option value="key">SSH Private Key (~/.ssh/id_rsa)</option>
                    <option value="agent">SSH Agent Forwarding</option>
                    <option value="password">Password (Interactive Prompt)</option>
                  </select>
                </div>

                {formData.authMethod === 'key' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                      Key Path
                    </label>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.keyPath || ''}
                      onChange={(e) => setFormData({ ...formData, keyPath: e.target.value })}
                      placeholder="~/.ssh/id_ed25519"
                    />
                  </div>
                )}
              </div>
              <div className="ssh-modal-footer">
                <button type="button" className="ssh-action-btn" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="ssh-action-btn primary">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {profileToDelete && (
        <div className="ssh-modal-backdrop" onClick={() => setProfileToDelete(null)}>
          <div className="ssh-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ssh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertTriangle size={18} />
                <span style={{ fontWeight: 600 }}>Delete profile?</span>
              </div>
            </div>
            <div className="ssh-modal-body">
              <p>
                Delete SSH profile <strong>{profileToDelete.name}</strong>?
              </p>
            </div>
            <div className="ssh-modal-footer">
              <button className="ssh-action-btn" onClick={() => setProfileToDelete(null)}>
                Cancel
              </button>
              <button
                className="ssh-action-btn danger"
                onClick={() => {
                  deleteSSHProfile(profileToDelete.id);
                  showToast(`Deleted ${profileToDelete.name}`, 'info');
                  setProfileToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
