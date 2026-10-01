import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  Play,
  Square,
  RefreshCw,
  Search,
  Trash2,
  Copy,
  Download,
  Check,
  Plus,
  FolderPlus,
  Code,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { sseManager } from '@/services/sseManager';
import { interpolateVariables } from '@/services/environmentService';
import type { SseEventItem, SseConnectionStatus } from '@/types/api';

export const SseView: React.FC = () => {
  const {
    sseConnections,
    addSseConnection,
    updateSseConnection,
    deleteSseConnection,
    activeEnvironment,
  } = useWorkspace();
  const { showToast } = useToast();

  // Active connection selection
  const [selectedConnId, setSelectedConnId] = useState<string>(() => {
    return sseConnections[0]?.id || 'sse-httpbin-stream';
  });

  const activeConn = useMemo(() => {
    return sseConnections.find((c) => c.id === selectedConnId) || sseConnections[0];
  }, [sseConnections, selectedConnId]);

  // Working state
  const [url, setUrl] = useState(activeConn?.url || 'https://httpbin.org/stream/5');
  const [name, setName] = useState(activeConn?.name || 'HTTPBin Stream');
  const [customEventsInput, setCustomEventsInput] = useState('');

  // Live state
  const [status, setStatus] = useState<SseConnectionStatus>('disconnected');
  const [events, setEvents] = useState<SseEventItem[]>(() => activeConn?.events || []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [hasCopied, setHasCopied] = useState(false);

  const streamEndRef = useRef<HTMLDivElement | null>(null);

  const handleSelectConn = (id: string) => {
    setSelectedConnId(id);
    const target = sseConnections.find((c) => c.id === id);
    if (target) {
      setUrl(target.url);
      setName(target.name);
      setEvents(target.events || []);
      setSelectedEventId(null);
    }
  };

  // Subscribe to SSE Manager updates
  useEffect(() => {
    const unsubEvent = sseManager.onEvent((ev: SseEventItem) => {
      setEvents((prev) => [...prev, ev].slice(-500));
    });

    const unsubStatus = sseManager.onStatusChange((st: SseConnectionStatus) => {
      setStatus(st);
    });

    return () => {
      unsubEvent();
      unsubStatus();
    };
  }, []);

  // Auto-scroll stream
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const handleConnect = useCallback(() => {
    if (status === 'connected' || status === 'connecting') {
      sseManager.disconnect();
      setStatus('disconnected');
      return;
    }

    const envVars = activeEnvironment?.variables;
    const finalUrl = interpolateVariables(url, envVars);

    const customEventList = customEventsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      sseManager.connect(finalUrl, customEventList);
    } catch (err: any) {
      showToast(err.message || 'Failed to start SSE stream', 'error', 3000);
    }
  }, [status, url, activeEnvironment, customEventsInput, showToast]);

  const handleSaveConnection = () => {
    if (activeConn) {
      updateSseConnection(activeConn.id, {
        name,
        url,
        events,
      });
      showToast('SSE connection saved to workspace', 'success', 2000);
    }
  };

  const handleCreateNewConnection = () => {
    const created = addSseConnection({
      name: 'New SSE Stream',
      url: 'https://httpbin.org/stream/5',
      headers: [],
      events: [],
    });
    handleSelectConn(created.id);
    showToast('New SSE stream created', 'info', 2000);
  };

  const handleDeleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sseConnections.length <= 1) {
      showToast('Cannot delete the only connection', 'warning', 2000);
      return;
    }
    deleteSseConnection(id);
    const remaining = sseConnections.filter((c) => c.id !== id);
    if (remaining.length > 0) {
      handleSelectConn(remaining[0].id);
    }
    showToast('SSE stream preset deleted', 'info', 2000);
  };

  const handleClearEvents = () => {
    sseManager.clearHistory();
    setEvents([]);
    setSelectedEventId(null);
    showToast('Event stream cleared', 'info', 1500);
  };

  // Distinct event types
  const distinctEventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.event));
    return Array.from(set);
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (eventFilter !== 'all' && ev.event !== eventFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ev.data.toLowerCase().includes(q) || ev.event.toLowerCase().includes(q);
      }
      return true;
    });
  }, [events, eventFilter, searchQuery]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const prettyEventData = useMemo(() => {
    if (!selectedEvent) return '';
    try {
      const parsed = JSON.parse(selectedEvent.data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return selectedEvent.data;
    }
  }, [selectedEvent]);

  const handleCopyEvent = () => {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(prettyEventData);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    showToast('Event payload copied', 'success', 1500);
  };

  const handleDownloadEvents = () => {
    if (events.length === 0) return;
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `sse-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    showToast('SSE events log downloaded', 'success', 1500);
  };

  const getStatusColor = (st: SseConnectionStatus) => {
    switch (st) {
      case 'connected':
        return 'var(--success)';
      case 'connecting':
        return 'var(--warning)';
      case 'error':
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
              backgroundColor: 'rgba(46, 204, 113, 0.15)',
              color: 'var(--success)',
            }}
          >
            <Activity size={18} />
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
                title="Click to rename stream"
              />
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${getStatusColor(status)}`,
                  color: getStatusColor(status),
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(status),
                  }}
                />
                {status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Server-Sent Events (SSE) streaming consumer with named event routing
            </div>
          </div>
        </div>

        {/* Presets dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedConnId}
            onChange={(e) => handleSelectConn(e.target.value)}
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
            {sseConnections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateNewConnection}
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
            onClick={handleSaveConnection}
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
          {sseConnections.length > 1 && (
            <button
              onClick={(e) => handleDeleteConnection(selectedConnId, e)}
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

      {/* URL Connection Bar */}
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
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--success)',
              marginRight: 8,
            }}
          >
            GET
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-api.com/sse/feed or {{sse_url}}"
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
              if (e.key === 'Enter') handleConnect();
            }}
          />
        </div>

        {status === 'connected' ? (
          <button
            onClick={handleConnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Square size={14} /> Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === 'connecting'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: 'var(--success)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              cursor: status === 'connecting' ? 'not-allowed' : 'pointer',
              opacity: status === 'connecting' ? 0.7 : 1,
            }}
          >
            {status === 'connecting' ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Connecting...
              </>
            ) : (
              <>
                <Play size={14} /> Connect Stream
              </>
            )}
          </button>
        )}
      </div>

      {/* Custom Named Events Hint Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 20px',
          backgroundColor: 'rgba(52, 152, 219, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <AlertCircle size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span>
          Browser EventSource connects via GET. Custom event types:
        </span>
        <input
          type="text"
          value={customEventsInput}
          onChange={(e) => setCustomEventsInput(e.target.value)}
          placeholder="e.g. price_update, user_joined (comma-separated)"
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
            fontSize: 11,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Main Split Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(340px, 1fr)',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left: Stream List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            overflow: 'hidden',
          }}
        >
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <button
                onClick={() => setEventFilter('all')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: eventFilter === 'all' ? 'var(--accent)' : 'transparent',
                  color: eventFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                All ({events.length})
              </button>
              {distinctEventTypes.map((et) => (
                <button
                  key={et}
                  onClick={() => setEventFilter(et)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: eventFilter === et ? 'var(--accent)' : 'transparent',
                    color: eventFilter === et ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {et}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <Search size={12} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 11,
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    width: 90,
                  }}
                />
              </div>
              <button
                onClick={handleDownloadEvents}
                disabled={events.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: events.length === 0 ? 'default' : 'pointer',
                  padding: 4,
                }}
                title="Download JSON Event Log"
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleClearEvents}
                disabled={events.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: events.length === 0 ? 'default' : 'pointer',
                  padding: 4,
                }}
                title="Clear Event Stream"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Events Log List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {filteredEvents.length === 0 ? (
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
                <Activity size={28} style={{ opacity: 0.4 }} />
                <span>No SSE events received yet</span>
                <span style={{ fontSize: 11 }}>Click "Connect Stream" to establish an EventSource connection</span>
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                const isErr = ev.event === 'error';

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected
                        ? 'rgba(46, 204, 113, 0.15)'
                        : 'var(--bg-surface)',
                      border: isSelected
                        ? '1px solid var(--success)'
                        : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: 12,
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
                            padding: '1px 6px',
                            borderRadius: 3,
                            backgroundColor: isErr
                              ? 'rgba(231, 76, 60, 0.15)'
                              : 'rgba(46, 204, 113, 0.15)',
                            color: isErr ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          {ev.event}
                        </span>
                        {ev.eventId && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            id: {ev.eventId}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {ev.timestamp.split('T')[1]?.substring(0, 8)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: isErr ? 'var(--danger)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.data}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={streamEndRef} />
          </div>
        </div>

        {/* Right: Selected Event Inspector */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
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
            <div style={{ fontSize: 12, fontWeight: 600 }}>Event Payload</div>
            {selectedEvent && (
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
                  {viewMode === 'pretty' ? 'Raw View' : 'Pretty JSON'}
                </button>
                <button
                  onClick={handleCopyEvent}
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
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12, backgroundColor: 'var(--bg-card)' }}>
            {selectedEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Event: </span>
                    <strong>{selectedEvent.event}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Event ID: </span>
                    <strong>{selectedEvent.eventId || 'None'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Time: </span>
                    <strong>{selectedEvent.timestamp.split('T')[1]?.substring(0, 8)}</strong>
                  </div>
                </div>

                <pre
                  style={{
                    flex: 1,
                    margin: 0,
                    padding: 10,
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
                  {viewMode === 'pretty' ? prettyEventData : selectedEvent.data}
                </pre>
              </div>
            ) : (
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
                Select an SSE event from the stream list to inspect its contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
