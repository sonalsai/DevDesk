import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { CodeEditor } from '../common/CodeEditor';
import { Link2, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const UrlEncoderTool: React.FC = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [componentOnly, setComponentOnly] = useState<boolean>(true);
  const [input, setInput] = useState<string>(
    'https://api.devdesk.io/v1/search?query=react debounce & tags=dev,tools#section-1'
  );

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        const res = componentOnly ? encodeURIComponent(input) : encodeURI(input);
        return { output: res, error: null };
      } else {
        const res = componentOnly ? decodeURIComponent(input) : decodeURI(input);
        return { output: res, error: null };
      }
    } catch (err: any) {
      return { output: '', error: `URL decoding failed: ${err.message}` };
    }
  }, [input, mode, componentOnly]);

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setMode(mode === 'encode' ? 'decode' : 'encode');
      showToast('Swapped input & output', 'info', 1500);
    }
  };

  return (
    <ToolLayout
      toolId="url-encoder"
      title="URL Encoder / Decoder"
      description="Safely encode special URL characters or decode URI query parameters."
      icon={Link2}
      actions={
        <>
          <div className="toolbar-group">
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setMode('encode')}
              >
                Encode
              </button>
              <button
                className={`btn btn-sm ${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setMode('decode')}
              >
                Decode
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleSwap} disabled={!output}>
              <ArrowRightLeft size={13} />
              <span>Swap</span>
            </button>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={componentOnly}
                onChange={(e) => setComponentOnly(e.target.checked)}
              />
              <span>Encode Component (encodes / ? & # :)</span>
            </label>
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
        <CodeEditor
          label={mode === 'encode' ? 'Decoded / Plain URL Input' : 'Encoded URL Input'}
          value={input}
          onChange={setInput}
          placeholder={mode === 'encode' ? 'Paste URL or query string...' : 'Paste encoded URL...'}
          onClear={() => setInput('')}
        />

        <CodeEditor
          label={mode === 'encode' ? 'Encoded URL Output' : 'Decoded URL Output'}
          value={output}
          readOnly
          downloadFilename="url-result.txt"
          placeholder="Output will appear here..."
        />
      </div>
    </ToolLayout>
  );
};
