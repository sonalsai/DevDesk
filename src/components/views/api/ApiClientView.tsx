import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Save,
  Plus,
  X,
  Trash2,
  Copy,
  Download,
  Code2,
  Terminal,
  Search,
  Check,
  StopCircle,
  ListTree,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import type {
  HttpMethod,
  KeyValueParam,
  BodyType,
  AuthType,
  ApiRequest,
} from '../../../types/api';
import { executeApiRequest, createSanitizedHistoryItem } from '../../../services/apiExecutor';
import { CurlToolkitModal } from './CurlToolkitModal';
import { CodeGenerationModal } from './CodeGenerationModal';
import { JsonPathExplorer } from './JsonPathExplorer';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const COMMON_HEADERS = [
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Origin',
  'User-Agent',
  'X-API-Key',
  'X-Requested-With',
  'X-CSRF-Token',
];

export const ApiClientView: React.FC = () => {
  const {
    apiTabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    createNewTab,
    closeTab,
    updateTabRequest,
    updateTabResponse,
    setTabLoading,
    activeEnvironment,
    setActiveEnvironmentId,
    data,
    addApiRequest,
    updateApiRequest,
    addApiHistoryItem,
  } = useWorkspace();

  const { showToast } = useToast();

  const activeRequest = activeTab?.request;
  const response = activeTab?.response;
  const isLoading = activeTab?.isLoading || false;

  // Active sub-tabs
  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'auth' | 'body'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'raw' | 'path'>('body');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Response search
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Variable autocomplete state
  const [showVarSuggestions, setShowVarSuggestions] = useState(false);
  const [varFilter, setVarFilter] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync params to URL and vice-versa
  const isSyncingRef = useRef(false);

  const updateCurrentRequest = useCallback((updates: Partial<ApiRequest>) => {
    if (!activeTabId) return;
    updateTabRequest(activeTabId, updates);
  }, [activeTabId, updateTabRequest]);

  // Sync from URL changes to Params table
  const handleUrlChange = (newUrl: string) => {
    if (!activeRequest) return;
    if (isSyncingRef.current) return;

    // Check for variable autocomplete trigger
    const cursor = urlInputRef.current?.selectionStart || 0;
    const textBeforeCursor = newUrl.slice(0, cursor);
    const lastVarTrigger = textBeforeCursor.lastIndexOf('{{');

    if (lastVarTrigger !== -1 && !textBeforeCursor.slice(lastVarTrigger).includes('}}')) {
      const query = textBeforeCursor.slice(lastVarTrigger + 2);
      setVarFilter(query);
      setShowVarSuggestions(true);
    } else {
      setShowVarSuggestions(false);
    }

    try {
      isSyncingRef.current = true;
      const questionIndex = newUrl.indexOf('?');
      if (questionIndex !== -1) {
        const searchStr = newUrl.slice(questionIndex + 1);
        const searchParams = new URLSearchParams(searchStr);
        const newParams: KeyValueParam[] = [];
        searchParams.forEach((val, key) => {
          newParams.push({ id: `p-${Date.now()}-${Math.random()}`, key, value: val, enabled: true });
        });
        updateCurrentRequest({ url: newUrl, params: newParams });
      } else {
        updateCurrentRequest({ url: newUrl });
      }
    } catch {
      updateCurrentRequest({ url: newUrl });
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Sync from Params table to URL
  const handleParamsChange = (newParams: KeyValueParam[]) => {
    if (!activeRequest) return;
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    try {
      const baseUrl = activeRequest.url.split('?')[0] || '';
      const enabledParams = newParams.filter((p) => p.enabled && p.key.trim() !== '');

      if (enabledParams.length > 0) {
        const queryParts = enabledParams.map(
          (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
        );
        const newUrl = `${baseUrl}?${queryParts.join('&')}`;
        updateCurrentRequest({ params: newParams, url: newUrl });
      } else {
        updateCurrentRequest({ params: newParams, url: baseUrl });
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Insert variable into URL
  const insertVariable = (varName: string) => {
    if (!activeRequest || !urlInputRef.current) return;
    const cursor = urlInputRef.current.selectionStart || 0;
    const currentUrl = activeRequest.url;
    const textBeforeCursor = currentUrl.slice(0, cursor);
    const lastVarTrigger = textBeforeCursor.lastIndexOf('{{');

    if (lastVarTrigger !== -1) {
      const before = currentUrl.slice(0, lastVarTrigger);
      const after = currentUrl.slice(cursor);
      const updated = `${before}{{${varName}}}${after}`;
      updateCurrentRequest({ url: updated });
    }
    setShowVarSuggestions(false);
  };

  // Execute request
  const handleSend = async () => {
    if (!activeRequest || !activeTabId) return;
    if (!activeRequest.url.trim()) {
      showToast('Please enter a request URL', 'info');
      return;
    }

    setTabLoading(activeTabId, true);
    updateTabResponse(activeTabId, null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await executeApiRequest({
        request: activeRequest,
        environment: activeEnvironment,
        signal: controller.signal,
      });

      updateTabResponse(activeTabId, res);

      // Add to sanitized history
      const historyItem = createSanitizedHistoryItem(activeRequest, res);
      addApiHistoryItem(historyItem);

      if (res.status >= 200 && res.status < 400) {
        showToast(`${res.status} ${res.statusText} (${res.timeMs}ms)`, 'success', 2000);
      } else if (res.status === 0) {
        showToast('Request failed or was blocked (see details)', 'error', 3000);
      } else {
        showToast(`${res.status} ${res.statusText}`, 'info', 2000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Request cancelled by user', 'info', 2000);
      } else {
        showToast(err.message || 'Request execution error', 'error', 3000);
      }
    } finally {
      setTabLoading(activeTabId, false);
      abortControllerRef.current = null;
    }
  };

  // Cancel request
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      if (activeTabId) {
        setTabLoading(activeTabId, false);
      }
    }
  };

  // Save request to collection
  const handleSave = () => {
    if (!activeRequest) return;
    if (data.apiCollections.length === 0) {
      showToast('Please create an API collection first from the Collections view', 'info');
      return;
    }

    const collectionId = activeRequest.collectionId || data.apiCollections[0].id;
    const existingReq = data.apiRequests.find((r) => r.id === activeRequest.id);

    if (existingReq) {
      updateApiRequest(activeRequest.id, {
        ...activeRequest,
        collectionId,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Request "${activeRequest.name}" updated`, 'success', 1500);
    } else {
      addApiRequest({
        ...activeRequest,
        collectionId,
      });
      showToast(`Request "${activeRequest.name}" saved to collection`, 'success', 1500);
    }
  };

  // Copy response
  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.data);
    setCopiedResponse(true);
    showToast('Response body copied to clipboard', 'info', 1500);
    setTimeout(() => setCopiedResponse(false), 1500);
  };

  // Download response
  const handleDownloadResponse = () => {
    if (!response) return;
    const blob = new Blob([response.data], { type: response.contentType || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.${response.contentType.includes('json') ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded response file', 'success', 1500);
  };

  // Format/Minify JSON body
  const handleFormatJsonBody = () => {
    if (!activeRequest || activeRequest.body.type !== 'json') return;
    try {
      const parsed = JSON.parse(activeRequest.body.jsonContent);
      updateCurrentRequest({
        body: {
          ...activeRequest.body,
          jsonContent: JSON.stringify(parsed, null, 2),
        },
      });
      showToast('JSON formatted', 'info', 1000);
    } catch {
      showToast('Invalid JSON in body', 'error');
    }
  };

  const handleMinifyJsonBody = () => {
    if (!activeRequest || activeRequest.body.type !== 'json') return;
    try {
      const parsed = JSON.parse(activeRequest.body.jsonContent);
      updateCurrentRequest({
        body: {
          ...activeRequest.body,
          jsonContent: JSON.stringify(parsed),
        },
      });
      showToast('JSON minified', 'info', 1000);
    } catch {
      showToast('Invalid JSON in body', 'error');
    }
  };

  // Autocomplete variables from active environment
  const filteredVars = useMemo(() => {
    if (!activeEnvironment) return [];
    return activeEnvironment.variables.filter((v) =>
      v.key.toLowerCase().includes(varFilter.toLowerCase())
    );
  }, [activeEnvironment, varFilter]);

  // Keyboard shortcut listener: Cmd/Ctrl + Enter to send
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeRequest, activeEnvironment, activeTabId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!activeRequest) {
    return (
      <div className="view-container">
        <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
          <h3>No request selected</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Create a new request or open one from your collections to begin testing APIs.
          </p>
          <button className="btn btn-primary" onClick={() => createNewTab()}>
            <Plus size={14} />
            <span>Create API Request</span>
          </button>
        </div>
      </div>
    );
  }

  // Parse JSON data for JSON path explorer
  let parsedJsonData: any = undefined;
  if (response && response.data) {
    try {
      parsedJsonData = JSON.parse(response.data);
    } catch {
      parsedJsonData = undefined;
    }
  }

  const responseText = response?.data || '';
  const searchMatches = searchQuery.trim() && responseText
    ? (responseText.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
      {/* Request Tabs Bar */}
      <div className="api-tabs-bar" style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
        {apiTabs.map((tab) => (
          <div
            key={tab.id}
            className={`api-tab-pill ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              cursor: 'pointer',
              background: tab.id === activeTabId ? 'var(--bg-elevated)' : 'transparent',
              border: tab.id === activeTabId ? '1px solid var(--border-subtle)' : '1px solid transparent',
              color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color:
                  tab.request.method === 'GET'
                    ? 'var(--success)'
                    : tab.request.method === 'POST'
                    ? 'var(--accent-hover)'
                    : tab.request.method === 'DELETE'
                    ? 'var(--danger)'
                    : 'var(--warning)',
              }}
            >
              {tab.request.method}
            </span>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tab.title}
            </span>
            {tab.isDirty && <span style={{ color: 'var(--accent-hover)', fontSize: 14 }}>•</span>}
            {apiTabs.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  opacity: 0.6,
                }}
                title="Close tab"
              >
                <X size={12} />
              </span>
            )}
          </div>
        ))}

        <button
          className="btn btn-sm btn-ghost"
          onClick={() => createNewTab()}
          title="New request tab"
          style={{ padding: '4px 8px' }}
        >
          <Plus size={14} />
        </button>

        {/* Environment Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Env:</span>
          <select
            className="input-select"
            value={activeEnvironment?.id || ''}
            onChange={(e) => setActiveEnvironmentId(e.target.value)}
            style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
          >
            <option value="">No Environment</option>
            {data.environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Request Bar: Method + URL + Send/Cancel + Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="input-select"
          value={activeRequest.method}
          onChange={(e) => updateCurrentRequest({ method: e.target.value as HttpMethod })}
          style={{
            fontWeight: 700,
            fontSize: 13,
            width: 100,
            color:
              activeRequest.method === 'GET'
                ? 'var(--success)'
                : activeRequest.method === 'POST'
                ? 'var(--accent-hover)'
                : activeRequest.method === 'DELETE'
                ? 'var(--danger)'
                : 'var(--warning)',
          }}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* URL Input with autocomplete */}
        <div style={{ flex: 1, position: 'relative', minWidth: 260 }}>
          <input
            ref={urlInputRef}
            type="text"
            className="input-field"
            placeholder="https://api.example.com/v1/resource or {{base_url}}/users"
            value={activeRequest.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, paddingRight: 30 }}
          />

          {/* Autocomplete Dropdown */}
          {showVarSuggestions && filteredVars.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                zIndex: 100,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                maxHeight: 180,
                overflowY: 'auto',
              }}
            >
              <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                Environment Variables ({activeEnvironment?.name || 'Active'})
              </div>
              {filteredVars.map((v) => (
                <div
                  key={v.id}
                  onClick={() => insertVariable(v.key)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  className="autocomplete-item"
                >
                  <span style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>{'{{' + v.key + '}}'}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {v.isSecret ? '••••••••' : v.value || 'empty'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send / Cancel */}
        {isLoading ? (
          <button className="btn btn-danger" onClick={handleCancel}>
            <StopCircle size={14} />
            <span>Cancel</span>
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSend} title="Send request (⌘+Enter)">
            <Send size={14} />
            <span>Send</span>
          </button>
        )}

        {/* Save */}
        <button className="btn btn-secondary" onClick={handleSave} title="Save to collection (⌘+S)">
          <Save size={14} />
          <span>Save</span>
        </button>

        {/* cURL Toolkit */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowCurlModal(true)}
          title="cURL Import & Export"
        >
          <Terminal size={14} />
          <span>cURL</span>
        </button>

        {/* Code Generator */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowCodeModal(true)}
          title="Generate multi-language code snippets"
        >
          <Code2 size={14} />
          <span>Code</span>
        </button>
      </div>

      {/* Split Panel Layout */}
      <div className="api-split-layout">
        {/* LEFT / TOP: REQUEST BUILDER */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
            background: 'var(--bg-surface)',
          }}
        >
          {/* Request Sub-tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '6px 12px 0 12px',
              gap: 8,
              background: 'var(--bg-elevated)',
            }}
          >
            {(['params', 'headers', 'auth', 'body'] as const).map((tab) => {
              const count =
                tab === 'params'
                  ? activeRequest.params.filter((p) => p.enabled && p.key).length
                  : tab === 'headers'
                  ? activeRequest.headers.filter((h) => h.enabled && h.key).length
                  : 0;

              return (
                <button
                  key={tab}
                  className={`btn-subtab ${requestTab === tab ? 'active' : ''}`}
                  onClick={() => setRequestTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: requestTab === tab ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    borderBottom: requestTab === tab ? '2px solid var(--accent-hover)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: 'var(--border-subtle)',
                        padding: '1px 5px',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sub-tab Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {/* PARAMS TAB */}
            {requestTab === 'params' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Query Parameters (Auto-synced with URL)</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      const newP = [...activeRequest.params, { id: `p-${Date.now()}`, key: '', value: '', enabled: true }];
                      handleParamsChange(newP);
                    }}
                  >
                    <Plus size={12} /> Add Param
                  </button>
                </div>

                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {activeRequest.params.map((param, index) => (
                    <div
                      key={param.id || index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 1fr 32px',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderBottom: index < activeRequest.params.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: index % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) => {
                          const updated = [...activeRequest.params];
                          updated[index] = { ...param, enabled: e.target.checked };
                          handleParamsChange(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Key"
                        value={param.key}
                        className="input-field"
                        style={{ height: 26, fontSize: 12 }}
                        onChange={(e) => {
                          const updated = [...activeRequest.params];
                          updated[index] = { ...param, key: e.target.value };
                          handleParamsChange(updated);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. {{user_id}})"
                        value={param.value}
                        className="input-field"
                        style={{ height: 26, fontSize: 12 }}
                        onChange={(e) => {
                          const updated = [...activeRequest.params];
                          updated[index] = { ...param, value: e.target.value };
                          handleParamsChange(updated);
                        }}
                      />
                      <button
                        className="btn-icon"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        onClick={() => {
                          const updated = activeRequest.params.filter((_, i) => i !== index);
                          handleParamsChange(updated);
                        }}
                        title="Delete parameter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {activeRequest.params.length === 0 && (
                    <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      No query parameters. Click "+ Add Param" to add one.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HEADERS TAB */}
            {requestTab === 'headers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>HTTP Headers</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      const newH = [...activeRequest.headers, { id: `h-${Date.now()}`, key: '', value: '', enabled: true }];
                      updateCurrentRequest({ headers: newH });
                    }}
                  >
                    <Plus size={12} /> Add Header
                  </button>
                </div>

                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {activeRequest.headers.map((header, index) => (
                    <div
                      key={header.id || index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 1fr 32px',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderBottom: index < activeRequest.headers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: index % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => {
                          const updated = [...activeRequest.headers];
                          updated[index] = { ...header, enabled: e.target.checked };
                          updateCurrentRequest({ headers: updated });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Header (e.g. Content-Type)"
                        list="common-headers-list"
                        value={header.key}
                        className="input-field"
                        style={{ height: 26, fontSize: 12 }}
                        onChange={(e) => {
                          const updated = [...activeRequest.headers];
                          updated[index] = { ...header, key: e.target.value };
                          updateCurrentRequest({ headers: updated });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. application/json or {{token}})"
                        value={header.value}
                        className="input-field"
                        style={{ height: 26, fontSize: 12 }}
                        onChange={(e) => {
                          const updated = [...activeRequest.headers];
                          updated[index] = { ...header, value: e.target.value };
                          updateCurrentRequest({ headers: updated });
                        }}
                      />
                      <button
                        className="btn-icon"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        onClick={() => {
                          const updated = activeRequest.headers.filter((_, i) => i !== index);
                          updateCurrentRequest({ headers: updated });
                        }}
                        title="Delete header"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {activeRequest.headers.length === 0 && (
                    <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      No custom headers. Click "+ Add Header" to define headers.
                    </div>
                  )}
                </div>

                <datalist id="common-headers-list">
                  {COMMON_HEADERS.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
              </div>
            )}

            {/* AUTH TAB */}
            {requestTab === 'auth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Type:</span>
                  <select
                    className="input-select"
                    value={activeRequest.auth.type}
                    onChange={(e) => {
                      updateCurrentRequest({
                        auth: {
                          ...activeRequest.auth,
                          type: e.target.value as AuthType,
                        },
                      });
                    }}
                    style={{ width: 140, fontSize: 12 }}
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apikey">API Key</option>
                  </select>
                </div>

                {activeRequest.auth.type === 'bearer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Token</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="eyJhbGci... or {{token}}"
                      value={activeRequest.auth.bearerToken || ''}
                      onChange={(e) =>
                        updateCurrentRequest({
                          auth: { ...activeRequest.auth, bearerToken: e.target.value },
                        })
                      }
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Supports variable references like <code>{'{{token}}'}</code>. Not saved in request history.
                    </span>
                  </div>
                )}

                {activeRequest.auth.type === 'basic' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Username</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="admin or {{username}}"
                        value={activeRequest.auth.basicUsername || ''}
                        onChange={(e) =>
                          updateCurrentRequest({
                            auth: { ...activeRequest.auth, basicUsername: e.target.value },
                          })
                        }
                        style={{ fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Password</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="•••••••• or {{password}}"
                        value={activeRequest.auth.basicPassword || ''}
                        onChange={(e) =>
                          updateCurrentRequest({
                            auth: { ...activeRequest.auth, basicPassword: e.target.value },
                          })
                        }
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

                {activeRequest.auth.type === 'apikey' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Key</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="X-API-Key or api_key"
                          value={activeRequest.auth.apiKeyName || ''}
                          onChange={(e) =>
                            updateCurrentRequest({
                              auth: { ...activeRequest.auth, apiKeyName: e.target.value },
                            })
                          }
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Value</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="secret_xyz or {{api_key}}"
                          value={activeRequest.auth.apiKeyValue || ''}
                          onChange={(e) =>
                            updateCurrentRequest({
                              auth: { ...activeRequest.auth, apiKeyValue: e.target.value },
                            })
                          }
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Add to:</span>
                      <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="radio"
                          name="apiKeyLocation"
                          checked={activeRequest.auth.apiKeyHeaderOrQuery !== 'query'}
                          onChange={() =>
                            updateCurrentRequest({
                              auth: { ...activeRequest.auth, apiKeyHeaderOrQuery: 'header' },
                            })
                          }
                        />
                        Header
                      </label>
                      <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="radio"
                          name="apiKeyLocation"
                          checked={activeRequest.auth.apiKeyHeaderOrQuery === 'query'}
                          onChange={() =>
                            updateCurrentRequest({
                              auth: { ...activeRequest.auth, apiKeyHeaderOrQuery: 'query' },
                            })
                          }
                        />
                        Query Parameter
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BODY TAB */}
            {requestTab === 'body' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                {/* Body Type Selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['none', 'json', 'form-urlencoded', 'multipart', 'raw'] as BodyType[]).map((type) => (
                      <button
                        key={type}
                        className={`btn btn-sm ${activeRequest.body.type === type ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() =>
                          updateCurrentRequest({
                            body: { ...activeRequest.body, type },
                          })
                        }
                        style={{ fontSize: 11, padding: '3px 8px' }}
                      >
                        {type === 'none' ? 'None' : type === 'form-urlencoded' ? 'Form URL-encoded' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {activeRequest.body.type === 'json' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-ghost" onClick={handleFormatJsonBody} title="Prettify JSON">
                        Format
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={handleMinifyJsonBody} title="Minify JSON">
                        Minify
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Editors */}
                {activeRequest.body.type === 'none' && (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    This request does not include a body payload.
                  </div>
                )}

                {activeRequest.body.type === 'json' && (
                  <textarea
                    className="tool-editor-area"
                    value={activeRequest.body.jsonContent}
                    onChange={(e) =>
                      updateCurrentRequest({
                        body: { ...activeRequest.body, jsonContent: e.target.value },
                      })
                    }
                    placeholder={`{\n  "key": "value"\n}`}
                    style={{
                      minHeight: 180,
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    spellCheck={false}
                  />
                )}

                {activeRequest.body.type === 'raw' && (
                  <textarea
                    className="tool-editor-area"
                    value={activeRequest.body.rawText}
                    onChange={(e) =>
                      updateCurrentRequest({
                        body: { ...activeRequest.body, rawText: e.target.value },
                      })
                    }
                    placeholder="Raw plain text payload..."
                    style={{
                      minHeight: 180,
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    spellCheck={false}
                  />
                )}

                {(activeRequest.body.type === 'form-urlencoded' || activeRequest.body.type === 'multipart') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {activeRequest.body.type === 'multipart' ? 'Multipart Form Data' : 'URL-Encoded Key/Values'}
                      </span>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          if (activeRequest.body.type === 'multipart') {
                            const currentItems = activeRequest.body.multipartParams || [];
                            const updated = [...currentItems, { id: `f-${Date.now()}`, key: '', value: '', enabled: true }];
                            updateCurrentRequest({
                              body: { ...activeRequest.body, multipartParams: updated },
                            });
                          } else {
                            const currentItems = activeRequest.body.formParams || [];
                            const updated = [...currentItems, { id: `f-${Date.now()}`, key: '', value: '', enabled: true }];
                            updateCurrentRequest({
                              body: { ...activeRequest.body, formParams: updated },
                            });
                          }
                        }}
                      >
                        <Plus size={12} /> Add Field
                      </button>
                    </div>

                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      {(activeRequest.body.type === 'multipart'
                        ? activeRequest.body.multipartParams || []
                        : activeRequest.body.formParams || []
                      ).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '32px 1fr 1fr 32px',
                            gap: 6,
                            padding: '4px 8px',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => {
                              if (activeRequest.body.type === 'multipart') {
                                const updated = [...(activeRequest.body.multipartParams || [])];
                                updated[idx] = { ...item, enabled: e.target.checked };
                                updateCurrentRequest({ body: { ...activeRequest.body, multipartParams: updated } });
                              } else {
                                const updated = [...(activeRequest.body.formParams || [])];
                                updated[idx] = { ...item, enabled: e.target.checked };
                                updateCurrentRequest({ body: { ...activeRequest.body, formParams: updated } });
                              }
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Key"
                            className="input-field"
                            style={{ height: 26, fontSize: 12 }}
                            value={item.key}
                            onChange={(e) => {
                              if (activeRequest.body.type === 'multipart') {
                                const updated = [...(activeRequest.body.multipartParams || [])];
                                updated[idx] = { ...item, key: e.target.value };
                                updateCurrentRequest({ body: { ...activeRequest.body, multipartParams: updated } });
                              } else {
                                const updated = [...(activeRequest.body.formParams || [])];
                                updated[idx] = { ...item, key: e.target.value };
                                updateCurrentRequest({ body: { ...activeRequest.body, formParams: updated } });
                              }
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            className="input-field"
                            style={{ height: 26, fontSize: 12 }}
                            value={item.value}
                            onChange={(e) => {
                              if (activeRequest.body.type === 'multipart') {
                                const updated = [...(activeRequest.body.multipartParams || [])];
                                updated[idx] = { ...item, value: e.target.value };
                                updateCurrentRequest({ body: { ...activeRequest.body, multipartParams: updated } });
                              } else {
                                const updated = [...(activeRequest.body.formParams || [])];
                                updated[idx] = { ...item, value: e.target.value };
                                updateCurrentRequest({ body: { ...activeRequest.body, formParams: updated } });
                              }
                            }}
                          />
                          <button
                            className="btn-icon"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                            onClick={() => {
                              if (activeRequest.body.type === 'multipart') {
                                const updated = (activeRequest.body.multipartParams || []).filter((_, i) => i !== idx);
                                updateCurrentRequest({ body: { ...activeRequest.body, multipartParams: updated } });
                              } else {
                                const updated = (activeRequest.body.formParams || []).filter((_, i) => i !== idx);
                                updateCurrentRequest({ body: { ...activeRequest.body, formParams: updated } });
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / BOTTOM: RESPONSE VIEWER */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
            background: 'var(--bg-surface)',
          }}
        >
          {/* Response Status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            {response ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor:
                      response.status >= 200 && response.status < 300
                        ? 'rgba(46, 204, 113, 0.15)'
                        : response.status >= 400
                        ? 'rgba(231, 76, 60, 0.15)'
                        : 'rgba(241, 196, 15, 0.15)',
                    color:
                      response.status >= 200 && response.status < 300
                        ? 'var(--success)'
                        : response.status >= 400
                        ? 'var(--danger)'
                        : 'var(--warning)',
                  }}
                >
                  {response.status} {response.statusText}
                </span>

                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Time: <strong style={{ color: 'var(--text-primary)' }}>{response.timeMs} ms</strong>
                </span>

                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Size: <strong style={{ color: 'var(--text-primary)' }}>{(response.sizeBytes / 1024).toFixed(2)} KB</strong>
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {isLoading ? 'Executing request...' : 'No response yet'}
              </span>
            )}

            {response && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={handleCopyResponse}
                  title="Copy response body"
                >
                  {copiedResponse ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={handleDownloadResponse}
                  title="Download response"
                >
                  <Download size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Sub-tabs & Search */}
          {response && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {(['body', 'headers', 'raw', 'path'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`btn-subtab ${responseTab === tab ? 'active' : ''}`}
                    onClick={() => setResponseTab(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: responseTab === tab ? 'var(--accent-hover)' : 'var(--text-secondary)',
                      borderBottom: responseTab === tab ? '2px solid var(--accent-hover)' : '2px solid transparent',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {tab === 'path' && <ListTree size={12} />}
                    {tab === 'path' ? 'JSON Path' : tab}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search response..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ height: 24, fontSize: 11, paddingLeft: 22, width: 140 }}
                  />
                  <Search size={11} style={{ position: 'absolute', left: 7, top: 7, color: 'var(--text-tertiary)' }} />
                </div>
                {searchQuery && (
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {searchMatches} match{searchMatches === 1 ? '' : 'es'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content View */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {!response && !isLoading && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  gap: 8,
                }}
              >
                <Terminal size={32} />
                <span style={{ fontSize: 13 }}>Enter a URL and click "Send" to inspect the API response.</span>
                <span style={{ fontSize: 11 }}>Shortcut: <kbd>⌘</kbd> + <kbd>Enter</kbd></span>
              </div>
            )}

            {isLoading && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-hover)',
                  gap: 12,
                }}
              >
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <span style={{ fontSize: 13 }}>Sending request...</span>
              </div>
            )}

            {response && response.isError && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 12,
                  fontSize: 12,
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>
                  Request Did Not Complete: {response.errorType?.toUpperCase() || 'ERROR'}
                </div>
                <div>{response.errorMessage || response.data}</div>
              </div>
            )}

            {response && responseTab === 'body' && (
              <pre
                className="tool-editor-area"
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {parsedJsonData ? JSON.stringify(parsedJsonData, null, 2) : response.data}
              </pre>
            )}

            {response && responseTab === 'raw' && (
              <pre
                className="tool-editor-area"
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {response.data}
              </pre>
            )}

            {response && responseTab === 'headers' && (
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {Object.entries(response.headers).map(([key, val], idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr',
                      gap: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{key}:</span>
                    <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
                {Object.keys(response.headers).length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    No response headers exposed by server or browser CORS restrictions.
                  </div>
                )}
              </div>
            )}

            {response && responseTab === 'path' && (
              <JsonPathExplorer data={parsedJsonData || response.data} />
            )}
          </div>
        </div>
      </div>

      {/* cURL Toolkit Modal */}
      {showCurlModal && (
        <CurlToolkitModal
          isOpen={showCurlModal}
          onClose={() => setShowCurlModal(false)}
          currentRequest={activeRequest}
          environment={activeEnvironment}
          onImport={(parsed) => {
            updateCurrentRequest(parsed);
          }}
        />
      )}

      {/* Multi-language Code Generation Modal */}
      {showCodeModal && (
        <CodeGenerationModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          request={activeRequest}
          environment={activeEnvironment}
        />
      )}
    </div>
  );
};
