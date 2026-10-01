import React from 'react';

interface LoadingFallbackProps {
  label?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ label = 'Loading workspace module...' }) => {
  return (
    <div
      className="workspace-page"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '-0.2px',
        }}
      >
        {label}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
