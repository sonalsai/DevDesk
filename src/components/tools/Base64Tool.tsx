import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { CodeEditor } from '../common/CodeEditor';
import { Binary, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks';

export const Base64Tool: React.FC = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [input, setInput] = useState<string>('Hello, DevDesk developer workspace!');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        const utf8Bytes = new TextEncoder().encode(input);
        let binaryStr = '';
        utf8Bytes.forEach((b) => (binaryStr += String.fromCharCode(b)));
        let b64 = btoa(binaryStr);
        if (urlSafe) {
          b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        return { output: b64, error: null };
      } else {
        let b64 = input.trim();
        if (urlSafe || b64.includes('-') || b64.includes('_')) {
          b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4 !== 0) {
            b64 += '=';
          }
        }
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const decoded = new TextDecoder().decode(bytes);
        return { output: decoded, error: null };
      }
    } catch (err: any) {
      return { output: '', error: `Decode failed: ${err.message}` };
    }
  }, [input, mode, urlSafe]);

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setMode(mode === 'encode' ? 'decode' : 'encode');
      showToast('Swapped input & output', 'info', 1500);
    }
  };

  return (
    <ToolLayout
      toolId="base64"
      title="Base64 Encoder / Decoder"
      description="Encode and decode text strings to and from Base64 with standard or URL-safe encoding."
      icon={Binary}
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
                checked={urlSafe}
                onChange={(e) => setUrlSafe(e.target.checked)}
              />
              <span>URL Safe (- and _ instead of + and /)</span>
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
          label={mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
          value={input}
          onChange={setInput}
          placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste Base64 to decode...'}
          onClear={() => setInput('')}
        />

        <CodeEditor
          label={mode === 'encode' ? 'Base64 Output' : 'Decoded Plain Text'}
          value={output}
          readOnly
          downloadFilename={mode === 'encode' ? 'encoded.b64' : 'decoded.txt'}
          placeholder="Output will appear here..."
        />
      </div>
    </ToolLayout>
  );
};
