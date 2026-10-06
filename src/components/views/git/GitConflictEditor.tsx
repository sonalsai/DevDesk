import React, { useState } from 'react';
import type { GitFileConflict, GitConflictBlock } from '../../../types/git';
import { formatResolvedContent } from '../../../services/git/conflictService';
import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowDown,
  ArrowUp,
  Layers,
  Edit3,
} from 'lucide-react';
import { useToast } from '@/hooks';

interface GitConflictEditorProps {
  conflict: GitFileConflict;
  onResolve: (resolvedContent: string) => void;
}

export const GitConflictEditor: React.FC<GitConflictEditorProps> = ({
  conflict,
  onResolve,
}) => {
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState<GitConflictBlock[]>(conflict.blocks);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>('');

  const unresolvedCount = blocks.filter((b) => !b.resolution).length;

  const handleSetResolution = (
    blockId: string,
    res: 'current' | 'incoming' | 'both'
  ) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return { ...b, resolution: res, customContent: undefined };
        }
        return b;
      })
    );
    showToast(`Applied: Accept ${res === 'current' ? 'Current' : res === 'incoming' ? 'Incoming' : 'Both'}`, 'info', 1200);
  };

  const handleStartCustomEdit = (block: GitConflictBlock) => {
    setEditingBlockId(block.id);
    setCustomText(block.customContent ?? block.currentContent);
  };

  const handleSaveCustomEdit = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          return { ...b, resolution: 'custom', customContent: customText };
        }
        return b;
      })
    );
    setEditingBlockId(null);
    showToast('Saved custom resolution', 'success', 1200);
  };

  const handleMarkResolved = () => {
    if (unresolvedCount > 0) {
      showToast(`Please choose a resolution for all ${unresolvedCount} conflict block(s)`, 'error', 2500);
      return;
    }
    const resolved = formatResolvedContent(
      blocks.map((b) => b.currentContent).join('\n'),
      blocks
    );
    onResolve(resolved);
    showToast(`Conflict in ${conflict.filePath} marked as resolved!`, 'success', 2000);
  };

  return (
    <div className="git-conflict-editor">
      <div className="git-conflict-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>
              Resolve Conflict: <span style={{ color: 'var(--accent)' }}>{conflict.filePath}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {unresolvedCount > 0 ? (
                <span style={{ color: 'var(--warning)' }}>
                  {unresolvedCount} unresolved conflict block{unresolvedCount > 1 ? 's' : ''} remaining
                </span>
              ) : (
                <span style={{ color: 'var(--success)' }}>
                  All conflict blocks resolved. Ready to mark as resolved.
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={handleMarkResolved}
          disabled={unresolvedCount > 0}
        >
          <CheckCircle2 size={13} />
          <span>Mark as Resolved</span>
        </button>
      </div>

      <div className="git-conflict-blocks">
        {blocks.map((block, idx) => {
          const isResolved = Boolean(block.resolution);

          return (
            <div
              key={block.id}
              className={`git-conflict-card ${isResolved ? 'resolved' : 'unresolved'}`}
            >
              <div className="git-conflict-card-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                  <GitMerge size={13} />
                  <span>Conflict #{idx + 1}</span>
                </span>

                <div className="btn-group">
                  <button
                    className={`btn btn-xs ${block.resolution === 'current' ? 'btn-secondary active' : 'btn-subtle'}`}
                    onClick={() => handleSetResolution(block.id, 'current')}
                    title="Accept Current Change (HEAD)"
                  >
                    <ArrowUp size={11} />
                    <span>Accept Current</span>
                  </button>
                  <button
                    className={`btn btn-xs ${block.resolution === 'incoming' ? 'btn-secondary active' : 'btn-subtle'}`}
                    onClick={() => handleSetResolution(block.id, 'incoming')}
                    title="Accept Incoming Change"
                  >
                    <ArrowDown size={11} />
                    <span>Accept Incoming</span>
                  </button>
                  <button
                    className={`btn btn-xs ${block.resolution === 'both' ? 'btn-secondary active' : 'btn-subtle'}`}
                    onClick={() => handleSetResolution(block.id, 'both')}
                    title="Accept Both Changes"
                  >
                    <Layers size={11} />
                    <span>Accept Both</span>
                  </button>
                  <button
                    className={`btn btn-xs ${block.resolution === 'custom' ? 'btn-secondary active' : 'btn-subtle'}`}
                    onClick={() => handleStartCustomEdit(block)}
                    title="Edit Manually"
                  >
                    <Edit3 size={11} />
                    <span>Manual</span>
                  </button>
                </div>
              </div>

              {/* Conflict Body */}
              {editingBlockId === block.id ? (
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Manual Resolution Editor:
                  </div>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 110,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => setEditingBlockId(null)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary btn-xs" onClick={() => handleSaveCustomEdit(block.id)}>
                      Save Manual Text
                    </button>
                  </div>
                </div>
              ) : (
                <div className="git-conflict-diff-preview">
                  {/* Current Side */}
                  <div
                    className={`git-conflict-side current ${block.resolution === 'current' || block.resolution === 'both' ? 'selected' : ''}`}
                  >
                    <div className="git-conflict-side-badge">
                      <span>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD ({block.currentBranch})</span>
                      {block.resolution === 'current' && <span className="git-chosen-tag">Chosen</span>}
                    </div>
                    <pre className="git-conflict-code">{block.currentContent || '(empty)'}</pre>
                  </div>

                  <div className="git-conflict-divider">=======</div>

                  {/* Incoming Side */}
                  <div
                    className={`git-conflict-side incoming ${block.resolution === 'incoming' || block.resolution === 'both' ? 'selected' : ''}`}
                  >
                    <div className="git-conflict-side-badge">
                      <span>&gt;&gt;&gt;&gt;&gt;&gt;&gt; {block.incomingBranch}</span>
                      {block.resolution === 'incoming' && <span className="git-chosen-tag">Chosen</span>}
                    </div>
                    <pre className="git-conflict-code">{block.incomingContent || '(empty)'}</pre>
                  </div>

                  {block.resolution === 'custom' && (
                    <div className="git-conflict-custom-preview">
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                        Custom Manual Result:
                      </div>
                      <pre className="git-conflict-code">{block.customContent}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
