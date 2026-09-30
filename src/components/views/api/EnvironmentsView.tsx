import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Eye,
  EyeOff,
  GitCompare,
  Check,
  ShieldCheck,
  Layers,
  Search,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import type { Environment, EnvironmentVariable } from '../../../types/api';
import { compareEnvironments, exportDotEnvExample } from '../../../services/environmentService';

export const EnvironmentsView: React.FC = () => {
  const {
    data,
    activeEnvironment,
    setActiveEnvironmentId,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
  } = useWorkspace();

  const { showToast } = useToast();
  const environments = data.environments || [];

  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    environments.length > 0 ? (activeEnvironment?.id || environments[0].id) : ''
  );

  const [viewTab, setViewTab] = useState<'variables' | 'compare'>('variables');

  // Comparison State
  const [compareEnvAId, setCompareEnvAId] = useState<string>(
    environments[0]?.id || ''
  );
  const [compareEnvBId, setCompareEnvBId] = useState<string>(
    environments[1]?.id || environments[0]?.id || ''
  );
  const [revealComparisonSecrets, setRevealComparisonSecrets] = useState(false);

  // New Environment Inline Form
  const [isCreatingEnv, setIsCreatingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvProjectId, setNewEnvProjectId] = useState('');

  // Unmasked secrets map for the active editor: { [varId: string]: boolean }
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Variable search filter
  const [searchFilter, setSearchFilter] = useState('');

  const currentEnv = environments.find((e) => e.id === selectedEnvId) || environments[0];
  const envA = environments.find((e) => e.id === compareEnvAId) || environments[0];
  const envB = environments.find((e) => e.id === compareEnvBId) || environments[1] || environments[0];

  const handleCreateEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) {
      showToast('Environment name is required', 'info');
      return;
    }

    const created = addEnvironment({
      name: newEnvName.trim(),
      projectId: newEnvProjectId || undefined,
      variables: [
        { id: `v-${Date.now()}-1`, key: 'base_url', value: 'https://api.example.com', isSecret: false, enabled: true },
      ],
    });

    setSelectedEnvId(created.id);
    setNewEnvName('');
    setNewEnvProjectId('');
    setIsCreatingEnv(false);
    showToast(`Environment "${created.name}" created`, 'success', 1500);
  };

  const handleDuplicate = (env: Environment) => {
    const dup = duplicateEnvironment(env.id);
    if (dup) {
      setSelectedEnvId(dup.id);
      showToast(`Duplicated "${env.name}"`, 'success', 1500);
    }
  };

  const handleAddVariable = () => {
    if (!currentEnv) return;
    const newVar: EnvironmentVariable = {
      id: `var-${Date.now()}`,
      key: '',
      value: '',
      isSecret: false,
      enabled: true,
    };
    updateEnvironment(currentEnv.id, {
      variables: [...currentEnv.variables, newVar],
    });
  };

  const handleUpdateVariable = (varId: string, updates: Partial<EnvironmentVariable>) => {
    if (!currentEnv) return;
    const updated = currentEnv.variables.map((v) => (v.id === varId ? { ...v, ...updates } : v));
    updateEnvironment(currentEnv.id, { variables: updated });
  };

  const handleDeleteVariable = (varId: string) => {
    if (!currentEnv) return;
    const updated = currentEnv.variables.filter((v) => v.id !== varId);
    updateEnvironment(currentEnv.id, { variables: updated });
  };

  const toggleSecretReveal = (varId: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [varId]: !prev[varId] }));
  };

  const handleExportDotEnv = (includeSecrets = false) => {
    if (!currentEnv) return;
    const content = exportDotEnvExample(currentEnv, includeSecrets);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = includeSecrets ? `.env.${currentEnv.name.toLowerCase()}` : `.env.example`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(includeSecrets ? 'Exported .env with secrets' : 'Exported .env.example', 'success', 1500);
  };

  const diffItems = envA && envB ? compareEnvironments(envA, envB) : [];

  const filteredVariables = currentEnv
    ? currentEnv.variables.filter(
        (v) =>
          v.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (!v.isSecret && v.value.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : [];

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${viewTab === 'variables' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('variables')}
          >
            <Layers size={14} />
            <span>Environment Variables</span>
          </button>
          <button
            className={`btn ${viewTab === 'compare' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('compare')}
          >
            <GitCompare size={14} />
            <span>Compare Environments</span>
          </button>
        </div>

        {viewTab === 'variables' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => handleExportDotEnv(false)} title="Export .env.example">
              <Download size={13} />
              <span>Export .env.example</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setIsCreatingEnv(true)}>
              <Plus size={13} />
              <span>New Environment</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE NEW ENVIRONMENT FORM */}
      {isCreatingEnv && (
        <form
          onSubmit={handleCreateEnvironment}
          className="card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Create Environment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Environment Name *</label>
              <input
                type="text"
                placeholder="e.g. Staging, Production, Local Docker"
                className="input-field"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Assign to Project (Optional)</label>
              <select
                className="input-select"
                value={newEnvProjectId}
                onChange={(e) => setNewEnvProjectId(e.target.value)}
              >
                <option value="">None (Global)</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingEnv(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Environment
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: VARIABLES MANAGER */}
      {viewTab === 'variables' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, minHeight: '520px' }}>
          {/* Environments Sidebar */}
          <div
            className="card"
            style={{
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--bg-surface)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', paddingLeft: 4 }}>
              Environments ({environments.length})
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
              {environments.map((env) => {
                const isActive = activeEnvironment?.id === env.id;
                const isSelected = selectedEnvId === env.id;

                return (
                  <div
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isActive ? 'var(--success)' : 'var(--text-tertiary)',
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {env.name}
                      </span>
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {env.variables.length} vars
                    </span>
                  </div>
                );
              })}

              {environments.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  No environments. Create Development to get started.
                </div>
              )}
            </div>
          </div>

          {/* Variables Table for Selected Environment */}
          <div
            className="card"
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'var(--bg-surface)',
            }}
          >
            {currentEnv ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{currentEnv.name}</h2>
                      {activeEnvironment?.id === currentEnv.id ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: 'rgba(46, 204, 113, 0.15)',
                            color: 'var(--success)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Check size={11} /> Active in API Client
                        </span>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setActiveEnvironmentId(currentEnv.id);
                            showToast(`"${currentEnv.name}" is now the active environment`, 'info', 1500);
                          }}
                        >
                          Set as Active
                        </button>
                      )}
                    </div>
                    {currentEnv.projectId && (
                      <span style={{ fontSize: 11, color: 'var(--accent-hover)', display: 'inline-block', marginTop: 4 }}>
                        Linked to Project: {data.projects.find((p) => p.id === currentEnv.projectId)?.name || 'Project'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" onClick={handleAddVariable}>
                      <Plus size={12} /> Add Variable
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleDuplicate(currentEnv)}
                      title="Duplicate environment"
                    >
                      <Copy size={12} />
                    </button>
                    {environments.length > 1 && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (confirm(`Delete environment "${currentEnv.name}"?`)) {
                            deleteEnvironment(currentEnv.id);
                            showToast('Environment deleted', 'info', 1500);
                          }
                        }}
                        title="Delete environment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Privacy Badge Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(52, 152, 219, 0.08)',
                    border: '1px solid rgba(52, 152, 219, 0.2)',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: 'var(--info)' }} />
                  <span>
                    Privacy Protected: Secret variables are masked with <code>••••••••</code> and never logged to history or exported without explicit permission.
                  </span>
                </div>

                {/* Filter and Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 220 }}>
                    <input
                      type="text"
                      placeholder="Search variables..."
                      className="input-field"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      style={{ height: 26, fontSize: 11, paddingLeft: 24 }}
                    />
                    <Search size={11} style={{ position: 'absolute', left: 7, top: 7, color: 'var(--text-tertiary)' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Referenced as: <code>{'{{variable_name}}'}</code>
                  </span>
                </div>

                {/* Variables Grid */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 180px 1fr 90px 40px',
                      gap: 8,
                      padding: '6px 10px',
                      background: 'var(--bg-elevated)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Use</span>
                    <span>Variable Name</span>
                    <span>Initial / Current Value</span>
                    <span>Type</span>
                    <span>Action</span>
                  </div>

                  {filteredVariables.map((v) => {
                    const isRevealed = revealedSecrets[v.id] || false;

                    return (
                      <div
                        key={v.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '32px 180px 1fr 90px 40px',
                          gap: 8,
                          padding: '6px 10px',
                          alignItems: 'center',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={(e) => handleUpdateVariable(v.id, { enabled: e.target.checked })}
                          title="Enable/disable variable"
                        />

                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => handleUpdateVariable(v.id, { key: e.target.value })}
                          placeholder="VARIABLE_NAME"
                          className="input-field"
                          style={{ height: 26, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type={v.isSecret && !isRevealed ? 'password' : 'text'}
                            value={v.value}
                            onChange={(e) => handleUpdateVariable(v.id, { value: e.target.value })}
                            placeholder="Value"
                            className="input-field"
                            style={{ height: 26, fontSize: 12, fontFamily: 'var(--font-mono)', flex: 1 }}
                          />
                          {v.isSecret && (
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => toggleSecretReveal(v.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                              title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          )}
                        </div>

                        <label
                          style={{
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            color: v.isSecret ? 'var(--warning)' : 'var(--text-secondary)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={v.isSecret}
                            onChange={(e) => handleUpdateVariable(v.id, { isSecret: e.target.checked })}
                          />
                          Secret
                        </label>

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteVariable(v.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                          title="Delete Variable"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}

                  {filteredVariables.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                      No variables defined in this environment. Click "+ Add Variable" to define keys.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                Select an environment from the list.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ENVIRONMENT COMPARISON */}
      {viewTab === 'compare' && (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Compare:</span>
              <select
                className="input-select"
                value={compareEnvAId}
                onChange={(e) => setCompareEnvAId(e.target.value)}
                style={{ width: 160 }}
              >
                {environments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>vs</span>
              <select
                className="input-select"
                value={compareEnvBId}
                onChange={(e) => setCompareEnvBId(e.target.value)}
                style={{ width: 160 }}
              >
                {environments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={revealComparisonSecrets}
                onChange={(e) => setRevealComparisonSecrets(e.target.checked)}
              />
              <span>Reveal secret values in diff</span>
            </label>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 1fr 120px',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              <span>Variable</span>
              <span>{envA?.name || 'Environment A'}</span>
              <span>{envB?.name || 'Environment B'}</span>
              <span>Status</span>
            </div>

            {diffItems.map((item) => {
              const displayValA = item.isSecret && !revealComparisonSecrets ? '••••••••' : item.valA ?? '—';
              const displayValB = item.isSecret && !revealComparisonSecrets ? '••••••••' : item.valB ?? '—';

              return (
                <div
                  key={item.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr 1fr 120px',
                    gap: 8,
                    padding: '8px 12px',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.key}</span>
                  <span style={{ color: item.valA !== undefined ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {displayValA}
                  </span>
                  <span style={{ color: item.valB !== undefined ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {displayValB}
                  </span>
                  <div>
                    {item.status === 'identical' && (
                      <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>✓ Same</span>
                    )}
                    {item.status === 'different' && (
                      <span style={{ color: 'var(--warning)', fontSize: 11, fontWeight: 600 }}>≠ Different</span>
                    )}
                    {item.status === 'only_in_a' && (
                      <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>Missing in B</span>
                    )}
                    {item.status === 'only_in_b' && (
                      <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>Missing in A</span>
                    )}
                  </div>
                </div>
              );
            })}

            {diffItems.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                No variables to compare.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
