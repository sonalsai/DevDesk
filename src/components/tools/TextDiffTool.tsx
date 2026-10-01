import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { GitCompare, Plus, Minus, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  originalLineNum?: number;
  modifiedLineNum?: number;
}

// Longest Common Subsequence line diff calculation
function computeLineDiff(originalText: string, modifiedText: string): {
  lines: DiffLine[];
  stats: { added: number; removed: number; unchanged: number };
} {
  const origLines = originalText.split('\n');
  const modLines = modifiedText.split('\n');

  const m = origLines.length;
  const n = modLines.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff lines
  let i = m;
  let j = n;
  const reversedDiff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      reversedDiff.push({
        type: 'unchanged',
        text: origLines[i - 1],
        originalLineNum: i,
        modifiedLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversedDiff.push({
        type: 'added',
        text: modLines[j - 1],
        modifiedLineNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      reversedDiff.push({
        type: 'removed',
        text: origLines[i - 1],
        originalLineNum: i,
      });
      i--;
    }
  }

  const lines = reversedDiff.reverse();

  let added = 0;
  let removed = 0;
  let unchanged = 0;
  lines.forEach((l) => {
    if (l.type === 'added') added++;
    else if (l.type === 'removed') removed++;
    else unchanged++;
  });

  return { lines, stats: { added, removed, unchanged } };
}

export const TextDiffTool: React.FC = () => {
  const { showToast } = useToast();
  const [original, setOriginal] = useState<string>(`function calculateTax(amount, country) {
  if (country === 'US') {
    return amount * 0.08;
  }
  return amount * 0.05;
}`);

  const [modified, setModified] = useState<string>(`function calculateTax(amount, country, isExempt = false) {
  if (isExempt) {
    return 0;
  }
  if (country === 'US') {
    return amount * 0.0825;
  }
  if (country === 'EU') {
    return amount * 0.20;
  }
  return amount * 0.05;
}`);

  const [viewMode, setViewMode] = useState<'split' | 'diff'>('diff');

  const { lines, stats } = useMemo(() => {
    return computeLineDiff(original, modified);
  }, [original, modified]);

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
    showToast('Swapped original and modified text', 'info', 1500);
  };

  return (
    <ToolLayout
      toolId="text-diff"
      title="Text Diff"
      description="Compare two code or text documents and inspect additions, removals, and changes line-by-line."
      icon={GitCompare}
      actions={
        <>
          <div className="toolbar-group">
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${viewMode === 'diff' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setViewMode('diff')}
              >
                Diff Result
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 0 }}
                onClick={() => setViewMode('split')}
              >
                Side-by-Side Editors
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleSwap}>
              <ArrowRightLeft size={13} />
              <span>Swap</span>
            </button>
          </div>

          <div className="toolbar-group" style={{ fontSize: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--success)',
                fontWeight: 600,
              }}
            >
              <Plus size={14} /> {stats.added} added
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--danger)',
                fontWeight: 600,
              }}
            >
              <Minus size={14} /> {stats.removed} removed
            </span>
            <span style={{ color: 'var(--text-muted)' }}>• {stats.unchanged} unchanged</span>
          </div>
        </>
      }
    >
      {viewMode === 'split' ? (
        <div className="tool-split-container">
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span>Original Text (Before)</span>
              <button className="btn btn-subtle btn-sm" onClick={() => setOriginal('')}>
                Clear
              </button>
            </div>
            <textarea
              className="tool-editor-area"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste original text..."
              spellCheck={false}
            />
          </div>

          <div className="tool-panel">
            <div className="tool-panel-header">
              <span>Modified Text (After)</span>
              <button className="btn btn-subtle btn-sm" onClick={() => setModified('')}>
                Clear
              </button>
            </div>
            <textarea
              className="tool-editor-area"
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste modified text..."
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick inputs collapsible */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              maxHeight: '160px',
            }}
          >
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ fontSize: 11 }}>Original</span>
              </div>
              <textarea
                className="tool-editor-area"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                style={{ height: '90px', minHeight: '90px' }}
                spellCheck={false}
              />
            </div>
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ fontSize: 11 }}>Modified</span>
              </div>
              <textarea
                className="tool-editor-area"
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                style={{ height: '90px', minHeight: '90px' }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Diff Result View */}
          <div className="tool-panel" style={{ minHeight: '360px', flex: 1 }}>
            <div className="tool-panel-header">
              <span>Unified Diff Inspection</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {lines.length} total lines
              </span>
            </div>

            <div
              style={{
                padding: '8px 0',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: 'var(--bg-code)',
              }}
            >
              {lines.map((line, idx) => (
                <div key={idx} className={`diff-line ${line.type}`}>
                  <span className="diff-line-number">
                    {line.originalLineNum || ''}
                  </span>
                  <span className="diff-line-number">
                    {line.modifiedLineNum || ''}
                  </span>
                  <span
                    style={{
                      width: 20,
                      userSelect: 'none',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span style={{ whiteSpace: 'pre', flex: 1 }}>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
