import React from 'react';
import { Modal } from '../common/Modal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ShieldCheck, Lock, Database, EyeOff, ServerOff, CheckCircle } from 'lucide-react';

export const PrivacyModal: React.FC = () => {
  const { isPrivacyModalOpen, setIsPrivacyModalOpen } = useWorkspace();

  return (
    <Modal
      isOpen={isPrivacyModalOpen}
      onClose={() => setIsPrivacyModalOpen(false)}
      title="Privacy & Local Architecture"
      maxWidth={580}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            backgroundColor: 'var(--success-subtle)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ShieldCheck size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
              100% Local-First Architecture
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              All 15 utilities and workspace modules run strictly within your browser's local sandbox.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <ServerOff size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Zero Remote Processing
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your JSON, JWT tokens, base64 payloads, passwords, and source code never leave your computer. There are no backend API calls sending your inputs over the wire.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <EyeOff size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                No Secrets in History
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Recent history only records high-level metadata (such as tool name and visit timestamp). Tool inputs, credentials, tokens, and outputs are never stored in history.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Lock size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Cryptographic Randomness
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                UUIDs and passwords use standard Web Crypto API (`crypto.getRandomValues()` and `crypto.randomUUID()`) to guarantee high-entropy randomness.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Database size={18} style={{ color: 'var(--cat-project)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Full Data Ownership
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You can export your complete workspace anytime as a standard JSON file or clear it in one click from Settings.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsPrivacyModalOpen(false)}
          >
            <CheckCircle size={13} />
            <span>Understood</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
