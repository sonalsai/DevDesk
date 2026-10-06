import type { GitConflictBlock, GitFileConflict } from '../../types/git';

const CONFLICT_START_REGEX = /^<{7}\s*(.*)$/m;
const CONFLICT_SPLIT_REGEX = /^={7}$/m;
const CONFLICT_END_REGEX = /^>{7}\s*(.*)$/m;

/**
 * Checks if a string contains Git conflict markers.
 */
export function hasConflictMarkers(content: string): boolean {
  if (!content) return false;
  return (
    CONFLICT_START_REGEX.test(content) &&
    CONFLICT_SPLIT_REGEX.test(content) &&
    CONFLICT_END_REGEX.test(content)
  );
}

/**
 * Parses raw text containing conflict markers into structured blocks.
 */
export function parseConflictBlocks(
  content: string,
  defaultCurrentBranch = 'HEAD',
  defaultIncomingBranch = 'incoming'
): GitConflictBlock[] {
  if (!content) return [];

  const lines = content.split('\n');
  const blocks: GitConflictBlock[] = [];

  let inBlock = false;
  let inIncoming = false;
  let currentBranchName = defaultCurrentBranch;
  let incomingBranchName = defaultIncomingBranch;
  let currentLines: string[] = [];
  let incomingLines: string[] = [];
  let blockCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      inBlock = true;
      inIncoming = false;
      const branchLabel = line.replace(/^<{7}\s*/, '').trim();
      currentBranchName = branchLabel || defaultCurrentBranch;
      currentLines = [];
      incomingLines = [];
    } else if (inBlock && line.startsWith('=======')) {
      inIncoming = true;
    } else if (inBlock && line.startsWith('>>>>>>>')) {
      const branchLabel = line.replace(/^>{7}\s*/, '').trim();
      incomingBranchName = branchLabel || defaultIncomingBranch;

      blocks.push({
        id: `conflict-block-${blockCounter++}`,
        currentContent: currentLines.join('\n'),
        incomingContent: incomingLines.join('\n'),
        currentBranch: currentBranchName,
        incomingBranch: incomingBranchName,
      });

      inBlock = false;
      inIncoming = false;
      currentLines = [];
      incomingLines = [];
    } else if (inBlock) {
      if (inIncoming) {
        incomingLines.push(line);
      } else {
        currentLines.push(line);
      }
    }
  }

  return blocks;
}

/**
 * Replaces conflict markers in content with the resolved block choices.
 */
export function formatResolvedContent(
  content: string,
  blocks: GitConflictBlock[]
): string {
  if (!content || blocks.length === 0) return content;

  let blockIdx = 0;
  const lines = content.split('\n');
  const result: string[] = [];

  let inConflict = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      continue;
    }

    if (inConflict && line.startsWith('>>>>>>>')) {
      inConflict = false;
      const block = blocks[blockIdx++];
      if (block) {
        if (block.resolution === 'current') {
          if (block.currentContent) result.push(block.currentContent);
        } else if (block.resolution === 'incoming') {
          if (block.incomingContent) result.push(block.incomingContent);
        } else if (block.resolution === 'both') {
          if (block.currentContent) result.push(block.currentContent);
          if (block.incomingContent) result.push(block.incomingContent);
        } else if (block.resolution === 'custom' && block.customContent !== undefined) {
          if (block.customContent) result.push(block.customContent);
        } else {
          // If unresolved, retain current content by default or custom
          if (block.currentContent) result.push(block.currentContent);
        }
      }
      continue;
    }

    if (inConflict) {
      // Skip inner lines between <<<<<<< and >>>>>>> because the resolved block content replaces them
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Counts total unresolved conflicts across all files in repository.
 */
export function countUnresolvedConflicts(conflicts: GitFileConflict[]): number {
  if (!conflicts || conflicts.length === 0) return 0;
  return conflicts.filter((c) => !c.isResolved).length;
}
