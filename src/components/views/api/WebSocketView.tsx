import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Radio,
  Send,
  Trash2,
  Copy,
  Download,
  Search,
  Check,
  Play,
  Square,
  RefreshCw,
  Plus,
  FolderPlus,
  Info,
  Code,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { webSocketManager } from '@/services/webSocketManager';
import { interpolateVariables } from '@/services/environmentService';
import type { WsMessage, WsConnectionStatus } from '@/types/api';

export const WebSocketView: React.FC = () => {
  const {
    webSocketConnections,
    addWebSocketConnection,
    updateWebSocketConnection,
    deleteWebSocketConnection,
    activeEnvironment,
  } = useWorkspace();
  const { showToast } = useToast();

  // Active connection selection
  const [selectedConnId, setSelectedConnId] = useState<string>(() => {
    return webSocketConnections[0]?.id || 'ws-echo-demo';
  });

  const activeConn = useMemo(() => {
    return webSocketConnections.find((c) => c.id === selectedConnId) || webSocketConnections[0];
  }, [webSocketConnections, selectedConnId]);

  // Working state for active connection
  const [url, setUrl] = useState(activeConn?.url || 'wss://echo.websocket.org');
  const [name, setName] = useState(activeConn?.name || 'WebSocket Echo Server');
  const [composerText, setComposerText] = useState('{\n  "event": "ping",\n  "timestamp": 123456\n}');
  const [composerMode, setComposerMode] = useState<'json' | 'text'>('json');

  // Live messages & connection state
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [messages, setMessages] = useState<WsMessage[]>(() => activeConn?.messages || []);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out' | 'system'>('all');
  const [jsonViewMode, setJsonViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [hasCopied, setHasCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSelectConn = (id: string) => {
    setSelectedConnId(id);
    const target = webSocketConnections.find((c) => c.id === id);
    if (target) {
      setUrl(target.url);
      setName(target.name);
      setMessages(target.messages || []);
      setSelectedMessageId(null);
    }
  };

  // WebSocket Manager Event Subscriptions
  useEffect(() => {
    const unsubMsg = webSocketManager.onMessage((msg: WsMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg].slice(-500); // capped at 500
        return next;
      });
    });

    const unsubStatus = webSocketManager.onStatusChange((newStatus: WsConnectionStatus, connLatency?: number) => {
      setStatus(newStatus);
      if (connLatency !== undefined) {
        setLatencyMs(connLatency);
      }
    });

    return () => {
      unsubMsg();
      unsubStatus();
    };
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Connect / Disconnect handlers
  const handleConnect = useCallback(() => {
    if (status === 'connected' || status === 'connecting') {
      webSocketManager.disconnect();
      setStatus('disconnected');
      return;
    }

    const envVars = activeEnvironment?.variables;
    const finalUrl = interpolateVariables(url, envVars);

    try {
      webSocketManager.connect(finalUrl, activeConn?.protocols);
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize WebSocket', 'error', 3000);
    }
  }, [status, url, activeEnvironment, activeConn, showToast]);

  const handleSendMessage = useCallback(() => {
    if (status !== 'connected') {
      showToast('Cannot send message: WebSocket is not connected', 'warning', 2500);
      return;
    }

    if (!composerText.trim()) return;

    const envVars = activeEnvironment?.variables;
    const messageToSend = interpolateVariables(composerText, envVars);

    const sent = webSocketManager.send(messageToSend);
    if (!sent) {
      showToast('Failed to dispatch message to WebSocket socket', 'error', 2500);
    }
  }, [status, composerText, activeEnvironment, showToast]);

  // Keyboard shortcut Ctrl/Cmd + Enter to send
  const handleComposerKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Save current connection config
  const handleSaveConnection = () => {
    if (activeConn) {
      updateWebSocketConnection(activeConn.id, {
        name,
        url,
        messages,
      });
      showToast('WebSocket configuration saved', 'success', 2000);
    }
  };

  const handleCreateNewConnection = () => {
    const created = addWebSocketConnection({
      name: 'New WebSocket Client',
      url: 'wss://echo.websocket.org',
      protocols: [],
      headers: [],
      messages: [],
    });
    handleSelectConn(created.id);
    showToast('New WebSocket connection created', 'info', 2000);
  };

  const handleDeleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (webSocketConnections.length <= 1) {
      showToast('Cannot delete the only connection', 'warning', 2000);
      return;
    }
    deleteWebSocketConnection(id);
    const remaining = webSocketConnections.filter((c) => c.id !== id);
    if (remaining.length > 0) {
      handleSelectConn(remaining[0].id);
    }
    showToast('WebSocket connection deleted', 'info', 2000);
  };

  const handleClearMessages = () => {
    webSocketManager.clearHistory();
    setMessages([]);
    setSelectedMessageId(null);
    showToast('Message stream cleared', 'info', 1500);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(composerText);
      setComposerText(JSON.stringify(parsed, null, 2));
      showToast('JSON formatted', 'success', 1500);
    } catch {
      showToast('Invalid JSON syntax', 'warning', 2000);
    }
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (directionFilter !== 'all' && m.direction !== directionFilter) {
        return false;
      }
      if (messageSearch.trim()) {
        const query = messageSearch.toLowerCase();
        return m.data.toLowerCase().includes(query) || (m.error && m.error.toLowerCase().includes(query));
      }
      return true;
    });
  }, [messages, directionFilter, messageSearch]);

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  // Pretty inspect data
  const prettySelectedData = useMemo(() => {
    if (!selectedMessage) return '';
    try {
      const parsed = JSON.parse(selectedMessage.data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return selectedMessage.data;
    }
  }, [selectedMessage]);

  const handleCopySelected = () => {
    if (!selectedMessage) return;
    navigator.clipboard.writeText(prettySelectedData);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    showToast('Message payload copied to clipboard', 'success', 1500);
  };

  const handleDownloadLog = () => {
    if (messages.length === 0) return;
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `websocket-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    showToast('WebSocket message log downloaded', 'success', 1500);
  };

  // Status color mapper
  const getStatusColor = (st: WsConnectionStatus) => {
    switch (st) {
      case 'connected':
        return 'var(--success)';
      case 'connecting':
      case 'reconnecting':
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
      {/* Header bar */}
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
              backgroundColor: 'rgba(155, 89, 182, 0.15)',
              color: '#9b59b6',
            }}
          >
            <Radio size={18} />
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
                title="Click to rename connection"
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
              {latencyMs !== null && status === 'connected' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{latencyMs}ms</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Real-time bidirectional WebSocket client with native frame inspection
            </div>
          </div>
        </div>

        {/* Saved Connections Selector & Actions */}
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
            {webSocketConnections.map((c) => (
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
            title="Create New WebSocket Connection Preset"
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
            title="Save connection configuration"
          >
            <FolderPlus size={14} /> Save
          </button>
          {webSocketConnections.length > 1 && (
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
              title="Delete connection preset"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* URL Address Bar */}
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
              color: 'var(--accent)',
              marginRight: 8,
            }}
          >
            URL
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://echo.websocket.org or {{ws_url}}"
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
              backgroundColor: 'var(--accent)',
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
                <Play size={14} /> Connect
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Workspace Split Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1fr) minmax(380px, 1fr)',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left Panel: Stream Messages */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            overflow: 'hidden',
          }}
        >
          {/* Stream Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {(['all', 'in', 'out', 'system'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDirectionFilter(tab)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: directionFilter === tab ? 'var(--accent)' : 'transparent',
                    color: directionFilter === tab ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {tab === 'in' ? 'Incoming' : tab === 'out' ? 'Outgoing' : tab}
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
                  placeholder="Filter messages..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
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
                onClick={handleDownloadLog}
                disabled={messages.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: messages.length === 0 ? 'default' : 'pointer',
                  padding: 4,
                }}
                title="Download JSON Message Log"
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleClearMessages}
                disabled={messages.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: messages.length === 0 ? 'default' : 'pointer',
                  padding: 4,
                }}
                title="Clear Message Log"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Messages List */}
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
            {filteredMessages.length === 0 ? (
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
                <Radio size={28} style={{ opacity: 0.4 }} />
                <span>No messages received yet</span>
                <span style={{ fontSize: 11 }}>Connect to start receiving real-time frames</span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessageId;
                const isIn = msg.direction === 'in';
                const isOut = msg.direction === 'out';
                const isSys = msg.direction === 'system';
                const isErr = msg.direction === 'error';

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessageId(msg.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected
                        ? 'rgba(52, 152, 219, 0.15)'
                        : isSys
                        ? 'rgba(0,0,0,0.1)'
                        : 'var(--bg-surface)',
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            backgroundColor: isIn
                              ? 'rgba(46, 204, 113, 0.15)'
                              : isOut
                              ? 'rgba(52, 152, 219, 0.15)'
                              : isErr
                              ? 'rgba(231, 76, 60, 0.15)'
                              : 'rgba(241, 196, 15, 0.15)',
                            color: isIn
                              ? 'var(--success)'
                              : isOut
                              ? 'var(--accent)'
                              : isErr
                              ? 'var(--danger)'
                              : 'var(--warning)',
                          }}
                        >
                          {isIn ? '↓ IN' : isOut ? '↑ OUT' : isErr ? '! ERROR' : '⚡ SYS'}
                        </span>
                        {msg.sizeBytes !== undefined && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {msg.sizeBytes} B
                          </span>
                        )}
                        {msg.isBinary && (
                          <span
                            style={{
                              fontSize: 9,
                              backgroundColor: 'var(--border-subtle)',
                              padding: '1px 4px',
                              borderRadius: 2,
                            }}
                          >
                            BINARY
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {msg.timestamp.split('T')[1]?.substring(0, 8)}
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
                      {msg.data}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Panel: Message Inspector & Composer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
          }}
        >
          {/* Top Half: Selected Message Details */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderBottom: '1px solid var(--border-subtle)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Info size={14} style={{ color: 'var(--accent)' }} />
                <span>Frame Details</span>
                {selectedMessage && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ({selectedMessage.direction})
                  </span>
                )}
              </div>

              {selectedMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setJsonViewMode(jsonViewMode === 'pretty' ? 'raw' : 'pretty')}
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
                    {jsonViewMode === 'pretty' ? <FileText size={12} /> : <Code size={12} />}
                    {jsonViewMode === 'pretty' ? 'Raw View' : 'Pretty JSON'}
                  </button>
                  <button
                    onClick={handleCopySelected}
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
              {selectedMessage ? (
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
                      <span style={{ color: 'var(--text-muted)' }}>Direction: </span>
                      <strong>{selectedMessage.direction.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Size: </span>
                      <strong>{selectedMessage.sizeBytes ?? selectedMessage.data.length} B</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
                      <strong>{selectedMessage.timestamp.split('T')[1]?.substring(0, 8)}</strong>
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
                    {jsonViewMode === 'pretty' ? prettySelectedData : selectedMessage.data}
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
                  Select a frame from the stream on the left to inspect its raw payload
                </div>
              )}
            </div>
          </div>

          {/* Bottom Half: Message Composer */}
          <div
            style={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Compose Message</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setComposerMode('json')}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      borderRadius: 3,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: composerMode === 'json' ? 'var(--accent)' : 'var(--bg-card)',
                      color: composerMode === 'json' ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setComposerMode('text')}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      borderRadius: 3,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: composerMode === 'text' ? 'var(--accent)' : 'var(--bg-card)',
                      color: composerMode === 'text' ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    Text
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {composerMode === 'json' && (
                  <button
                    onClick={handleFormatJson}
                    style={{
                      padding: '3px 8px',
                      fontSize: 11,
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Beautify
                  </button>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={status !== 'connected'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    backgroundColor: status === 'connected' ? 'var(--accent)' : 'var(--border-subtle)',
                    color: status === 'connected' ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: status === 'connected' ? 'pointer' : 'not-allowed',
                  }}
                  title="Send frame (Ctrl+Enter)"
                >
                  <Send size={13} /> Send
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: 8 }}>
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Enter JSON or plain text payload..."
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
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 12px 6px',
                fontSize: 10,
                color: 'var(--text-muted)',
              }}
            >
              <span>Supports environment variables (e.g. {`{{token}}`})</span>
              <span>Press Ctrl+Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
