import React, { useState } from 'react';
import {
  Search,
  Globe,
  HelpCircle,
  Copy,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { HTTP_STATUS_LIST } from '../../../services/httpStatusReference';
import { useToast } from '@/hooks';
import type { HttpStatusInfo } from '../../../types/api';

export const HttpInspectorView: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'inspector' | 'reference'>('inspector');

  // Inspector State
  const [inspectUrl, setInspectUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState<{
    url: string;
    status: number;
    statusText: string;
    timeMs: number;
    headers: Record<string, string>;
    corsAllowed: boolean;
    cacheHeaders: Record<string, string>;
    corsHeaders: Record<string, string>;
    rawError?: string;
  } | null>(null);

  // Status Reference State
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<HttpStatusInfo | null>(
    HTTP_STATUS_LIST.find((s) => s.code === 200) || HTTP_STATUS_LIST[0]
  );

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUrl.trim()) return;

    setInspectLoading(true);
    setInspectResult(null);

    const startTime = performance.now();
    try {
      const response = await fetch(inspectUrl, {
        method: 'GET',
        cache: 'no-cache',
      });
      const elapsed = Math.round(performance.now() - startTime);

      const headers: Record<string, string> = {};
      const cacheHeaders: Record<string, string> = {};
      const corsHeaders: Record<string, string> = {};

      response.headers.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        headers[key] = val;
        if (lowerKey.includes('cache') || lowerKey.includes('etag') || lowerKey.includes('expires') || lowerKey.includes('age')) {
          cacheHeaders[key] = val;
        }
        if (lowerKey.startsWith('access-control-')) {
          corsHeaders[key] = val;
        }
      });

      setInspectResult({
        url: inspectUrl,
        status: response.status,
        statusText: response.statusText,
        timeMs: elapsed,
        headers,
        corsAllowed: true,
        cacheHeaders,
        corsHeaders,
      });

      showToast(`Inspected URL (${response.status} ${response.statusText})`, 'success', 1500);
    } catch {
      const elapsed = Math.round(performance.now() - startTime);
      setInspectResult({
        url: inspectUrl,
        status: 0,
        statusText: 'CORS Blocked / Network Error',
        timeMs: elapsed,
        headers: {},
        corsAllowed: false,
        cacheHeaders: {},
        corsHeaders: {},
        rawError:
          'Browser security policy blocked header inspection. Either the remote server does not emit CORS headers (Access-Control-Allow-Origin), or DNS/network resolution failed.',
      });
      showToast('Inspection blocked by browser CORS policy', 'info', 2500);
    } finally {
      setInspectLoading(false);
    }
  };

  const filteredStatuses = HTTP_STATUS_LIST.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesQuery =
      s.code.toString().includes(statusFilter) ||
      s.name.toLowerCase().includes(statusFilter.toLowerCase()) ||
      s.meaning.toLowerCase().includes(statusFilter.toLowerCase()) ||
      s.commonUse.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'inspector' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('inspector')}
          >
            <Globe size={14} />
            <span>URL & Header Inspector</span>
          </button>
          <button
            className={`btn ${activeTab === 'reference' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reference')}
          >
            <HelpCircle size={14} />
            <span>HTTP Status Code Catalog</span>
          </button>
        </div>
      </div>

      {/* TAB 1: URL INSPECTOR */}
      {activeTab === 'inspector' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* URL Form */}
          <form
            onSubmit={handleInspect}
            className="card"
            style={{
              padding: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="url"
                required
                className="input-field"
                placeholder="https://example.com/api"
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={inspectLoading}>
              <ArrowRight size={14} />
              <span>{inspectLoading ? 'Inspecting...' : 'Inspect Headers'}</span>
            </button>
          </form>

          {/* Browser Restriction Warning Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(52, 152, 219, 0.08)',
              border: '1px solid rgba(52, 152, 219, 0.2)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldAlert size={15} style={{ color: 'var(--info)' }} />
            <span>
              <strong>Browser Security Notice:</strong> Browsers restrict access to response headers on cross-origin requests unless the target server explicitly includes <code>Access-Control-Expose-Headers</code>. DevDesk displays all headers permitted by your browser.
            </span>
          </div>

          {/* Inspection Results */}
          {inspectResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Left Column: Response Overview & CORS */}
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Inspection Overview</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: inspectResult.corsAllowed ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                      color: inspectResult.corsAllowed ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {inspectResult.status} {inspectResult.statusText}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Response Latency:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{inspectResult.timeMs} ms</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>CORS Policy:</span>
                    <strong style={{ color: inspectResult.corsAllowed ? 'var(--success)' : 'var(--danger)' }}>
                      {inspectResult.corsAllowed ? 'Allowed by Target' : 'Blocked by Browser Origin Policy'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Exposed Headers Count:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Object.keys(inspectResult.headers).length}</strong>
                  </div>
                </div>

                {inspectResult.rawError && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid var(--danger)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      lineHeight: '1.4',
                    }}
                  >
                    {inspectResult.rawError}
                  </div>
                )}

                {/* CORS Headers Table */}
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    CORS Response Headers
                  </span>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {Object.entries(inspectResult.corsHeaders).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '180px 1fr',
                          gap: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span style={{ color: 'var(--accent-hover)' }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                      </div>
                    ))}
                    {Object.keys(inspectResult.corsHeaders).length === 0 && (
                      <div style={{ padding: 8, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        No specific Access-Control headers were exposed in response.
                      </div>
                    )}
                  </div>
                </div>

                {/* Cache Headers Table */}
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Cache & ETag Directives
                  </span>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {Object.entries(inspectResult.cacheHeaders).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '180px 1fr',
                          gap: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span style={{ color: 'var(--info)' }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{v}</span>
                      </div>
                    ))}
                    {Object.keys(inspectResult.cacheHeaders).length === 0 && (
                      <div style={{ padding: 8, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        No cache directives found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: All Browser-Exposed Response Headers */}
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>All Exposed Response Headers</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectResult.headers, null, 2));
                      showToast('Headers copied as JSON', 'info', 1200);
                    }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  {Object.entries(inspectResult.headers).map(([k, v], idx) => (
                    <div
                      key={k}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr',
                        gap: 8,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{k}:</span>
                      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                  {Object.keys(inspectResult.headers).length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                      No headers exposed by server.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HTTP STATUS CODE REFERENCE */}
      {activeTab === 'reference' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, minHeight: '520px' }}>
          {/* Status List Column */}
          <div className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-surface)' }}>
            {/* Filter Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search code or meaning..."
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: 28, fontSize: 12, paddingLeft: 26 }}
              />
              <Search size={12} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-tertiary)' }} />
            </div>

            {/* Category Buttons */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
              {['all', '1xx', '2xx', '3xx', '4xx', '5xx'].map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredStatuses.map((s) => {
                const isSelected = selectedStatus?.code === s.code;

                return (
                  <div
                    key={s.code}
                    onClick={() => setSelectedStatus(s)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color:
                            s.category === '2xx'
                              ? 'var(--success)'
                              : s.category === '4xx'
                              ? 'var(--danger)'
                              : s.category === '5xx'
                              ? 'var(--danger)'
                              : 'var(--warning)',
                        }}
                      >
                        {s.code}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                    </div>

                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{s.category}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Column */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-surface)' }}>
            {selectedStatus ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color:
                          selectedStatus.category === '2xx'
                            ? 'var(--success)'
                            : selectedStatus.category === '4xx' || selectedStatus.category === '5xx'
                            ? 'var(--danger)'
                            : 'var(--warning)',
                      }}
                    >
                      {selectedStatus.code}
                    </span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedStatus.name}</h2>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {selectedStatus.category} Category
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Standard RFC Meaning
                    </h4>
                    <p style={{ fontSize: 13, lineHeight: '1.5', margin: 0 }}>{selectedStatus.meaning}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Common Real-World Usage
                    </h4>
                    <p style={{ fontSize: 13, lineHeight: '1.5', margin: 0 }}>{selectedStatus.commonUse}</p>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(52, 152, 219, 0.08)',
                      border: '1px solid rgba(52, 152, 219, 0.2)',
                    }}
                  >
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--info)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💡</span> Developer Troubleshooting Tips
                    </h4>
                    <p style={{ fontSize: 12, lineHeight: '1.5', margin: 0, color: 'var(--text-primary)' }}>
                      {selectedStatus.troubleshooting}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                Select an HTTP status code to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
