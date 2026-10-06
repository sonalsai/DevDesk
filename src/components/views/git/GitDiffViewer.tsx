import React, { useState, useMemo } from 'react';
import type { GitChange, GitHunk } from '../../../types/git';
import { isBinaryFile, buildSplitDiffRows } from '../../../services/git/diffService';
import {
  Columns2,
  Rows,
  Copy,
  Download,
  Search,
  Plus,
  Minus,
  FileCode,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks';

interface GitDiffViewerProps {
  change: GitChange;
  defaultMode?: 'unified' | 'split';
  onToggleHunk?: (hunkId: string, shouldStage: boolean) => void;
  readOnly?: boolean;
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({
  change,
  defaultMode = 'unified',
  onToggleHunk,
  readOnly = false,
}) => {
  const { showToast } = useToast();
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>(defaultMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const isBinary = useMemo(
    () => change.isBinary || isBinaryFile(change.filePath, change.diff),
    [change.filePath, change.diff, change.isBinary]
  );

  const hunks: GitHunk[] = useMemo(() => {
    return change.hunks || [];
  }, [change.hunks]);

  const handleCopyDiff = () => {
    if (!change.diff) {
      showToast('No diff content to copy', 'info', 1500);
      return;
    }
    navigator.clipboard.writeText(change.diff);
    setCopied(true);
    showToast('Diff copied to clipboard', 'success', 1500);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDiff = () => {
    if (!change.diff) {
      showToast('No diff content to download', 'info', 1500);
      return;
    }
    const blob = new Blob([change.diff], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = change.filePath.replace(/[\\/]/g, '_');
    a.href = url;
    a.download = `${safeName}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded patch file', 'success', 1500);
  };

  if (isBinary) {
    return (
      <div className="git-diff-container">
        <div className="git-diff-header">
          <div className="git-diff-title">
            <FileCode size={15} />
            <span>{change.filePath}</span>
          </div>
        </div>
        <div className="git-binary-placeholder">
          <AlertCircle size={28} style={{ color: 'var(--text-muted)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              Binary file changed
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Cannot display visual text diff for binary files.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-diff-container">
      {/* Diff Toolbar */}
      <div className="git-diff-header">
        <div className="git-diff-title">
          <FileCode size={15} style={{ color: 'var(--accent)' }} />
          <span className="git-diff-filepath">{change.filePath}</span>
          <span className="git-diff-stats">
            <span style={{ color: 'var(--success)' }}>+{change.additions}</span>
            <span style={{ color: 'var(--danger)', marginLeft: 6 }}>-{change.deletions}</span>
          </span>
        </div>

        <div className="git-diff-actions">
          {/* Search in diff */}
          <div className="git-diff-search">
            <Search size={12} className="git-diff-search-icon" />
            <input
              type="text"
              placeholder="Search diff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="git-diff-search-input"
            />
          </div>

          {/* Mode switch */}
          <div className="btn-group">
            <button
              className={`btn btn-xs ${diffMode === 'unified' ? 'btn-secondary active' : 'btn-subtle'}`}
              onClick={() => setDiffMode('unified')}
              title="Unified diff mode"
            >
              <Rows size={12} />
              <span>Unified</span>
            </button>
            <button
              className={`btn btn-xs ${diffMode === 'split' ? 'btn-secondary active' : 'btn-subtle'}`}
              onClick={() => setDiffMode('split')}
              title="Split side-by-side mode"
            >
              <Columns2 size={12} />
              <span>Split</span>
            </button>
          </div>

          {/* Copy & Download */}
          <button
            className="btn btn-subtle btn-xs btn-icon"
            onClick={handleCopyDiff}
            title="Copy diff to clipboard"
          >
            {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
          </button>
          <button
            className="btn btn-subtle btn-xs btn-icon"
            onClick={handleDownloadDiff}
            title="Download .patch file"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Diff Body */}
      <div className="git-diff-body">
        {hunks.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No visual line changes found in this file.
          </div>
        ) : (
          hunks.map((hunk) => {
            const isHunkStaged = hunk.staged;
            const splitRows = diffMode === 'split' ? buildSplitDiffRows(hunk) : [];

            return (
              <div key={hunk.id} className="git-hunk-block">
                {/* Hunk Header Bar */}
                <div className="git-hunk-header">
                  <span className="git-hunk-range">{hunk.header}</span>

                  {!readOnly && onToggleHunk && (
                    <button
                      className={`btn btn-xs ${isHunkStaged ? 'btn-secondary' : 'btn-subtle'}`}
                      onClick={() => onToggleHunk(hunk.id, !isHunkStaged)}
                      title={isHunkStaged ? 'Unstage this hunk' : 'Stage this hunk'}
                      style={{ fontSize: 11, padding: '2px 8px', height: 22 }}
                    >
                      {isHunkStaged ? (
                        <>
                          <Minus size={11} />
                          <span>Unstage Hunk</span>
                        </>
                      ) : (
                        <>
                          <Plus size={11} />
                          <span>Stage Hunk</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Hunk Lines: Unified vs Split */}
                {diffMode === 'unified' ? (
                  <div className="git-diff-lines-unified">
                    {hunk.lines.map((line, lIdx) => {
                      const isMatch =
                        searchQuery &&
                        line.content.toLowerCase().includes(searchQuery.toLowerCase());

                      return (
                        <div
                          key={`u-${lIdx}`}
                          className={`git-diff-line git-diff-line-${line.type} ${isMatch ? 'git-diff-match' : ''}`}
                        >
                          <span className="git-diff-gutter git-gutter-old">
                            {line.oldLineNumber ?? ''}
                          </span>
                          <span className="git-diff-gutter git-gutter-new">
                            {line.newLineNumber ?? ''}
                          </span>
                          <span className="git-diff-marker">
                            {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                          </span>
                          <span className="git-diff-content">{line.content}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="git-diff-lines-split">
                    {splitRows.map((row, rIdx) => {
                      const leftMatch =
                        searchQuery &&
                        row.left?.content.toLowerCase().includes(searchQuery.toLowerCase());
                      const rightMatch =
                        searchQuery &&
                        row.right?.content.toLowerCase().includes(searchQuery.toLowerCase());

                      return (
                        <div key={`s-${rIdx}`} className="git-split-row">
                          {/* Left Column (Old) */}
                          <div
                            className={`git-split-col git-split-left git-diff-line-${row.left?.type || 'empty'} ${leftMatch ? 'git-diff-match' : ''}`}
                          >
                            <span className="git-diff-gutter">
                              {row.left?.oldLineNumber ?? ''}
                            </span>
                            <span className="git-diff-marker">
                              {row.left ? (row.left.type === 'delete' ? '-' : ' ') : ''}
                            </span>
                            <span className="git-diff-content">
                              {row.left?.content ?? ''}
                            </span>
                          </div>

                          {/* Right Column (New) */}
                          <div
                            className={`git-split-col git-split-right git-diff-line-${row.right?.type || 'empty'} ${rightMatch ? 'git-diff-match' : ''}`}
                          >
                            <span className="git-diff-gutter">
                              {row.right?.newLineNumber ?? ''}
                            </span>
                            <span className="git-diff-marker">
                              {row.right ? (row.right.type === 'add' ? '+' : ' ') : ''}
                            </span>
                            <span className="git-diff-content">
                              {row.right?.content ?? ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
