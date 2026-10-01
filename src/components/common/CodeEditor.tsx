import React, { useRef, useState, useCallback } from 'react';
import { Copy, Check, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks';

interface CodeEditorProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  tabSize?: number;
  showLineNumbers?: boolean;
  onClear?: () => void;
  downloadFilename?: string;
  actions?: React.ReactNode;
  height?: string | number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  tabSize = 2,
  showLineNumbers = true,
  onClear,
  downloadFilename,
  actions,
  height,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    showToast('Copied to clipboard', 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  }, [value, showToast]);

  const handleDownload = useCallback(() => {
    if (!value) return;
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename || 'devdesk-export.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File downloaded', 'info', 2000);
  }, [value, downloadFilename, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = ' '.repeat(tabSize);

      const newValue = value.substring(0, start) + spaces + value.substring(end);
      if (onChange) onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
      }, 0);
    }
  };

  const lineCount = value ? value.split('\n').length : 1;
  const charCount = value ? value.length : 0;
  const byteCount = new Blob([value]).size;

  return (
    <div className="tool-panel" style={{ height: height || undefined }}>
      <div className="tool-panel-header">
        <span>{label}</span>
        <div className="tool-panel-actions">
          {actions}
          {onClear && !readOnly && (
            <button
              className="btn btn-subtle btn-sm"
              onClick={onClear}
              title="Clear input"
              aria-label="Clear input"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
          {downloadFilename && (
            <button
              className="btn btn-subtle btn-sm"
              onClick={handleDownload}
              disabled={!value}
              title="Download content"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          )}
          <button
            className={`btn btn-subtle btn-sm ${copied ? 'btn-primary' : ''}`}
            onClick={handleCopy}
            disabled={!value}
            title="Copy to clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied ✓' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {showLineNumbers && (
          <div
            style={{
              padding: '12px 8px 12px 10px',
              backgroundColor: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              lineHeight: '1.6',
              color: 'var(--text-muted)',
              textAlign: 'right',
              userSelect: 'none',
              overflowY: 'hidden',
              minWidth: '38px',
            }}
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="tool-editor-area"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          style={{ flex: 1 }}
        />
      </div>

      <div className="tool-panel-footer">
        <span>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} • {charCount} chars
        </span>
        <span>
          {byteCount > 1024 ? `${(byteCount / 1024).toFixed(1)} KB` : `${byteCount} B`}
        </span>
      </div>
    </div>
  );
};
