import React from 'react';
import { Modal } from '../../common/Modal';
import { ShieldAlert } from 'lucide-react';

interface GitSensitiveWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filePaths: string[];
}

export const GitSensitiveWarningModal: React.FC<GitSensitiveWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  filePaths,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Potential Secret Detected"
      maxWidth={460}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-warning"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Stage Anyway
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}>
          <ShieldAlert size={24} />
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
            The following file(s) appear to contain sensitive environment values, tokens, or private keys:
          </p>

          <div
            style={{
              maxHeight: 120,
              overflowY: 'auto',
              backgroundColor: 'var(--bg-input)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              marginBottom: 10,
            }}
          >
            {filePaths.map((f, i) => (
              <div key={i} style={{ color: 'var(--warning)', fontWeight: 600 }}>
                {f}
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.4 }}>
            Committing secrets or environment files to version control is a common security risk. Consider adding them to <code>.gitignore</code> instead.
          </p>
        </div>
      </div>
    </Modal>
  );
};
