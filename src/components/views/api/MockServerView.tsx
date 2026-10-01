import React, { useState, useMemo } from 'react';
import {
  Server,
  Plus,
  Play,
  Copy,
  Trash2,
  Check,
  Search,
  Sliders,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { executeMockSimulation } from '@/services/mockServer';
import type { HttpMethod, MockScenario } from '@/types/api';

export const MockServerView: React.FC = () => {
  const {
    mockEndpoints,
    mockLogs,
    addMockEndpoint,
    updateMockEndpoint,
    deleteMockEndpoint,
    duplicateMockEndpoint,
    addMockLog,
    clearMockLogs,
  } = useWorkspace();
  const { showToast } = useToast();

  // Selected endpoint
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(() => {
    return mockEndpoints[0]?.id || 'mock-users';
  });

  const activeEndpoint = useMemo(() => {
    return mockEndpoints.find((e) => e.id === selectedEndpointId) || mockEndpoints[0];
  }, [mockEndpoints, selectedEndpointId]);

  // Working state for active scenario editing
  const activeScenario = useMemo(() => {
    if (!activeEndpoint) return null;
    return (
      activeEndpoint.scenarios.find((s) => s.id === activeEndpoint.activeScenarioId) ||
      activeEndpoint.scenarios[0]
    );
  }, [activeEndpoint]);

  // Simulation test runner state
  const [testMethod, setTestMethod] = useState<HttpMethod>('GET');
  const [testPath, setTestPath] = useState('/api/v1/users');
  const [testBody, setTestBody] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    delayMs: number;
    matchedEndpointName: string;
  } | null>(null);

  // Filter for mock logs
  const [logSearch, setLogSearch] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Create new endpoint
  const handleCreateEndpoint = () => {
    const defaultScenario: MockScenario = {
      id: `sc-${Date.now()}`,
      name: '200 OK Default',
      status: 200,
      statusText: 'OK',
      headers: [{ id: 'h-1', key: 'Content-Type', value: 'application/json', enabled: true }],
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Success from mock endpoint', timestamp: Date.now() }, null, 2),
      delayMs: 50,
      isDefault: true,
    };

    const newEp = addMockEndpoint({
      name: 'New Mock Endpoint',
      method: 'GET',
      path: '/api/v1/resource',
      description: 'Local simulated route',
      enabled: true,
      scenarios: [defaultScenario],
      activeScenarioId: defaultScenario.id,
    });

    setSelectedEndpointId(newEp.id);
    setTestPath(newEp.path);
    setTestMethod(newEp.method);
    showToast('Mock endpoint created', 'success', 2000);
  };

  // Add scenario to active endpoint
  const handleAddScenario = () => {
    if (!activeEndpoint) return;
    const newSc: MockScenario = {
      id: `sc-${Date.now()}`,
      name: 'New Scenario',
      status: 200,
      statusText: 'OK',
      headers: [{ id: `h-${Date.now()}`, key: 'Content-Type', value: 'application/json', enabled: true }],
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }, null, 2),
      delayMs: 30,
      isDefault: false,
    };

    updateMockEndpoint(activeEndpoint.id, {
      scenarios: [...activeEndpoint.scenarios, newSc],
      activeScenarioId: newSc.id,
    });
    showToast('New scenario added', 'info', 1500);
  };

  // Update active scenario
  const handleUpdateActiveScenario = (updates: Partial<MockScenario>) => {
    if (!activeEndpoint || !activeScenario) return;
    const updatedScenarios = activeEndpoint.scenarios.map((s) =>
      s.id === activeScenario.id ? { ...s, ...updates } : s
    );
    updateMockEndpoint(activeEndpoint.id, {
      scenarios: updatedScenarios,
    });
  };

  // Switch active scenario
  const handleSelectScenario = (scId: string) => {
    if (!activeEndpoint) return;
    updateMockEndpoint(activeEndpoint.id, {
      activeScenarioId: scId,
    });
    showToast('Active mock scenario changed', 'info', 1500);
  };

  // Format active scenario JSON
  const handleFormatJson = () => {
    if (!activeScenario) return;
    try {
      const parsed = JSON.parse(activeScenario.body);
      handleUpdateActiveScenario({ body: JSON.stringify(parsed, null, 2) });
      showToast('JSON beautified', 'success', 1500);
    } catch {
      showToast('Invalid JSON syntax', 'warning', 2000);
    }
  };

  // Run simulation against local mock server
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await executeMockSimulation(
        testMethod,
        testPath,
        {},
        testBody,
        mockEndpoints
      );

      setSimulationResult({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        body: res.body,
        delayMs: res.delayMs,
        matchedEndpointName: res.matchedEndpoint?.name || 'No Matching Endpoint (404)',
      });

      // Add to mock logs
      addMockLog({
        id: `mlog-${Date.now()}`,
        endpointId: res.matchedEndpoint?.id,
        method: testMethod,
        path: testPath,
        timestamp: new Date().toISOString(),
        status: res.status,
        timeMs: res.delayMs,
        headers: res.headers,
        query: {},
        body: res.body,
      });

      showToast(`Mock response: ${res.status} ${res.statusText}`, 'success', 2000);
    } catch (err: any) {
      showToast(err.message || 'Simulation error', 'error', 3000);
    } finally {
      setIsSimulating(false);
    }
  };

  // Copy body
  const handleCopyBody = () => {
    if (!activeScenario) return;
    navigator.clipboard.writeText(activeScenario.body);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    showToast('Mock response body copied', 'success', 1500);
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return mockLogs;
    const q = logSearch.toLowerCase();
    return mockLogs.filter((l) => l.path.toLowerCase().includes(q) || l.method.toLowerCase().includes(q));
  }, [mockLogs, logSearch]);

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET':
        return 'var(--success)';
      case 'POST':
        return 'var(--accent)';
      case 'PUT':
      case 'PATCH':
        return 'var(--warning)';
      case 'DELETE':
        return 'var(--danger)';
      default:
        return 'var(--text-muted)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(52, 152, 219, 0.15)',
              color: 'var(--accent)',
            }}
          >
            <Server size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Local Mock Server</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  backgroundColor: 'rgba(46, 204, 113, 0.15)',
                  color: 'var(--success)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid var(--success)',
                }}
              >
                <Shield size={11} /> Browser Simulation Active
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Deterministic in-browser endpoint routing with multi-scenario response simulation
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleCreateEndpoint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> New Endpoint
          </button>
        </div>
      </div>

      {/* Main 3-column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 340px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left Column: Endpoints List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Routes ({mockEndpoints.length})</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mockEndpoints.map((ep) => {
              const isSelected = ep.id === selectedEndpointId;
              return (
                <div
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpointId(ep.id);
                    setTestPath(ep.path);
                    setTestMethod(ep.method);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'rgba(52, 152, 219, 0.15)' : 'var(--bg-card)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: getMethodColor(ep.method),
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ep.method}
                      </span>
                      <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{ep.name}</strong>
                    </div>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: ep.enabled ? 'var(--success)' : 'var(--text-muted)',
                      }}
                      title={ep.enabled ? 'Route active' : 'Route disabled'}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ep.path}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Active Endpoint & Scenario Editor */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {activeEndpoint ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: 16, gap: 16 }}>
              {/* Endpoint Meta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'var(--bg-surface)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <select
                  value={activeEndpoint.method}
                  onChange={(e) => updateMockEndpoint(activeEndpoint.id, { method: e.target.value as HttpMethod })}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: getMethodColor(activeEndpoint.method),
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <input
                  type="text"
                  value={activeEndpoint.path}
                  onChange={(e) => updateMockEndpoint(activeEndpoint.id, { path: e.target.value })}
                  placeholder="/api/v1/users/:id"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeEndpoint.enabled}
                    onChange={(e) => updateMockEndpoint(activeEndpoint.id, { enabled: e.target.checked })}
                  />
                  <span>Enabled</span>
                </label>

                <button
                  onClick={() => duplicateMockEndpoint(activeEndpoint.id)}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  title="Duplicate Endpoint"
                >
                  <Copy size={13} />
                </button>

                {mockEndpoints.length > 1 && (
                  <button
                    onClick={() => {
                      deleteMockEndpoint(activeEndpoint.id);
                      const rem = mockEndpoints.filter((e) => e.id !== activeEndpoint.id);
                      if (rem.length > 0) setSelectedEndpointId(rem[0].id);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                    }}
                    title="Delete Endpoint"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Scenarios Section */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backgroundColor: 'var(--bg-surface)',
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Sliders size={14} style={{ color: 'var(--accent)' }} />
                    <span>Response Scenarios ({activeEndpoint.scenarios.length})</span>
                  </div>
                  <button
                    onClick={handleAddScenario}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Plus size={12} /> Add Scenario
                  </button>
                </div>

                {/* Scenario Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeEndpoint.scenarios.map((sc) => {
                    const isActive = sc.id === activeEndpoint.activeScenarioId;
                    return (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectScenario(sc.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-card)',
                          color: isActive ? '#ffffff' : 'var(--text-secondary)',
                          border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <span>{sc.status}</span>
                        <span>{sc.name}</span>
                        {isActive && <Check size={11} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Scenario Details Editor */}
              {activeScenario && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    backgroundColor: 'var(--bg-surface)',
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    flex: 1,
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Scenario Name
                      </label>
                      <input
                        type="text"
                        value={activeScenario.name}
                        onChange={(e) => handleUpdateActiveScenario({ name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Status Code
                      </label>
                      <input
                        type="number"
                        value={activeScenario.status}
                        onChange={(e) => handleUpdateActiveScenario({ status: parseInt(e.target.value, 10) || 200 })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Latency Delay (ms)
                      </label>
                      <input
                        type="number"
                        value={activeScenario.delayMs}
                        onChange={(e) => handleUpdateActiveScenario({ delayMs: parseInt(e.target.value, 10) || 0 })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Body Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Response Body (JSON / Text)
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={handleFormatJson}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 11,
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Format JSON
                        </button>
                        <button
                          onClick={handleCopyBody}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 11,
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {hasCopied ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                          Copy
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={activeScenario.body}
                      onChange={(e) => handleUpdateActiveScenario({ body: e.target.value })}
                      style={{
                        flex: 1,
                        minHeight: 180,
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 10,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Select or create a mock endpoint to configure responses
            </div>
          )}
        </div>

        {/* Right Column: Interactive Sandbox & Request Log */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {/* Top: Simulation Runner */}
          <div
            style={{
              padding: 12,
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>Simulate Call</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value as HttpMethod)}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: getMethodColor(testMethod),
                  outline: 'none',
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder="/api/v1/users"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                }}
              >
                {isSimulating ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                Test
              </button>
            </div>

            {testMethod !== 'GET' && (
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder="Request JSON or text body..."
                style={{
                  height: 60,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            )}

            {simulationResult && (
              <div
                style={{
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: simulationResult.status === 200 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {simulationResult.status} {simulationResult.statusText}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{simulationResult.delayMs}ms</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  Matched: {simulationResult.matchedEndpointName}
                </div>
              </div>
            )}
          </div>

          {/* Bottom: Request Logs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: 11,
                fontWeight: 600,
                gap: 6,
              }}
            >
              <span>Logs ({mockLogs.length})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'var(--bg-card)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Search size={11} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: 10,
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      width: 70,
                    }}
                  />
                </div>
                <button
                  onClick={clearMockLogs}
                  disabled={mockLogs.length === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: mockLogs.length === 0 ? 'default' : 'pointer',
                    padding: 2,
                  }}
                  title="Clear Logs"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {mockLogs.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    fontSize: 11,
                  }}
                >
                  No mock calls dispatched yet
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: getMethodColor(log.method) }}>{log.method}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{log.path}</span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: log.status >= 200 && log.status < 300 ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 10 }}>
                      <span>{log.timeMs}ms</span>
                      <span>{log.timestamp.split('T')[1]?.substring(0, 8)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
