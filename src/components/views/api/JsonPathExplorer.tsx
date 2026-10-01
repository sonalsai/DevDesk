import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks';

interface JsonPathExplorerProps {
  data: any;
}

interface TreeNodeProps {
  name: string;
  value: any;
  currentPath: string;
  isLast?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ name, value, currentPath }) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentPath);
    setCopied(true);
    showToast(`Copied path: ${currentPath}`, 'info', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderValuePreview = () => {
    if (value === null) return <span style={{ color: 'var(--danger)' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#b5cea8' }}>{String(value)}</span>;
    if (typeof value === 'number') return <span style={{ color: 'var(--info)' }}>{value}</span>;
    if (typeof value === 'string') {
      const truncated = value.length > 50 ? `${value.slice(0, 50)}...` : value;
      return <span style={{ color: '#ce9178' }}>"{truncated}"</span>;
    }
    if (isArray) return <span style={{ color: 'var(--text-tertiary)' }}>[{value.length}]</span>;
    if (isObject) return <span style={{ color: 'var(--text-tertiary)' }}>{'{' + Object.keys(value).length + '}'}</span>;
    return null;
  };

  return (
    <div style={{ marginLeft: 16, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 4px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        className="json-path-item"
        onClick={() => isObject && setIsOpen(!isOpen)}
      >
        {isObject ? (
          <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex' }}>
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span style={{ width: 13, display: 'inline-block' }} />
        )}

        <span style={{ color: 'var(--accent-hover)', fontWeight: 500 }}>{name}:</span>
        {renderValuePreview()}

        <button
          onClick={handleCopyPath}
          title={`Copy path: ${currentPath}`}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            color: copied ? 'var(--success)' : 'var(--text-tertiary)',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
          }}
          className="btn-icon"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span style={{ opacity: 0.6 }}>{currentPath}</span>
        </button>
      </div>

      {isObject && isOpen && (
        <div style={{ borderLeft: '1px solid var(--border-subtle)', marginLeft: 6 }}>
          {isArray
            ? value.map((item: any, index: number) => (
                <TreeNode
                  key={index}
                  name={`[${index}]`}
                  value={item}
                  currentPath={currentPath ? `${currentPath}[${index}]` : `[${index}]`}
                />
              ))
            : Object.entries(value).map(([k, v]) => (
                <TreeNode
                  key={k}
                  name={k}
                  value={v}
                  currentPath={currentPath ? (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? `${currentPath}.${k}` : `${currentPath}["${k}"]`) : k}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export const JsonPathExplorer: React.FC<JsonPathExplorerProps> = ({ data }) => {
  if (data === undefined) {
    return <div style={{ padding: 12, color: 'var(--text-tertiary)', fontSize: 12 }}>No JSON data to inspect.</div>;
  }

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
        Click any property to toggle nodes. Click the copy icon to copy its full JSON path.
      </div>
      <TreeNode name="response" value={data} currentPath="response" />
    </div>
  );
};
