import React, { useState, useCallback } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { ShieldCheck, RefreshCw, Copy, Check, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

function createSecurePassword(
  len: number,
  upper: boolean,
  lower: boolean,
  nums: boolean,
  syms: boolean,
  noAmbiguous: boolean
): string {
  let charset = '';
  if (upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (nums) charset += '0123456789';
  if (syms) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (noAmbiguous) {
    charset = charset.replace(/[1lI0Oo`'"~,;:.<>{}[\]()/\\]/g, '');
  }

  if (!charset) return '';

  const randomValues = new Uint32Array(len);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < len; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export const PasswordGenerator: React.FC = () => {
  const { showToast } = useToast();
  const [length, setLength] = useState<number>(20);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [password, setPassword] = useState<string>(() =>
    createSecurePassword(20, true, true, true, true, false)
  );
  const [copied, setCopied] = useState<boolean>(false);

  const handleRegenerate = useCallback(() => {
    setPassword(
      createSecurePassword(
        length,
        includeUpper,
        includeLower,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous
      )
    );
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeAmbiguous]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    showToast('Password copied to clipboard', 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  // Entropy calculation
  const calculateStrength = () => {
    let poolSize = 0;
    if (includeUpper) poolSize += 26;
    if (includeLower) poolSize += 26;
    if (includeNumbers) poolSize += 10;
    if (includeSymbols) poolSize += 30;

    const entropy = Math.round(length * Math.log2(poolSize || 1));

    if (entropy < 36) return { label: 'Weak', color: 'var(--danger)', percent: 25, entropy };
    if (entropy < 60) return { label: 'Moderate', color: 'var(--warning)', percent: 55, entropy };
    if (entropy < 85) return { label: 'Strong', color: 'var(--success)', percent: 80, entropy };
    return { label: 'Very Strong', color: 'var(--success)', percent: 100, entropy };
  };

  const strength = calculateStrength();

  return (
    <ToolLayout
      toolId="password-generator"
      title="Password Generator"
      description="Generate cryptographically strong passwords locally with browser randomness."
      icon={Lock}
      actions={
        <button className="btn btn-primary btn-sm" onClick={handleRegenerate}>
          <RefreshCw size={13} />
          <span>Regenerate Password</span>
        </button>
      }
    >
      {/* Generated Password Hero Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              letterSpacing: '1px',
            }}
          >
            {password || 'Select at least one character type'}
          </div>

          <button
            className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleCopy}
            disabled={!password}
            style={{ flexShrink: 0 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied ✓' : 'Copy'}</span>
          </button>
        </div>

        {/* Strength meter bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
            <span style={{ fontWeight: 600, color: strength.color }}>
              {strength.label} ({strength.entropy} bits entropy)
            </span>
          </div>
          <div
            style={{
              height: 4,
              backgroundColor: 'var(--bg-input)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${strength.percent}%`,
                height: '100%',
                backgroundColor: strength.color,
                transition: 'width 200ms ease, background-color 200ms ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Options Panel */}
      <div
        className="tool-panel"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* Length Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 550, color: 'var(--text-primary)' }}>
              Password Length: <span style={{ color: 'var(--accent)' }}>{length}</span> characters
            </label>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </div>

        {/* Character Set Toggles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeUpper}
              onChange={(e) => setIncludeUpper(e.target.checked)}
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeLower}
              onChange={(e) => setIncludeLower(e.target.checked)}
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
            />
            <span>Numbers (0-9)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
            />
            <span>Symbols (!@#$%^&*)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            />
            <span>Exclude Ambiguous (0, O, 1, l, I, quotes)</span>
          </label>
        </div>

        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
          <span>Never saved or transmitted. Generated strictly within your browser's crypto memory.</span>
        </div>
      </div>
    </ToolLayout>
  );
};
