import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Search,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Play,
  Pause,
  Check,
  ChevronDown,
  ChevronRight,
  Braces,
} from 'lucide-react';
import { useWorkspace } from '@/hooks';
import { useToast } from '@/hooks';
import type { LogLevel } from '../../../types/logs';
import {
  filterLogs,
  exportLogsToTxt,
  exportLogsToJson,
  exportLogsToCsv,
  parseLogLine,
} from '../../../services/logs';
import './logs.css';

const ALL_LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

export const LogViewer: React.FC = () => {
  const { logEntries, addLogEntry, clearLogs } = useWorkspace();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set(ALL_LEVELS));
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | '15m' | '1h' | '24h'>('all');
  const [showJsonFormatted, setShowJsonFormatted] = useState(true);
  const [expandedJsonLogs, setExpandedJsonLogs] = useState<Record<string, boolean>>({});
  const [isFollowing, setIsFollowing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);

  const logEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Available unique sources
  const availableSources = useMemo(() => {
    const set = new Set(logEntries.map((l) => l.source));
    return Array.from(set).sort();
  }, [logEntries]);

  // Filtered log entries
  const filtered = useMemo(() => {
    return filterLogs(logEntries, {
      searchQuery,
      levels: Array.from(selectedLevels),
      sources: selectedSource === 'all' ? [] : [selectedSource],
      caseSensitive,
      timeRange,
    });
  }, [logEntries, searchQuery, selectedLevels, selectedSource, caseSensitive, timeRange]);

  // Auto-scroll when following
  useEffect(() => {
    if (isFollowing) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filtered, isFollowing]);

  // Stream simulator
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const messages = [
        '[HTTP] GET /api/v1/projects 200 OK 18ms',
        JSON.stringify({ level: 'info', service: 'devdesk-api', message: 'Heartbeat ping received from client', connections: 4 }),
        JSON.stringify({ level: 'debug', service: 'cache-worker', message: 'Evicted 2 expired cache keys', memoryFreedKb: 48 }),
        '[METRICS] CPU usage: 14.2%, RAM: 410MB',
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      addLogEntry(parseLogLine(randomMsg, 'devdesk-api'));
    }, 4000);

    return () => clearInterval(interval);
  }, [isStreaming, addLogEntry]);

  const toggleLevel = (lvl: LogLevel) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) {
        if (next.size > 1) next.delete(lvl);
      } else {
        next.add(lvl);
      }
      return next;
    });
  };

  const toggleJsonExpand = (id: string) => {
    setExpandedJsonLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyLogs = () => {
    const text = exportLogsToTxt(filtered);
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(`Copied ${filtered.length} logs to clipboard`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const text = exportLogsToTxt(filtered);
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, 'devdesk-logs.txt');
    showToast('Exported logs as TXT', 'info');
  };

  const handleExportJson = () => {
    const text = exportLogsToJson(filtered);
    const blob = new Blob([text], { type: 'application/json' });
    downloadBlob(blob, 'devdesk-logs.json');
    showToast('Exported logs as JSON', 'info');
  };

  const handleExportCsv = () => {
    const text = exportLogsToCsv(filtered);
    const blob = new Blob([text], { type: 'text/csv' });
    downloadBlob(blob, 'devdesk-logs.csv');
    showToast('Exported logs as CSV', 'info');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const lines = content.split('\n').filter((l) => l.trim());
      lines.forEach((l) => {
        addLogEntry(parseLogLine(l, file.name.replace(/\.[^/.]+$/, '')));
      });
      showToast(`Imported ${lines.length} log lines from ${file.name}`, 'info');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="log-viewer">
      {/* Header */}
      <div className="log-viewer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="#38bdf8" />
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600 }}>Local Log Viewer</h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ({filtered.length} displayed / {logEntries.length} retained)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`logs-action-btn ${isStreaming ? 'primary' : ''}`}
            onClick={() => {
              setIsStreaming(!isStreaming);
              showToast(isStreaming ? 'Stream simulator paused' : 'Stream simulator started', 'info');
            }}
          >
            {isStreaming ? <Pause size={12} /> : <Play size={12} />}
            {isStreaming ? 'Pause Stream' : 'Live Stream'}
          </button>

          <button
            className={`logs-action-btn ${isFollowing ? 'primary' : ''}`}
            onClick={() => setIsFollowing(!isFollowing)}
          >
            Follow: {isFollowing ? 'ON' : 'OFF'}
          </button>

          <button
            className="logs-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import log file"
          >
            <Upload size={12} />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />

          <button className="logs-action-btn" onClick={handleCopyLogs}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            Copy
          </button>

          <button className="logs-action-btn" onClick={handleExportTxt} title="Export TXT">
            <Download size={12} />
            TXT
          </button>
          <button className="logs-action-btn" onClick={handleExportJson} title="Export JSON">
            <Download size={12} />
            JSON
          </button>
          <button className="logs-action-btn" onClick={handleExportCsv} title="Export CSV">
            <Download size={12} />
            CSV
          </button>

          <button
            className="logs-action-btn danger"
            onClick={() => {
              clearLogs();
              showToast('Logs buffer cleared', 'info');
            }}
          >
            <RotateCcw size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="log-filter-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            className="log-search-input"
            placeholder="Search logs message, raw..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {ALL_LEVELS.map((lvl) => {
            const isActive = selectedLevels.has(lvl);
            return (
              <span
                key={lvl}
                className={`log-level-pill ${lvl} ${isActive ? 'active' : ''}`}
                onClick={() => toggleLevel(lvl)}
              >
                {lvl}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
          <span style={{ color: '#94a3b8' }}>Source:</span>
          <select
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#e2e8f0',
              padding: '3px 8px',
              fontSize: '0.75rem',
            }}
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="all">All Sources</option>
            {availableSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
          <span style={{ color: '#94a3b8' }}>Time:</span>
          <select
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#e2e8f0',
              padding: '3px 8px',
              fontSize: '0.75rem',
            }}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          >
            <option value="all">All Time</option>
            <option value="15m">Last 15 min</option>
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>

        <button
          className={`logs-action-btn ${showJsonFormatted ? 'primary' : ''}`}
          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          onClick={() => setShowJsonFormatted(!showJsonFormatted)}
        >
          <Braces size={12} />
          JSON Formatted: {showJsonFormatted ? 'ON' : 'OFF'}
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Match Case
        </label>
      </div>

      {/* Log Output Stream */}
      <div className="log-stream-list">
        {filtered.map((log) => {
          const isJson = Boolean(log.data);
          const isExpanded = Boolean(expandedJsonLogs[log.id]);

          return (
            <div key={log.id} className="log-row">
              <span className="log-col-time">
                {new Date(log.timestamp).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  fractionalSecondDigits: 3,
                })}
              </span>

              <span className={`log-col-level ${log.level}`}>{log.level}</span>

              <span className="log-col-source" title={log.source}>
                [{log.source}]
              </span>

              <div className="log-col-msg">
                <div>
                  {isJson && showJsonFormatted && (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        cursor: 'pointer',
                        padding: 0,
                        marginRight: '6px',
                        verticalAlign: 'middle',
                      }}
                      onClick={() => toggleJsonExpand(log.id)}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                  {log.message}
                </div>

                {isJson && showJsonFormatted && isExpanded && log.data && (
                  <div className="log-json-tree">
                    <pre style={{ margin: 0, color: '#94a3b8' }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
