import React, { useState, useMemo, useCallback } from 'react';
import {
  Layers,
  Play,
  Copy,
  Download,
  Check,
  Plus,
  FolderPlus,
  Trash2,
  RefreshCw,
  Search,
  Code,
  FileText,
  AlertTriangle,
  Compass,
  Sliders,
  ChevronDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import {
  executeGraphQLQuery,
  runIntrospectionQuery,
  generateFieldQuery,
} from '@/services/graphqlExecutor';
import { interpolateVariables } from '@/services/environmentService';
import type { GraphQLIntrospectionResult } from '@/types/api';

export const GraphqlView: React.FC = () => {
  const {
    graphqlQueries,
    addGraphQLRequest,
    updateGraphQLRequest,
    deleteGraphQLRequest,
    activeEnvironment,
  } = useWorkspace();
  const { showToast } = useToast();

  // Selected request
  const [selectedId, setSelectedId] = useState<string>(() => {
    return graphqlQueries[0]?.id || 'gql-countries-demo';
  });

  const activeReq = useMemo(() => {
    return graphqlQueries.find((q) => q.id === selectedId) || graphqlQueries[0];
  }, [graphqlQueries, selectedId]);

  // Working state
  const [name, setName] = useState(activeReq?.name || 'GraphQL Query');
  const [endpoint, setEndpoint] = useState(activeReq?.endpoint || 'https://countries.trevorblades.com/graphql');
  const [query, setQuery] = useState(activeReq?.query || 'query {\n  countries {\n    code\n    name\n  }\n}');
  const [variables, setVariables] = useState(activeReq?.variables || '{\n  \n}');
  const [bottomTab, setBottomTab] = useState<'variables' | 'headers' | 'schema' | 'builder'>('variables');

  // Execution & Response State
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<{
    status: number;
    statusText: string;
    timeMs: number;
    sizeBytes: number;
    data?: any;
    errors?: any[];
    httpError?: string;
  } | null>(null);

  // Introspection & Schema Explorer State
  const [isIntrospecting, setIsIntrospecting] = useState(false);
  const [introspectionData, setIntrospectionData] = useState<GraphQLIntrospectionResult | null>(null);
  const [schemaSearch, setSchemaSearch] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  // View mode
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [hasCopied, setHasCopied] = useState(false);

  const handleSelectQuery = (id: string) => {
    setSelectedId(id);
    const target = graphqlQueries.find((q) => q.id === id);
    if (target) {
      setName(target.name);
      setEndpoint(target.endpoint);
      setQuery(target.query);
      setVariables(target.variables || '{\n  \n}');
    }
  };

  // Execute query handler
  const handleExecute = useCallback(async () => {
    if (!endpoint.trim()) {
      showToast('Please provide a GraphQL endpoint URL', 'warning', 2500);
      return;
    }

    setIsLoading(true);
    const envVars = activeEnvironment?.variables;
    const finalEndpoint = interpolateVariables(endpoint, envVars);
    const finalVariables = interpolateVariables(variables, envVars);

    try {
      const res = await executeGraphQLQuery(
        finalEndpoint,
        query,
        finalVariables,
        activeReq?.headers || []
      );
      setResponseResult(res);

      if (res.errors && res.errors.length > 0) {
        showToast(`GraphQL responded with ${res.errors.length} error(s)`, 'warning', 2500);
      } else if (res.status >= 200 && res.status < 300) {
        showToast(`GraphQL query succeeded (${res.timeMs}ms)`, 'success', 2000);
      } else {
        showToast(`HTTP Error ${res.status}: ${res.statusText}`, 'error', 3000);
      }
    } catch (err: any) {
      setResponseResult({
        status: 0,
        statusText: 'Network / CORS Error',
        timeMs: 0,
        sizeBytes: 0,
        httpError: err.message || 'Failed to fetch from endpoint. Ensure CORS headers are enabled.',
      });
      showToast(err.message || 'GraphQL execution failed', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, query, variables, activeReq, activeEnvironment, showToast]);

  // Keyboard shortcut Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    },
    [handleExecute]
  );

  // Introspection fetch
  const handleFetchIntrospection = async () => {
    setIsIntrospecting(true);
    const envVars = activeEnvironment?.variables;
    const finalEndpoint = interpolateVariables(endpoint, envVars);

    try {
      const schema = await runIntrospectionQuery(finalEndpoint, activeReq?.headers || []);
      setIntrospectionData(schema);
      showToast(`Introspection schema loaded (${schema.types.length} types)`, 'success', 2500);
      setBottomTab('schema');
    } catch (err: any) {
      showToast(err.message || 'Introspection disabled or endpoint unreachable', 'warning', 3000);
    } finally {
      setIsIntrospecting(false);
    }
  };

  const handleSave = () => {
    if (activeReq) {
      updateGraphQLRequest(activeReq.id, {
        name,
        endpoint,
        query,
        variables,
      });
      showToast('GraphQL query saved', 'success', 2000);
    }
  };

  const handleCreateNew = () => {
    const created = addGraphQLRequest({
      name: 'New GraphQL Query',
      endpoint: 'https://countries.trevorblades.com/graphql',
      query: 'query {\n  countries {\n    code\n    name\n  }\n}',
      variables: '{\n  \n}',
      headers: [{ id: 'h-1', key: 'Content-Type', value: 'application/json', enabled: true }],
    });
    handleSelectQuery(created.id);
    showToast('New GraphQL query created', 'info', 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (graphqlQueries.length <= 1) {
      showToast('Cannot delete the only query', 'warning', 2000);
      return;
    }
    deleteGraphQLRequest(id);
    const rem = graphqlQueries.filter((q) => q.id !== id);
    if (rem.length > 0) handleSelectQuery(rem[0].id);
    showToast('GraphQL query removed', 'info', 2000);
  };

  // Formatted response
  const prettyResponse = useMemo(() => {
    if (!responseResult) return '';
    const payload = responseResult.data !== undefined || responseResult.errors !== undefined
      ? { data: responseResult.data, errors: responseResult.errors }
      : { error: responseResult.httpError };
    return JSON.stringify(payload, null, 2);
  }, [responseResult]);

  const handleCopyResponse = () => {
    if (!responseResult) return;
    navigator.clipboard.writeText(prettyResponse);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    showToast('Response copied to clipboard', 'success', 1500);
  };

  const handleDownloadResponse = () => {
    if (!responseResult) return;
    const blob = new Blob([prettyResponse], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphql-response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Response downloaded', 'success', 1500);
  };

  // Filtered types for Schema Explorer
  const filteredTypes = useMemo(() => {
    if (!introspectionData?.types) return [];
    if (!schemaSearch.trim()) return introspectionData.types;
    const q = schemaSearch.toLowerCase();
    return introspectionData.types.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.fields && t.fields.some((f) => f.name.toLowerCase().includes(q)))
    );
  }, [introspectionData, schemaSearch]);

  const toggleTypeExpand = (typeName: string) => {
    setExpandedTypes((prev) => ({ ...prev, [typeName]: !prev[typeName] }));
  };

  // Click on a field in Query Builder to generate a query
  const handleSelectFieldInBuilder = (fieldName: string, typeName: string) => {
    const typeObj = introspectionData?.types.find((t) => t.name === typeName);
    const field = typeObj?.fields?.find((f) => f.name === fieldName);
    if (!field) return;

    const fragment = generateFieldQuery(field, introspectionData?.types);
    const isMutation = typeName.toLowerCase().includes('mutation');
    const rootOp = isMutation ? 'mutation' : 'query';

    const newQueryDoc = `${rootOp} {\n  ${fragment}\n}`;
    setQuery(newQueryDoc);
    showToast(`Generated query for ${fieldName}`, 'success', 1500);
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
              backgroundColor: 'rgba(230, 0, 158, 0.15)',
              color: '#e6009e',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  borderBottom: '1px dashed transparent',
                  padding: '1px 2px',
                }}
                onFocus={(e) => (e.target.style.borderBottom = '1px dashed var(--accent)')}
                onBlur={(e) => (e.target.style.borderBottom = '1px dashed transparent')}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  backgroundColor: 'rgba(230, 0, 158, 0.2)',
                  color: '#e6009e',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                GRAPHQL
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Interactive GraphQL document runner, schema introspection & field query builder
            </div>
          </div>
        </div>

        {/* Saved queries selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedId}
            onChange={(e) => handleSelectQuery(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12,
              outline: 'none',
            }}
          >
            {graphqlQueries.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> New
          </button>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <FolderPlus size={14} /> Save
          </button>
          {graphqlQueries.length > 1 && (
            <button
              onClick={(e) => handleDelete(selectedId, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Endpoint URL Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 10px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#e6009e',
              marginRight: 8,
            }}
          >
            POST
          </span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-api.com/graphql or {{graphql_url}}"
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-primary)',
              padding: '6px 0',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecute();
            }}
          />
        </div>

        <button
          onClick={handleFetchIntrospection}
          disabled={isIntrospecting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            cursor: isIntrospecting ? 'not-allowed' : 'pointer',
          }}
          title="Introspect GraphQL Schema"
        >
          {isIntrospecting ? <RefreshCw size={13} className="animate-spin" /> : <Database size={13} />}
          Schema
        </button>

        <button
          onClick={handleExecute}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            backgroundColor: '#e6009e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Executing...
            </>
          ) : (
            <>
              <Play size={14} /> Execute
            </>
          )}
        </button>
      </div>

      {/* Main Split Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(380px, 1fr) minmax(380px, 1fr)',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left Side: Query Editor & Sub-panels */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {/* Query Document Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>GraphQL Document</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ctrl+Enter to Run</span>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="query MyQuery { ... }"
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: 'none',
                padding: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                lineHeight: 1.5,
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Sub-panel Tabs (Variables, Headers, Schema Explorer, Query Builder) */}
          <div
            style={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                padding: '0 8px',
              }}
            >
              <button
                onClick={() => setBottomTab('variables')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'transparent',
                  color: bottomTab === 'variables' ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: bottomTab === 'variables' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <Sliders size={13} /> Variables
              </button>
              <button
                onClick={() => setBottomTab('schema')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'transparent',
                  color: bottomTab === 'schema' ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: bottomTab === 'schema' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <Database size={13} /> Schema Explorer
              </button>
              <button
                onClick={() => setBottomTab('builder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'transparent',
                  color: bottomTab === 'builder' ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: bottomTab === 'builder' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <Compass size={13} /> Query Builder
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {bottomTab === 'variables' && (
                <textarea
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  placeholder={`{\n  "key": "value"\n}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              )}

              {bottomTab === 'schema' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                  {!introspectionData ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        gap: 8,
                      }}
                    >
                      <span>No schema loaded yet.</span>
                      <button
                        onClick={handleFetchIntrospection}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Introspect Endpoint
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: 'var(--bg-card)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <Search size={12} style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search schema types or fields..."
                          value={schemaSearch}
                          onChange={(e) => setSchemaSearch(e.target.value)}
                          style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: 11,
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredTypes.map((t) => {
                          const isExpanded = !!expandedTypes[t.name];
                          return (
                            <div
                              key={t.name}
                              style={{
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-card)',
                                overflow: 'hidden',
                                fontSize: 11,
                              }}
                            >
                              <div
                                onClick={() => toggleTypeExpand(t.name)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  backgroundColor: isExpanded ? 'rgba(0,0,0,0.1)' : 'transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  <strong style={{ color: 'var(--accent)' }}>{t.name}</strong>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({t.kind})</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                                  {t.fields?.length || 0} fields
                                </span>
                              </div>

                              {isExpanded && t.fields && (
                                <div style={{ padding: '4px 8px 6px 22px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {t.fields.map((f) => (
                                    <div
                                      key={f.name}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 11,
                                      }}
                                    >
                                      <span>{f.name}</span>
                                      <span style={{ color: '#e6009e' }}>{f.type}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {bottomTab === 'builder' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                  {!introspectionData ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Introspect endpoint first to enable the interactive Query Builder.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Click a root field below to auto-generate a valid query in the editor:
                      </span>
                      {(() => {
                        const rootQueryType = introspectionData.types.find(
                          (t) => t.name === (introspectionData.queryType || 'Query')
                        );
                        if (!rootQueryType || !rootQueryType.fields) {
                          return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Root Query type not found</span>;
                        }
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {rootQueryType.fields.map((field) => (
                              <button
                                key={field.name}
                                onClick={() => handleSelectFieldInBuilder(field.name, rootQueryType.name)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--accent)',
                                  color: 'var(--text-primary)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <strong>{field.name}</strong>
                                <span style={{ color: '#e6009e', fontSize: 10 }}>: {field.type}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Response Inspector */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-card)',
            overflow: 'hidden',
          }}
        >
          {/* Response Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Response</span>
              {responseResult && (
                <>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 3,
                      backgroundColor:
                        responseResult.status >= 200 && responseResult.status < 300
                          ? 'rgba(46, 204, 113, 0.15)'
                          : 'rgba(231, 76, 60, 0.15)',
                      color:
                        responseResult.status >= 200 && responseResult.status < 300
                          ? 'var(--success)'
                          : 'var(--danger)',
                    }}
                  >
                    {responseResult.status} {responseResult.statusText}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {responseResult.timeMs} ms
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {responseResult.sizeBytes} B
                  </span>
                </>
              )}
            </div>

            {responseResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setViewMode(viewMode === 'pretty' ? 'raw' : 'pretty')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {viewMode === 'pretty' ? <FileText size={12} /> : <Code size={12} />}
                  {viewMode === 'pretty' ? 'Raw View' : 'Pretty View'}
                </button>
                <button
                  onClick={handleCopyResponse}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {hasCopied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  {hasCopied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadResponse}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                  title="Download JSON Response"
                >
                  <Download size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Response Payload Viewer */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {responseResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                {responseResult.errors && responseResult.errors.length > 0 && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid var(--danger)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ color: 'var(--danger)' }}>GraphQL Query Errors:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {responseResult.errors.map((err, idx) => (
                          <li key={idx} style={{ color: 'var(--text-primary)', marginTop: 2 }}>
                            {err.message || JSON.stringify(err)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <pre
                  style={{
                    flex: 1,
                    margin: 0,
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {prettyResponse}
                </pre>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  gap: 8,
                }}
              >
                <Layers size={32} style={{ opacity: 0.4 }} />
                <span>No response yet</span>
                <span style={{ fontSize: 11 }}>Click "Execute" or press Ctrl+Enter to dispatch the GraphQL query</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
