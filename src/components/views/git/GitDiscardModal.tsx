import React from 'react';
import { Modal } from '../../common/Modal';
import { AlertTriangle } from 'lucide-react';

interface GitDiscardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filePaths: string[];
}

export const GitDiscardModal: React.FC<GitDiscardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  filePaths,
}) => {
  const isMultiple = filePaths.length > 1;
  const title = isMultiple ? `Discard ${filePaths.length} files?` : 'Discard changes?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth={460}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Discard Changes
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }}>
          <AlertTriangle size={22} />
        </div>
        <div>
          {isMultiple ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
              Are you sure you want to discard changes in <strong>{filePaths.length} files</strong>?
            </p>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
              <strong>{filePaths[0]}</strong> has uncommitted changes.
            </p>
          )}

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
              <div key={i} style={{ color: 'var(--danger)' }}>
                {f}
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.4 }}>
            This action will revert your working tree changes and cannot be undone through DevDesk.
          </p>
        </div>
      </div>
    </Modal>
  );
};
