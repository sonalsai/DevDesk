import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Sample valid JWT for easy developer testing
const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXItMTI0NSIsIm5hbWUiOiJBbGV4IFJpdmVyYSIsImFkbWluIjp0cnVlLCJpc3MiOiJodHRwczovL2F1dGguZGV2ZGVzay5pbyIsImF1ZCI6ImRldmRlc2stYXBpIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4z7k_q7N8c8X-n8B7n4_5e9T-3x8w8r1Y7z8x9C0v1U';

function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw new Error('Illegal base64url string!');
  }
  try {
    return decodeURIComponent(
      atob(output)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(output);
  }
}

export const JwtDecoder: React.FC = () => {
  const { showToast } = useToast();
  const [token, setToken] = useState<string>(SAMPLE_JWT);
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const decoded = useMemo(() => {
    if (!token.trim()) {
      return null;
    }
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return {
        error: 'Invalid JWT structure: Token must contain exactly 3 dot-separated parts (Header.Payload.Signature)',
      };
    }

    try {
      const headerStr = base64UrlDecode(parts[0]);
      const payloadStr = base64UrlDecode(parts[1]);
      const signature = parts[2];

      const header = JSON.parse(headerStr);
      const payload = JSON.parse(payloadStr);

      // Check expiration
      let isExpired: boolean | null = null;
      let expDate: Date | null = null;
      let iatDate: Date | null = null;

      if (payload.exp) {
        expDate = new Date(payload.exp * 1000);
        isExpired = expDate.getTime() < Date.now();
      }

      if (payload.iat) {
        iatDate = new Date(payload.iat * 1000);
      }

      return {
        header,
        payload,
        signature,
        isExpired,
        expDate,
        iatDate,
        error: null,
      };
    } catch (err: any) {
      return {
        error: `Failed to decode JWT: ${err.message}`,
      };
    }
  }, [token]);

  const copyToClipboard = (text: string, part: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPart(part);
    showToast(`Copied ${part}`, 'success', 1500);
    setTimeout(() => setCopiedPart(null), 1500);
  };

  return (
    <ToolLayout
      toolId="jwt-decoder"
      title="JWT Decoder"
      description="Decode and inspect JSON Web Tokens (Header, Payload, Claims, and Expiration)."
      icon={KeyRound}
      actions={
        <div className="toolbar-group">
          <button className="btn btn-secondary btn-sm" onClick={() => setToken(SAMPLE_JWT)}>
            Load Sample JWT
          </button>
          <button className="btn btn-subtle btn-sm" onClick={() => setToken('')}>
            Clear
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Token Input Box */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Encoded Token</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              🔒 Processed locally in your browser. Never sent over the network.
            </span>
          </div>
          <textarea
            className="tool-editor-area"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste JWT here (e.g. eyJhbGci...)..."
            style={{ minHeight: '90px', height: '90px' }}
            spellCheck={false}
          />
        </div>

        {decoded?.error ? (
          <div
            style={{
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{decoded.error}</span>
          </div>
        ) : decoded && !decoded.error ? (
          <>
            {/* Claims & Expiration Status Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {decoded.isExpired === false && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--success)',
                      fontWeight: 600,
                      fontSize: 12.5,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Valid (Active)
                  </span>
                )}
                {decoded.isExpired === true && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--danger)',
                      fontWeight: 600,
                      fontSize: 12.5,
                    }}
                  >
                    <AlertTriangle size={16} />
                    Expired
                  </span>
                )}
                {decoded.isExpired === null && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    No expiration (`exp`) claim specified
                  </span>
                )}
                {decoded.expDate && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    Expires: {decoded.expDate.toLocaleString()}
                  </span>
                )}
                {decoded.iatDate && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    Issued: {decoded.iatDate.toLocaleString()}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <ShieldAlert size={13} />
                <span>Signature decoded but not cryptographically verified against a public key</span>
              </div>
            </div>

            {/* Decoded Sections: Header & Payload & Signature */}
            <div className="tool-split-container" style={{ minHeight: '360px' }}>
              {/* Header */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span style={{ color: 'var(--danger)' }}>Header (Algorithm & Type)</span>
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(decoded.header, null, 2), 'Header')
                    }
                  >
                    {copiedPart === 'Header' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPart === 'Header' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre
                  className="tool-editor-area"
                  style={{ color: 'var(--text-primary)', margin: 0 }}
                >
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              {/* Payload */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span style={{ color: 'var(--syn-boolean)' }}>Payload (Claims & Data)</span>
                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'Payload')
                    }
                  >
                    {copiedPart === 'Payload' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPart === 'Payload' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre
                  className="tool-editor-area"
                  style={{ color: 'var(--text-primary)', margin: 0 }}
                >
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Signature Block */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ color: 'var(--info)' }}>Signature (Raw base64url)</span>
                <button
                  className="btn btn-subtle btn-sm"
                  onClick={() => copyToClipboard(decoded.signature || '', 'Signature')}
                >
                  {copiedPart === 'Signature' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPart === 'Signature' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-code)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  wordBreak: 'break-all',
                  color: 'var(--text-secondary)',
                }}
              >
                {decoded.signature}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ToolLayout>
  );
};
