import React, { useState, useEffect } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Clock, Play, Pause, Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const TimestampTool: React.FC = () => {
  const { showToast } = useToast();
  const [currentNow, setCurrentNow] = useState<number>(Date.now());
  const [isLive, setIsLive] = useState<boolean>(true);

  // Converter state
  const [timestampInput, setTimestampInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [isMs, setIsMs] = useState<boolean>(false);
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().slice(0, 16));

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live timer tick
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCurrentNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const copyVal = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    showToast(`Copied ${key}`, 'success', 1500);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Conversions for timestamp input
  const parsedFromTimestamp = () => {
    const num = Number(timestampInput);
    if (isNaN(num) || !timestampInput.trim()) return null;
    const ms = isMs ? num : num * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  // Conversions for date input
  const parsedFromDate = () => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const tsDate = parsedFromTimestamp();
  const dtDate = parsedFromDate();

  const getRelativeTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    const absDiff = Math.abs(diff);
    const isPast = diff > 0;
    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return isPast ? 'Just now' : 'In a few seconds';
    if (minutes < 60) return `${minutes}m ${isPast ? 'ago' : 'from now'}`;
    if (hours < 24) return `${hours}h ${isPast ? 'ago' : 'from now'}`;
    return `${days}d ${isPast ? 'ago' : 'from now'}`;
  };

  const currentSec = Math.floor(currentNow / 1000);

  return (
    <ToolLayout
      toolId="timestamp"
      title="Timestamp Converter"
      description="Convert Unix timestamps (seconds & milliseconds) to human dates, UTC, ISO 8601, and local time."
      icon={Clock}
      actions={
        <div className="toolbar-group">
          <button
            className={`btn btn-sm ${isLive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLive ? 'Pause Live Clock' : 'Resume Clock'}</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setTimestampInput(Math.floor(Date.now() / 1000).toString());
              setIsMs(false);
            }}
          >
            Use Current Time
          </button>
        </div>
      }
    >
      {/* Live Current Time Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Current Unix (Seconds)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
              {currentSec}
            </span>
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => copyVal(currentSec.toString(), 'Current Seconds')}
            >
              {copiedKey === 'Current Seconds' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Current Unix (Milliseconds)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentNow}
            </span>
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => copyVal(currentNow.toString(), 'Current Milliseconds')}
            >
              {copiedKey === 'Current Milliseconds' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Current ISO 8601
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date(currentNow).toISOString()}
            </span>
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => copyVal(new Date(currentNow).toISOString(), 'ISO 8601')}
            >
              {copiedKey === 'ISO 8601' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Way Conversion Section */}
      <div className="tool-split-container">
        {/* Timestamp -> Date Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Timestamp → Human Date</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={isMs} onChange={(e) => setIsMs(e.target.checked)} />
              <span>Milliseconds</span>
            </label>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Enter Unix Timestamp ({isMs ? 'ms' : 'seconds'}):
              </label>
              <input
                type="number"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 14 }}
              />
            </div>

            {tsDate ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backgroundColor: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Local Time:</span>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {tsDate.toLocaleString()}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>UTC Time:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {tsDate.toUTCString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISO 8601:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {tsDate.toISOString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Relative:</span>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                    {getRelativeTime(tsDate)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--danger)', fontSize: 12.5 }}>Invalid timestamp value.</div>
            )}
          </div>
        </div>

        {/* Date -> Timestamp Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Date & Time → Timestamp</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Select Date & Time:
              </label>
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>

            {dtDate ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backgroundColor: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Seconds:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                      {Math.floor(dtDate.getTime() / 1000)}
                    </code>
                    <button
                      className="btn btn-subtle btn-sm"
                      onClick={() =>
                        copyVal(Math.floor(dtDate.getTime() / 1000).toString(), 'Seconds')
                      }
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Milliseconds:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {dtDate.getTime()}
                    </code>
                    <button
                      className="btn btn-subtle btn-sm"
                      onClick={() => copyVal(dtDate.getTime().toString(), 'Milliseconds')}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Relative:</span>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                    {getRelativeTime(dtDate)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--danger)', fontSize: 12.5 }}>Invalid date input.</div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
