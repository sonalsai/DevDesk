import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import type { ApiRequest, Environment } from '../../../types/api';
import { generateCodeSnippet, type SupportedLanguage } from '../../../services/codeGenerator';
import { useToast } from '@/hooks';
import { Copy, Check } from 'lucide-react';

interface CodeGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApiRequest;
  environment?: Environment;
}

const LANGUAGES: { id: SupportedLanguage; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'javascript-fetch', label: 'Fetch' },
  { id: 'javascript-axios', label: 'Axios' },
  { id: 'python-requests', label: 'Python (requests)' },
  { id: 'python-httpx', label: 'Python (httpx)' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'php', label: 'PHP' },
];

export const CodeGenerationModal: React.FC<CodeGenerationModalProps> = ({
  isOpen,
  onClose,
  request,
  environment,
}) => {
  const { showToast } = useToast();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('curl');
  const [copied, setCopied] = useState<boolean>(false);

  const snippet = generateCodeSnippet(selectedLang, request, environment);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    showToast(`Code copied to clipboard!`, 'success', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate Code — ${request.name || 'API Request'}`}
      maxWidth={720}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Language Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              className={`btn btn-sm ${selectedLang === lang.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedLang(lang.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Header with copy */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Method: <strong style={{ color: 'var(--text-primary)' }}>{request.method}</strong> | Auth & secrets use variables where possible.
          </span>
          <button
            className={`btn btn-sm ${copied ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleCopy}
            title="Copy code snippet"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied ✓' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Block */}
        <pre
          className="tool-editor-area"
          style={{
            minHeight: '220px',
            maxHeight: '360px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {snippet}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
