import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { CodeEditor } from '../common/CodeEditor';
import { Minimize2, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks';

export const JsonMinifier: React.FC = () => {
  const { showToast } = useToast();
  const [input, setInput] = useState<string>(`{
  "project": "DevDesk",
  "developer": "Local First",
  "tools": [
    "JSON Formatter",
    "JSON Minifier",
    "JWT Decoder"
  ],
  "config": {
    "enabled": true,
    "maxSizeMb": 10
  }
}`);

  const { minified, originalSize, minifiedSize, reductionPercent, error } = useMemo(() => {
    if (!input.trim()) {
      return { minified: '', originalSize: 0, minifiedSize: 0, reductionPercent: 0, error: null };
    }
    try {
      const parsed = JSON.parse(input);
      const res = JSON.stringify(parsed);
      const origBytes = new Blob([input]).size;
      const miniBytes = new Blob([res]).size;
      const reduction = origBytes > 0 ? (((origBytes - miniBytes) / origBytes) * 100).toFixed(1) : 0;
      return {
        minified: res,
        originalSize: origBytes,
        minifiedSize: miniBytes,
        reductionPercent: Number(reduction),
        error: null,
      };
    } catch (err: any) {
      return {
        minified: '',
        originalSize: new Blob([input]).size,
        minifiedSize: 0,
        reductionPercent: 0,
        error: err.message || 'Invalid JSON format',
      };
    }
  }, [input]);

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      showToast('Formatted JSON', 'info', 1500);
    } catch {
      showToast('Cannot format: Invalid JSON', 'error', 2000);
    }
  };

  const handleMinifyInput = () => {
    if (minified) {
      setInput(minified);
      showToast('Replaced input with minified result', 'success', 1500);
    }
  };

  return (
    <ToolLayout
      toolId="json-minifier"
      title="JSON Minifier"
      description="Compress JSON by stripping all unnecessary whitespace and indentation."
      icon={Minimize2}
      actions={
        <>
          <div className="toolbar-group">
            <button className="btn btn-secondary btn-sm" onClick={handleFormat}>
              Format Input
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleMinifyInput} disabled={!minified}>
              Minify to Input
            </button>
          </div>

          <div className="toolbar-group" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Original: <strong>{originalSize} B</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Minified: <strong>{minifiedSize} B</strong>
            </span>
            {reductionPercent > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'var(--success-subtle)',
                  color: 'var(--success)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                <TrendingDown size={13} />
                {reductionPercent}% reduction
              </span>
            )}
          </div>
        </>
      }
    >
      {error ? (
        <div
          style={{
            backgroundColor: 'var(--danger-subtle)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--danger)',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      ) : input.trim() ? (
        <div
          style={{
            backgroundColor: 'var(--success-subtle)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            color: 'var(--success)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle size={14} />
          <span>Valid JSON ready for minification</span>
        </div>
      ) : null}

      <div className="tool-split-container">
        <CodeEditor
          label="Input JSON"
          value={input}
          onChange={setInput}
          placeholder="Paste JSON to minify..."
          onClear={() => setInput('')}
        />

        <CodeEditor
          label="Minified Output"
          value={minified}
          readOnly
          downloadFilename="minified.json"
          placeholder="Minified single-line JSON will appear here..."
        />
      </div>
    </ToolLayout>
  );
};
