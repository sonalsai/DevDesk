import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { CodeEditor } from '../common/CodeEditor';
import { Braces, CheckCircle, AlertTriangle, ArrowUpDown, ListTree, Code2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const JsonFormatter: React.FC = () => {
  const { showToast } = useToast();
  const [input, setInput] = useState<string>(`{
  "name": "DevDesk",
  "version": "1.0.0",
  "private": true,
  "features": [
    "15 Local Developer Tools",
    "Scratchpad with Markdown",
    "Developer Task Tracker",
    "Code Snippet Library",
    "Project Workspaces"
  ],
  "author": {
    "organization": "Developer First",
    "localProcessing": true
  }
}`);
  const [indent, setIndent] = useState<number>(2);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');

  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    try {
      let parsed = JSON.parse(input);

      if (sortKeys && typeof parsed === 'object' && parsed !== null) {
        const sortObject = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(sortObject);
          } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj)
              .sort()
              .reduce((result: any, key: string) => {
                result[key] = sortObject(obj[key]);
                return result;
              }, {});
          }
          return obj;
        };
        parsed = sortObject(parsed);
      }

      return {
        output: JSON.stringify(parsed, null, indent),
        error: null,
      };
    } catch (err: any) {
      // Extract line and column if available
      let errorMsg = err.message || 'Invalid JSON';
      const match = err.message.match(/at position (\d+)/i) || err.message.match(/line (\d+) column (\d+)/i);
      if (match) {
        if (match[2]) {
          errorMsg = `Parse error at line ${match[1]}, column ${match[2]}: ${err.message}`;
        } else {
          const pos = parseInt(match[1], 10);
          const lines = input.substring(0, pos).split('\n');
          const line = lines.length;
          const col = lines[lines.length - 1].length + 1;
          errorMsg = `Parse error at line ${line}, column ${col}: ${err.message}`;
        }
      }
      return { output: '', error: errorMsg };
    }
  }, [input, indent, sortKeys]);

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      showToast('Minified JSON', 'info', 1500);
    } catch (err: any) {
      showToast('Cannot minify: Invalid JSON', 'error', 2500);
    }
  };

  const handleFormat = () => {
    if (output) {
      setInput(output);
      showToast('Formatted JSON', 'success', 1500);
    }
  };

  // Interactive Tree View Component
  const renderJsonTree = (data: any, name?: string): React.ReactNode => {
    if (data === null) {
      return (
        <div className="json-tree-item">
          {name && <span className="json-key">"{name}": </span>}
          <span className="json-null">null</span>
        </div>
      );
    }

    if (typeof data === 'boolean') {
      return (
        <div className="json-tree-item">
          {name && <span className="json-key">"{name}": </span>}
          <span className="json-boolean">{data.toString()}</span>
        </div>
      );
    }

    if (typeof data === 'number') {
      return (
        <div className="json-tree-item">
          {name && <span className="json-key">"{name}": </span>}
          <span className="json-number">{data}</span>
        </div>
      );
    }

    if (typeof data === 'string') {
      return (
        <div className="json-tree-item">
          {name && <span className="json-key">"{name}": </span>}
          <span className="json-string">"{data}"</span>
        </div>
      );
    }

    if (Array.isArray(data)) {
      return (
        <details className="json-tree-item" open>
          <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {name && <span className="json-key">"{name}": </span>}
            <span style={{ color: 'var(--text-muted)' }}>[{data.length} items]</span>
          </summary>
          <div style={{ paddingLeft: 12 }}>
            {data.map((item, idx) => (
              <div key={idx}>{renderJsonTree(item, idx.toString())}</div>
            ))}
          </div>
        </details>
      );
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return (
        <details className="json-tree-item" open>
          <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {name && <span className="json-key">"{name}": </span>}
            <span style={{ color: 'var(--text-muted)' }}>&#123;{keys.length} keys&#125;</span>
          </summary>
          <div style={{ paddingLeft: 12 }}>
            {keys.map((key) => (
              <div key={key}>{renderJsonTree(data[key], key)}</div>
            ))}
          </div>
        </details>
      );
    }

    return null;
  };

  let parsedForTree: any = null;
  if (viewMode === 'tree') {
    try {
      parsedForTree = JSON.parse(input);
    } catch {
      parsedForTree = null;
    }
  }

  return (
    <ToolLayout
      toolId="json-formatter"
      title="JSON Formatter"
      description="Format, validate, sort keys, and inspect JSON in code or tree view."
      icon={Braces}
      actions={
        <>
          <div className="toolbar-group">
            <button className="btn btn-secondary btn-sm" onClick={handleFormat}>
              Format
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleMinify}>
              Minify
            </button>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Indent:</span>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                style={{ padding: '3px 6px', fontSize: 11.5 }}
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={1}>1 tab</option>
              </select>
            </label>
            <button
              className={`btn btn-sm ${sortKeys ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSortKeys(!sortKeys)}
              title="Sort object keys alphabetically"
            >
              <ArrowUpDown size={12} />
              <span>Sort Keys</span>
            </button>
          </div>

          <div className="toolbar-group">
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${viewMode === 'code' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setViewMode('code')}
              >
                <Code2 size={12} />
                <span>Code</span>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setViewMode('tree')}
              >
                <ListTree size={12} />
                <span>Tree</span>
              </button>
            </div>
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
          <span>Valid JSON</span>
        </div>
      ) : null}

      <div className="tool-split-container">
        <CodeEditor
          label="Input (Raw JSON)"
          value={input}
          onChange={setInput}
          placeholder="Paste raw JSON here..."
          onClear={() => setInput('')}
        />

        {viewMode === 'code' ? (
          <CodeEditor
            label="Output (Formatted JSON)"
            value={output}
            readOnly
            downloadFilename="formatted.json"
            placeholder="Formatted output will appear here..."
          />
        ) : (
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span>Interactive JSON Tree</span>
            </div>
            <div className="tool-editor-area" style={{ overflow: 'auto' }}>
              {parsedForTree ? (
                <div className="json-tree-container">{renderJsonTree(parsedForTree)}</div>
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: 12 }}>
                  Tree view requires valid JSON input.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
