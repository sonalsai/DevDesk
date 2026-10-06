import type { GitHunk, GitDiffLine } from '../../types/git';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'svgz',
  'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
  'exe', 'dll', 'so', 'dylib', 'bin', 'iso', 'wasm',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm', 'avi',
  'jar', 'war', 'class', 'pyc',
]);

/**
 * Checks whether a file path or extension indicates a binary file.
 */
export function isBinaryFile(filePath: string, content?: string): boolean {
  if (!filePath) return false;
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext && BINARY_EXTENSIONS.has(ext)) {
    return true;
  }
  if (content && typeof content === 'string') {
    // Check for null characters or excessive non-printable characters in content
    const sample = content.slice(0, 1024);
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code === 0) return true;
    }
  }
  return false;
}

/**
 * Computes standard Myers / LCS line-by-line diff between two strings.
 */
export function computeLineDiff(oldText: string, newText: string): {
  unifiedDiff: string;
  hunks: GitHunk[];
  additions: number;
  deletions: number;
} {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  // If identical
  if (oldText === newText) {
    return {
      unifiedDiff: '',
      hunks: [],
      additions: 0,
      deletions: 0,
    };
  }

  // Simple LCS line diff
  const matrix: number[][] = [];
  const m = oldLines.length;
  const n = newLines.length;

  for (let i = 0; i <= m; i++) {
    matrix[i] = new Array(n + 1).fill(0);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff operations
  interface DiffOp {
    type: 'add' | 'delete' | 'context';
    text: string;
    oldLine?: number;
    newLine?: number;
  }

  const ops: DiffOp[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({
        type: 'context',
        text: oldLines[i - 1],
        oldLine: i,
        newLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      ops.unshift({
        type: 'add',
        text: newLines[j - 1],
        newLine: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      ops.unshift({
        type: 'delete',
        text: oldLines[i - 1],
        oldLine: i,
      });
      i--;
    }
  }

  // Group into hunks with context (3 context lines before and after changes)
  const CONTEXT_SIZE = 3;
  const hunks: GitHunk[] = [];
  let additions = 0;
  let deletions = 0;

  let currentHunkLines: GitDiffLine[] = [];
  let hunkOldStart = 1;
  let hunkNewStart = 1;
  let inHunk = false;
  let postContextRemaining = 0;

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];

    if (op.type === 'add' || op.type === 'delete') {
      if (op.type === 'add') additions++;
      if (op.type === 'delete') deletions++;

      if (!inHunk) {
        inHunk = true;
        currentHunkLines = [];
        // Gather pre-context lines
        const preStart = Math.max(0, k - CONTEXT_SIZE);
        for (let p = preStart; p < k; p++) {
          const preOp = ops[p];
          if (preOp.type === 'context') {
            currentHunkLines.push({
              type: 'context',
              content: preOp.text,
              oldLineNumber: preOp.oldLine,
              newLineNumber: preOp.newLine,
            });
          }
        }
        hunkOldStart = currentHunkLines.length > 0 && currentHunkLines[0].oldLineNumber
          ? currentHunkLines[0].oldLineNumber
          : (op.oldLine || 1);
        hunkNewStart = currentHunkLines.length > 0 && currentHunkLines[0].newLineNumber
          ? currentHunkLines[0].newLineNumber
          : (op.newLine || 1);
      }

      currentHunkLines.push({
        type: op.type,
        content: op.text,
        oldLineNumber: op.oldLine,
        newLineNumber: op.newLine,
      });
      postContextRemaining = CONTEXT_SIZE;
    } else if (inHunk) {
      if (postContextRemaining > 0) {
        currentHunkLines.push({
          type: 'context',
          content: op.text,
          oldLineNumber: op.oldLine,
          newLineNumber: op.newLine,
        });
        postContextRemaining--;

        // Check if next item is change; if so, keep hunk open
        let nextChangeWithinContext = false;
        for (let peek = 1; peek <= CONTEXT_SIZE && k + peek < ops.length; peek++) {
          if (ops[k + peek].type !== 'context') {
            nextChangeWithinContext = true;
            break;
          }
        }

        if (postContextRemaining === 0 && !nextChangeWithinContext) {
          // Close hunk
          const oldLinesCount = currentHunkLines.filter((l) => l.type === 'context' || l.type === 'delete').length;
          const newLinesCount = currentHunkLines.filter((l) => l.type === 'context' || l.type === 'add').length;
          const header = `@@ -${hunkOldStart},${oldLinesCount} +${hunkNewStart},${newLinesCount} @@`;

          hunks.push({
            id: `hunk-${hunks.length + 1}`,
            header,
            oldStart: hunkOldStart,
            oldLines: oldLinesCount,
            newStart: hunkNewStart,
            newLines: newLinesCount,
            lines: [...currentHunkLines],
            staged: false,
          });
          inHunk = false;
          currentHunkLines = [];
        }
      }
    }
  }

  // Final open hunk
  if (inHunk && currentHunkLines.length > 0) {
    const oldLinesCount = currentHunkLines.filter((l) => l.type === 'context' || l.type === 'delete').length;
    const newLinesCount = currentHunkLines.filter((l) => l.type === 'context' || l.type === 'add').length;
    const header = `@@ -${hunkOldStart},${oldLinesCount} +${hunkNewStart},${newLinesCount} @@`;

    hunks.push({
      id: `hunk-${hunks.length + 1}`,
      header,
      oldStart: hunkOldStart,
      oldLines: oldLinesCount,
      newStart: hunkNewStart,
      newLines: newLinesCount,
      lines: [...currentHunkLines],
      staged: false,
    });
  }

  // Format unified diff string
  const diffLines: string[] = [];
  for (const hunk of hunks) {
    diffLines.push(hunk.header);
    for (const line of hunk.lines) {
      if (line.type === 'add') {
        diffLines.push(`+${line.content}`);
      } else if (line.type === 'delete') {
        diffLines.push(`-${line.content}`);
      } else {
        diffLines.push(` ${line.content}`);
      }
    }
  }

  return {
    unifiedDiff: diffLines.join('\n'),
    hunks,
    additions,
    deletions,
  };
}

/**
 * Parses a standard unified diff string into hunks.
 */
export function parseUnifiedDiff(diffText: string): GitHunk[] {
  if (!diffText) return [];

  const rawLines = diffText.split('\n');
  const hunks: GitHunk[] = [];
  let currentHunk: GitHunk | null = null;
  let hunkId = 1;

  let currentOldLine = 1;
  let currentNewLine = 1;

  for (const line of rawLines) {
    // Check for hunk header @@ -a,b +c,d @@
    const match = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
    if (match) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      const oldStart = parseInt(match[1], 10);
      const oldLines = match[2] !== undefined ? parseInt(match[2], 10) : 1;
      const newStart = parseInt(match[3], 10);
      const newLines = match[4] !== undefined ? parseInt(match[4], 10) : 1;

      currentOldLine = oldStart;
      currentNewLine = newStart;

      currentHunk = {
        id: `hunk-${hunkId++}`,
        header: line,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
        staged: false,
      };
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'add',
        content: line.slice(1),
        newLineNumber: currentNewLine++,
      });
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'delete',
        content: line.slice(1),
        oldLineNumber: currentOldLine++,
      });
    } else if (line.startsWith(' ') || line === '') {
      currentHunk.lines.push({
        type: 'context',
        content: line.startsWith(' ') ? line.slice(1) : '',
        oldLineNumber: currentOldLine++,
        newLineNumber: currentNewLine++,
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export interface SplitDiffRow {
  left?: GitDiffLine;
  right?: GitDiffLine;
}

/**
 * Builds side-by-side rows from hunks for split diff view.
 */
export function buildSplitDiffRows(hunk: GitHunk): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  const lines = hunk.lines;
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];

    if (line.type === 'context') {
      rows.push({
        left: line,
        right: line,
      });
      idx++;
    } else if (line.type === 'delete') {
      // Look ahead to see if there is a corresponding add
      const deletes: GitDiffLine[] = [];
      while (idx < lines.length && lines[idx].type === 'delete') {
        deletes.push(lines[idx]);
        idx++;
      }
      const adds: GitDiffLine[] = [];
      while (idx < lines.length && lines[idx].type === 'add') {
        adds.push(lines[idx]);
        idx++;
      }

      const maxLen = Math.max(deletes.length, adds.length);
      for (let k = 0; k < maxLen; k++) {
        rows.push({
          left: deletes[k] || undefined,
          right: adds[k] || undefined,
        });
      }
    } else if (line.type === 'add') {
      rows.push({
        left: undefined,
        right: line,
      });
      idx++;
    } else {
      idx++;
    }
  }

  return rows;
}
