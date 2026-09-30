import React, { useState, useEffect, useCallback } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Fingerprint, RefreshCw, Copy, Check, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const UuidGenerator: React.FC = () => {
  const { showToast } = useToast();
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphenated, setHyphenated] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const generateUuids = useCallback(() => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let id: string = crypto.randomUUID();
      if (!hyphenated) {
        id = id.replace(/-/g, '');
      }
      if (uppercase) {
        id = id.toUpperCase();
      }
      list.push(id);
    }
    setUuids(list);
  }, [count, uppercase, hyphenated]);

  useEffect(() => {
    generateUuids();
  }, [generateUuids]);

  const copyIndividual = (uuid: string, index: number) => {
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    showToast('UUID copied', 'success', 1500);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    showToast(`Copied ${uuids.length} UUIDs`, 'success', 2000);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const downloadAll = () => {
    const blob = new Blob([uuids.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${count}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded UUID list', 'info', 1500);
  };

  return (
    <ToolLayout
      toolId="uuid-generator"
      title="UUID Generator"
      description="Generate cryptographically secure Version 4 UUIDs individually or in bulk."
      icon={Fingerprint}
      actions={
        <>
          <div className="toolbar-group">
            <button className="btn btn-primary btn-sm" onClick={generateUuids}>
              <RefreshCw size={13} />
              <span>Regenerate</span>
            </button>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Count:</span>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                style={{ padding: '3px 8px', fontSize: 12 }}
              >
                <option value={1}>1</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>Uppercase</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={hyphenated}
                onChange={(e) => setHyphenated(e.target.checked)}
              />
              <span>Hyphenated</span>
            </label>
          </div>

          <div className="toolbar-group">
            <button className="btn btn-secondary btn-sm" onClick={downloadAll}>
              <Download size={13} />
              <span>Download</span>
            </button>
            <button
              className={`btn btn-sm ${copiedAll ? 'btn-primary' : 'btn-secondary'}`}
              onClick={copyAll}
            >
              {copiedAll ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedAll ? 'All Copied ✓' : 'Copy All'}</span>
            </button>
          </div>
        </>
      }
    >
      <div className="tool-panel" style={{ minHeight: '420px', flex: 1 }}>
        <div className="tool-panel-header">
          <span>Generated UUIDs (v4 Cryptographically Secure)</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{uuids.length} items</span>
        </div>

        <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {uuids.map((id, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-code)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 24 }}>
                  {index + 1}.
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{id}</span>
              </div>
              <button
                className={`btn btn-subtle btn-sm ${copiedIndex === index ? 'btn-primary' : ''}`}
                onClick={() => copyIndividual(id, index)}
                title="Copy this UUID"
              >
                {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
};
