import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Search,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { OpenApiImportModal } from './OpenApiImportModal';
import type { OpenApiOperation, OpenApiDocumentRecord } from '@/types/api';

export const OpenApiExplorerView: React.FC = () => {
  const {
    openApiDocuments,
    deleteOpenApiDocument,
    openRequestInTab,
    setActiveView,
  } = useWorkspace();
  const { showToast } = useToast();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    return openApiDocuments[0]?.id || '';
  });

  const activeDoc: OpenApiDocumentRecord | undefined = useMemo(() => {
    return openApiDocuments.find((d) => d.id === selectedDocId) || openApiDocuments[0];
  }, [openApiDocuments, selectedDocId]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Selected operation
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  // Available tags in current doc
  const tags = useMemo(() => {
    if (!activeDoc) return [];
    const set = new Set<string>();
    activeDoc.spec.operations.forEach((op) => {
      op.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [activeDoc]);

  // Filtered operations
  const filteredOperations = useMemo(() => {
    if (!activeDoc) return [];
    return activeDoc.spec.operations.filter((op) => {
      if (selectedTag !== 'all' && !op.tags.includes(selectedTag)) return false;
      if (selectedMethod !== 'all' && op.method !== selectedMethod) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          op.path.toLowerCase().includes(q) ||
          (op.summary && op.summary.toLowerCase().includes(q)) ||
          (op.operationId && op.operationId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeDoc, selectedTag, selectedMethod, searchQuery]);

  const activeOperation: OpenApiOperation | null = useMemo(() => {
    if (!activeDoc) return null;
    if (selectedOpId) {
      const found = activeDoc.spec.operations.find((op) => op.id === selectedOpId);
      if (found) return found;
    }
    return filteredOperations[0] || null;
  }, [activeDoc, selectedOpId, filteredOperations]);

  // Open operation in DevDesk API Client
  const handleOpenInApiClient = (op: OpenApiOperation) => {
    const serverUrl = activeDoc?.spec.servers[0]?.url || 'https://api.example.com';
    const cleanServer = serverUrl.replace(/\/+$/, '');
    const cleanPath = op.path.startsWith('/') ? op.path : `/${op.path}`;
    const fullUrl = `${cleanServer}${cleanPath}`;

    // Extract query params
    const queryParams = op.parameters
      .filter((p) => p.in === 'query')
      .map((p, idx) => ({
        id: `p-${idx}`,
        key: p.name,
        value: p.example !== undefined ? String(p.example) : '',
        enabled: p.required || false,
      }));

    // Extract headers
    const headers = op.parameters
      .filter((p) => p.in === 'header')
      .map((p, idx) => ({
        id: `h-${idx}`,
        key: p.name,
        value: p.example !== undefined ? String(p.example) : '',
        enabled: p.required || false,
      }));

    // Request body content
    let jsonBody = '';
    const jsonContent = op.requestBody?.content?.['application/json'];
    if (jsonContent?.example) {
      jsonBody = JSON.stringify(jsonContent.example, null, 2);
    } else if (jsonContent?.schema) {
      jsonBody = JSON.stringify(jsonContent.schema, null, 2);
    }

    openRequestInTab({
      id: `req-openapi-${Date.now()}`,
      name: op.summary || `${op.method} ${op.path}`,
      description: op.description,
      method: op.method,
      url: fullUrl,
      params: queryParams,
      headers: [
        ...headers,
        ...(jsonBody
          ? [{ id: `h-content-type`, key: 'Content-Type', value: 'application/json', enabled: true }]
          : []),
      ],
      body: {
        type: jsonBody ? 'json' : 'none',
        rawText: '',
        jsonContent: jsonBody,
        formParams: [],
        multipartParams: [],
      },
      auth: { type: 'none' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setActiveView('api-client');
    showToast(`Opened ${op.method} ${op.path} in API Client`, 'success', 2000);
  };

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
      {/* Top Bar */}
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
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>OpenAPI Documentation & Explorer</span>
              {activeDoc && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  v{activeDoc.spec.version}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Interactive schema browser and live request launcher for OpenAPI 3.0 & 3.1
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {openApiDocuments.length > 0 && (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
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
              {openApiDocuments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {activeDoc && (
            <button
              onClick={() => {
                deleteOpenApiDocument(activeDoc.id);
                const remaining = openApiDocuments.filter((d) => d.id !== activeDoc.id);
                if (remaining.length > 0) setSelectedDocId(remaining[0].id);
                showToast('Specification removed', 'info', 1500);
              }}
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
              title="Delete this specification"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
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
            <Plus size={14} /> Import OpenAPI
          </button>
        </div>
      </div>

      {/* Main Content */}
      {openApiDocuments.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: 12,
            color: 'var(--text-muted)',
          }}
        >
          <FileCode size={48} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            No OpenAPI Specifications Imported
          </div>
          <div style={{ fontSize: 13, maxWidth: 420, textAlign: 'center' }}>
            Import your OpenAPI 3.0 or 3.1 JSON/YAML file to explore interactive documentation,
            generate collections, and test endpoints directly.
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Import Specification
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left Sidebar: Operations Navigator */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              overflow: 'hidden',
            }}
          >
            {/* Search & Tag Filter */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--bg-card)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Tag selector */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <button
                    onClick={() => setSelectedTag('all')}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedTag === 'all' ? 'var(--accent)' : 'var(--bg-card)',
                      color: selectedTag === 'all' ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    All Tags
                  </button>
                  {tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedTag === t ? 'var(--accent)' : 'var(--bg-card)',
                        color: selectedTag === t ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Method filter pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(['all', 'GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMethod(m)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedMethod === m ? 'var(--accent)' : 'var(--bg-card)',
                      color: selectedMethod === m ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {m === 'all' ? 'All Methods' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Operations list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredOperations.map((op) => {
                const isSelected = activeOperation?.id === op.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => setSelectedOpId(op.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(52, 152, 219, 0.15)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: getMethodColor(op.method),
                        }}
                      >
                        {op.method}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {op.path}
                      </span>
                    </div>
                    {op.summary && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {op.summary}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Operation Documentation & Schema Detail */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-card)',
              overflowY: 'auto',
              padding: 24,
              gap: 20,
            }}
          >
            {activeOperation ? (
              <>
                {/* Header with Method, Path and "Open in API Client" */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-surface)',
                        color: getMethodColor(activeOperation.method),
                        border: `1px solid ${getMethodColor(activeOperation.method)}`,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {activeOperation.method}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {activeOperation.path}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeOperation.path);
                        setHasCopiedUrl(true);
                        setTimeout(() => setHasCopiedUrl(false), 2000);
                        showToast('Endpoint path copied', 'success', 1500);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 4,
                      }}
                      title="Copy path"
                    >
                      {hasCopiedUrl ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenInApiClient(activeOperation)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      backgroundColor: 'var(--accent)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={13} /> Open in API Client
                  </button>
                </div>

                {/* Summary & Description */}
                {(activeOperation.summary || activeOperation.description) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeOperation.summary && (
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {activeOperation.summary}
                      </div>
                    )}
                    {activeOperation.description && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {activeOperation.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Parameters Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Parameters ({activeOperation.parameters.length})
                  </div>

                  {activeOperation.parameters.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No parameters required.</div>
                  ) : (
                    <div
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>In</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Required</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOperation.parameters.map((param, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
                                {param.name}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: 3, backgroundColor: 'var(--bg-surface)', fontSize: 10 }}>
                                  {param.in}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                {param.schema?.type || 'string'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {param.required ? (
                                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Required</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Optional</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                                {param.description || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Request Body */}
                {activeOperation.requestBody && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Request Body {activeOperation.requestBody.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                    </div>
                    {activeOperation.requestBody.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {activeOperation.requestBody.description}
                      </div>
                    )}
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(activeOperation.requestBody.content || {}, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Responses Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Responses ({Object.keys(activeOperation.responses).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(activeOperation.responses).map(([statusCode, resp]) => {
                      const isSuccess = statusCode.startsWith('2');
                      return (
                        <div
                          key={statusCode}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-surface)',
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 3,
                                fontWeight: 700,
                                fontSize: 11,
                                backgroundColor: isSuccess ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                                color: isSuccess ? 'var(--success)' : 'var(--danger)',
                              }}
                            >
                              {statusCode}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                              {resp.description || 'No description provided'}
                            </span>
                          </div>

                          {resp.content && (
                            <pre
                              style={{
                                margin: 0,
                                padding: 8,
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-card)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                color: 'var(--text-secondary)',
                                overflowX: 'auto',
                              }}
                            >
                              {JSON.stringify(resp.content, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select an operation on the left to inspect its parameters and schemas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      <OpenApiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(spec) => {
          showToast(`Imported ${spec.title}`, 'success', 2000);
        }}
      />
    </div>
  );
};
