import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import type { ApiRequest, Environment } from '../../../types/api';
import { parseCurlToRequest, generateCurlCommand } from '../../../services/curlParser';
import { useToast } from '../../../context/ToastContext';
import { Copy, Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface CurlToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRequest: ApiRequest;
  environment?: Environment;
  onImport: (parsed: Partial<ApiRequest>) => void;
}

export const CurlToolkitModal: React.FC<CurlToolkitModalProps> = ({
  isOpen,
  onClose,
  currentRequest,
  environment,
  onImport,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [curlInput, setCurlInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const exportedCurl = generateCurlCommand(currentRequest, environment);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedCurl);
    setCopied(true);
    showToast('cURL command copied to clipboard', 'success', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleImport = () => {
    setParseError(null);
    if (!curlInput.trim()) {
      setParseError('Please enter a cURL command string.');
      return;
    }

    try {
      const parsed = parseCurlToRequest(curlInput);
      onImport(parsed);
      showToast('cURL command imported successfully!', 'success', 2000);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse cURL command.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="cURL Toolkit"
      maxWidth={640}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mode Tabs */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
          <button
            className={`btn btn-sm ${mode === 'export' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0 }}
            onClick={() => setMode('export')}
          >
            Export to cURL
          </button>
          <button
            className={`btn btn-sm ${mode === 'import' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0 }}
            onClick={() => setMode('import')}
          >
            Import cURL Command
          </button>
        </div>

        {mode === 'export' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Generated executable cURL command for <strong>{currentRequest.name}</strong>:
              </span>
              <button
                className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied ✓' : 'Copy cURL'}</span>
              </button>
            </div>

            <pre
              className="tool-editor-area"
              style={{
                maxHeight: '260px',
                minHeight: '160px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {exportedCurl}
            </pre>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Paste a raw cURL command to populate method, URL, headers, and request body:
            </span>

            <textarea
              className="tool-editor-area"
              value={curlInput}
              onChange={(e) => {
                setCurlInput(e.target.value);
                setParseError(null);
              }}
              placeholder={`curl -X POST "https://api.example.com/v1/users" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer token123" \\\n  -d '{"name":"Alice"}'`}
              style={{
                minHeight: '180px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
              spellCheck={false}
            />

            {parseError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  fontSize: 12,
                }}
              >
                <AlertTriangle size={14} />
                <span>{parseError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleImport}>
                <ArrowRight size={13} />
                <span>Import to Active Tab</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
