import React, { useState, useEffect } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Hash, Copy, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks';

export const HashGenerator: React.FC = () => {
  const { showToast } = useToast();
  const [input, setInput] = useState<string>('The quick brown fox jumps over the lazy dog');
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hashes, setHashes] = useState<{
    sha256: string;
    sha384: string;
    sha512: string;
  }>({
    sha256: '',
    sha384: '',
    sha512: '',
  });
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function computeHashes() {
      if (!input) {
        setHashes({ sha256: '', sha384: '', sha512: '' });
        return;
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      const [buf256, buf384, buf512] = await Promise.all([
        crypto.subtle.digest('SHA-256', data),
        crypto.subtle.digest('SHA-384', data),
        crypto.subtle.digest('SHA-512', data),
      ]);

      const toHex = (buf: ArrayBuffer) => {
        const hashArray = Array.from(new Uint8Array(buf));
        const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return uppercase ? hex.toUpperCase() : hex.toLowerCase();
      };

      if (!isCancelled) {
        setHashes({
          sha256: toHex(buf256),
          sha384: toHex(buf384),
          sha512: toHex(buf512),
        });
      }
    }

    computeHashes();

    return () => {
      isCancelled = true;
    };
  }, [input, uppercase]);

  const copyHash = (hash: string, algo: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedAlgo(algo);
    showToast(`Copied ${algo} hash`, 'success', 1500);
    setTimeout(() => setCopiedAlgo(null), 1500);
  };

  return (
    <ToolLayout
      toolId="hash-generator"
      title="Hash Generator"
      description="Compute cryptographic SHA-256, SHA-384, and SHA-512 hashes locally with Web Crypto."
      icon={Hash}
      actions={
        <div className="toolbar-group">
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <span>Uppercase Hex</span>
          </label>
        </div>
      }
    >
      {/* Educational Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span>
          <strong>Cryptographic Hashing vs Encryption:</strong> Hashing is a one-way deterministic mathematical function. Unlike encryption, hashes cannot be reversed or decrypted back into the original input.
        </span>
      </div>

      <div className="tool-panel">
        <div className="tool-panel-header">
          <span>Input Text</span>
          <button className="btn btn-subtle btn-sm" onClick={() => setInput('')}>
            Clear
          </button>
        </div>
        <textarea
          className="tool-editor-area"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text to hash..."
          style={{ minHeight: '120px', height: '120px' }}
        />
      </div>

      {/* Generated Hashes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* SHA-256 */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span style={{ color: 'var(--syn-key)', fontWeight: 600 }}>SHA-256 (256-bit / 32 bytes)</span>
            <button
              className={`btn btn-subtle btn-sm ${copiedAlgo === 'SHA-256' ? 'btn-primary' : ''}`}
              onClick={() => copyHash(hashes.sha256, 'SHA-256')}
              disabled={!hashes.sha256}
            >
              {copiedAlgo === 'SHA-256' ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedAlgo === 'SHA-256' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-code)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
            }}
          >
            {hashes.sha256 || 'Hash will appear here...'}
          </div>
        </div>

        {/* SHA-384 */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span style={{ color: 'var(--syn-string)', fontWeight: 600 }}>SHA-384 (384-bit / 48 bytes)</span>
            <button
              className={`btn btn-subtle btn-sm ${copiedAlgo === 'SHA-384' ? 'btn-primary' : ''}`}
              onClick={() => copyHash(hashes.sha384, 'SHA-384')}
              disabled={!hashes.sha384}
            >
              {copiedAlgo === 'SHA-384' ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedAlgo === 'SHA-384' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-code)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
            }}
          >
            {hashes.sha384 || 'Hash will appear here...'}
          </div>
        </div>

        {/* SHA-512 */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span style={{ color: 'var(--syn-boolean)', fontWeight: 600 }}>SHA-512 (512-bit / 64 bytes)</span>
            <button
              className={`btn btn-subtle btn-sm ${copiedAlgo === 'SHA-512' ? 'btn-primary' : ''}`}
              onClick={() => copyHash(hashes.sha512, 'SHA-512')}
              disabled={!hashes.sha512}
            >
              {copiedAlgo === 'SHA-512' ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedAlgo === 'SHA-512' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-code)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              wordBreak: 'break-all',
              color: 'var(--text-primary)',
            }}
          >
            {hashes.sha512 || 'Hash will appear here...'}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
