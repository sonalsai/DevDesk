import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { CodeEditor } from '../common/CodeEditor';
import { RefreshCw, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import YAML from 'yaml';
import { useToast } from '../../context/ToastContext';

export const JsonYamlConverter: React.FC = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'json-to-yaml' | 'yaml-to-json'>('json-to-yaml');
  const [jsonInput, setJsonInput] = useState<string>(`{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "name": "devdesk_db",
    "pool": 10
  },
  "tags": [
    "api",
    "backend",
    "production"
  ]
}`);
  const [yamlInput, setYamlInput] = useState<string>(`server:
  host: localhost
  port: 8080
  ssl: true
database:
  name: devdesk_db
  pool: 10
tags:
  - api
  - backend
  - production
`);

  const { output, error } = useMemo(() => {
    if (mode === 'json-to-yaml') {
      if (!jsonInput.trim()) return { output: '', error: null };
      try {
        const parsed = JSON.parse(jsonInput);
        const yamlStr = YAML.stringify(parsed);
        return { output: yamlStr, error: null };
      } catch (err: any) {
        return { output: '', error: `Invalid JSON: ${err.message}` };
      }
    } else {
      if (!yamlInput.trim()) return { output: '', error: null };
      try {
        const parsed = YAML.parse(yamlInput);
        const jsonStr = JSON.stringify(parsed, null, 2);
        return { output: jsonStr, error: null };
      } catch (err: any) {
        return { output: '', error: `Invalid YAML: ${err.message}` };
      }
    }
  }, [mode, jsonInput, yamlInput]);

  const handleSwap = () => {
    if (mode === 'json-to-yaml') {
      if (output) setYamlInput(output);
      setMode('yaml-to-json');
    } else {
      if (output) setJsonInput(output);
      setMode('json-to-yaml');
    }
    showToast('Swapped conversion direction', 'info', 1500);
  };

  return (
    <ToolLayout
      toolId="json-yaml"
      title="JSON ↔ YAML Converter"
      description="Two-way conversion between JSON and YAML with syntax validation."
      icon={ArrowRightLeft}
      actions={
        <>
          <div className="toolbar-group">
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${mode === 'json-to-yaml' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setMode('json-to-yaml')}
              >
                JSON → YAML
              </button>
              <button
                className={`btn btn-sm ${mode === 'yaml-to-json' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setMode('yaml-to-json')}
              >
                YAML → JSON
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleSwap} title="Swap direction & content">
              <RefreshCw size={13} />
              <span>Swap</span>
            </button>
          </div>
        </>
      }
    >
      {error && (
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
      )}

      <div className="tool-split-container">
        {mode === 'json-to-yaml' ? (
          <>
            <CodeEditor
              label="JSON Input"
              value={jsonInput}
              onChange={setJsonInput}
              placeholder="Paste JSON here..."
              onClear={() => setJsonInput('')}
            />
            <CodeEditor
              label="YAML Output"
              value={output}
              readOnly
              downloadFilename="converted.yaml"
              placeholder="Converted YAML will appear here..."
            />
          </>
        ) : (
          <>
            <CodeEditor
              label="YAML Input"
              value={yamlInput}
              onChange={setYamlInput}
              placeholder="Paste YAML here..."
              onClear={() => setYamlInput('')}
            />
            <CodeEditor
              label="JSON Output"
              value={output}
              readOnly
              downloadFilename="converted.json"
              placeholder="Converted JSON will appear here..."
            />
          </>
        )}
      </div>
    </ToolLayout>
  );
};
