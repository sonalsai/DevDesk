import type {
  GitRepository,
  GitCommit,
  GitCommitAuthor,
  GitStash,
  GitTag,
  GitRemote,
} from '../../types/git';
import { validateBranchName } from './branchValidation';
import { isPotentialSecretFile, maskCredentialsInUrl } from './securityService';
import { countUnresolvedConflicts, formatResolvedContent } from './conflictService';

function generateCommitHash(subject: string, authorDate: string): string {
  const chars = '0123456789abcdef';
  let seed = 0;
  const str = subject + authorDate + Math.random().toString();
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  let hash = '';
  for (let i = 0; i < 40; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    hash += chars[Math.abs(seed) % 16];
  }
  return hash;
}

export interface CommitValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates commit readiness (message, staged changes, unresolved conflicts).
 */
export function validateCommit(
  repo: GitRepository,
  message: string,
  isAmend = false
): CommitValidationResult {
  if (!message || !message.trim()) {
    return {
      isValid: false,
      error: 'Please enter a commit message before committing.',
    };
  }

  const stagedChanges = repo.changes.filter((c) => c.staged);
  if (stagedChanges.length === 0 && !isAmend) {
    return {
      isValid: false,
      error: 'Cannot commit: No changes are staged. Stage changes before committing.',
    };
  }

  // Check unresolved conflicts
  const unresolvedCount = countUnresolvedConflicts(repo.conflicts);
  if (unresolvedCount > 0) {
    return {
      isValid: false,
      error: `Cannot commit: ${unresolvedCount} file(s) contain unresolved merge conflicts. Resolve all conflicts before committing.`,
    };
  }

  // Check if any change has status '!'
  const hasConflictStatus = repo.changes.some((c) => c.status === '!');
  if (hasConflictStatus) {
    return {
      isValid: false,
      error: 'Cannot commit: Files still marked as conflicted in working tree.',
    };
  }

  return { isValid: true };
}

/**
 * Creates a commit and updates HEAD, branch pointer, and ahead count.
 */
export function commitChanges(
  repo: GitRepository,
  message: string,
  author: GitCommitAuthor,
  isAmend = false
): { repo: GitRepository; commit: GitCommit } {
  const lines = message.trim().split('\n');
  const subject = lines[0];
  const body = lines.slice(1).join('\n').trim() || undefined;

  const stagedChanges = repo.changes.filter((c) => c.staged);
  const filesChanged = stagedChanges.map((c) => ({
    filePath: c.filePath,
    status: c.status,
    additions: c.additions,
    deletions: c.deletions,
    diff: c.diff,
  }));

  const commitDate = new Date().toISOString();
  const commitHash = generateCommitHash(subject, commitDate);
  const shortHash = commitHash.slice(0, 7);

  const newCommit: GitCommit = {
    hash: commitHash,
    shortHash,
    subject,
    body,
    author: {
      name: author.name || 'Developer',
      email: author.email || 'developer@devdesk.local',
      date: commitDate,
    },
    parentHashes: isAmend
      ? (repo.commits[0]?.parentHashes || [])
      : [repo.headHash].filter(Boolean),
    filesChanged: isAmend && filesChanged.length === 0
      ? (repo.commits[0]?.filesChanged || [])
      : filesChanged,
    isMerge: repo.isMerging,
  };

  const updatedCommits = isAmend
    ? [newCommit, ...repo.commits.slice(1)]
    : [newCommit, ...repo.commits];

  // Remaining unstaged changes
  const remainingChanges = repo.changes.filter((c) => !c.staged);

  // Update current branch
  const updatedBranches = repo.branches.map((b) => {
    if (b.name === repo.currentBranch) {
      return {
        ...b,
        commitHash: commitHash,
        ahead: isAmend ? b.ahead : b.ahead + 1,
      };
    }
    return b;
  });

  const updatedRepo: GitRepository = {
    ...repo,
    commits: updatedCommits,
    changes: remainingChanges,
    headHash: commitHash,
    branches: updatedBranches,
    isMerging: false,
    mergingBranch: undefined,
    conflicts: repo.conflicts.filter((c) => !c.isResolved),
    updatedAt: commitDate,
  };

  return { repo: updatedRepo, commit: newCommit };
}

/**
 * Stages a single file by ID.
 */
export function stageFile(repo: GitRepository, changeId: string): GitRepository {
  return {
    ...repo,
    changes: repo.changes.map((c) => {
      if (c.id === changeId) {
        return {
          ...c,
          staged: true,
          hunks: c.hunks ? c.hunks.map((h) => ({ ...h, staged: true })) : undefined,
        };
      }
      return c;
    }),
  };
}

/**
 * Unstages a single file by ID.
 */
export function unstageFile(repo: GitRepository, changeId: string): GitRepository {
  return {
    ...repo,
    changes: repo.changes.map((c) => {
      if (c.id === changeId) {
        return {
          ...c,
          staged: false,
          hunks: c.hunks ? c.hunks.map((h) => ({ ...h, staged: false })) : undefined,
        };
      }
      return c;
    }),
  };
}

/**
 * Stages all unstaged changes.
 */
export function stageAll(repo: GitRepository): {
  repo: GitRepository;
  sensitiveWarnings: string[];
} {
  const sensitiveWarnings: string[] = [];
  const updatedChanges = repo.changes.map((c) => {
    const secretCheck = isPotentialSecretFile(c.filePath);
    if (secretCheck.isSecret && !c.staged) {
      sensitiveWarnings.push(c.filePath);
    }
    return {
      ...c,
      staged: true,
      hunks: c.hunks ? c.hunks.map((h) => ({ ...h, staged: true })) : undefined,
    };
  });

  return {
    repo: { ...repo, changes: updatedChanges },
    sensitiveWarnings,
  };
}

/**
 * Unstages all staged changes.
 */
export function unstageAll(repo: GitRepository): GitRepository {
  return {
    ...repo,
    changes: repo.changes.map((c) => ({
      ...c,
      staged: false,
      hunks: c.hunks ? c.hunks.map((h) => ({ ...h, staged: false })) : undefined,
    })),
  };
}

/**
 * Stages or unstages a specific hunk in a changed file.
 */
export function toggleHunkStage(
  repo: GitRepository,
  changeId: string,
  hunkId: string,
  shouldStage: boolean
): GitRepository {
  return {
    ...repo,
    changes: repo.changes.map((c) => {
      if (c.id !== changeId || !c.hunks) return c;

      const updatedHunks = c.hunks.map((h) => {
        if (h.id === hunkId) {
          return { ...h, staged: shouldStage };
        }
        return h;
      });

      const anyStaged = updatedHunks.some((h) => h.staged);

      return {
        ...c,
        hunks: updatedHunks,
        staged: anyStaged,
      };
    }),
  };
}

/**
 * Discards changes for a file (removes it from working tree).
 */
export function discardFileChanges(repo: GitRepository, changeId: string): GitRepository {
  return {
    ...repo,
    changes: repo.changes.filter((c) => c.id !== changeId),
  };
}

/**
 * Discards all unstaged changes.
 */
export function discardAllUnstaged(repo: GitRepository): GitRepository {
  return {
    ...repo,
    changes: repo.changes.filter((c) => c.staged),
  };
}

/**
 * Creates a new branch.
 */
export function createBranch(
  repo: GitRepository,
  name: string,
  basedOnCommit?: string
): { repo: GitRepository; error?: string } {
  const existingNames = repo.branches.map((b) => b.name);
  const validation = validateBranchName(name, existingNames);
  if (!validation.isValid) {
    return { repo, error: validation.error };
  }

  const targetHash = basedOnCommit || repo.headHash;

  const newBranch = {
    name: name.trim(),
    isCurrent: false,
    isRemote: false,
    commitHash: targetHash,
    ahead: 0,
    behind: 0,
  };

  return {
    repo: {
      ...repo,
      branches: [...repo.branches, newBranch],
    },
  };
}

/**
 * Switches to a different branch (checkout).
 */
export function switchBranch(
  repo: GitRepository,
  targetBranchName: string,
  force = false
): { repo: GitRepository; error?: string; requiresStashOrForce?: boolean } {
  const targetBranch = repo.branches.find((b) => b.name === targetBranchName);
  if (!targetBranch) {
    return { repo, error: `Branch "${targetBranchName}" does not exist.` };
  }

  if (targetBranch.name === repo.currentBranch) {
    return { repo };
  }

  // Detect uncommitted changes
  if (repo.changes.length > 0 && !force) {
    return {
      repo,
      error: `You have uncommitted changes in your working tree. Please stash or commit them before switching to "${targetBranchName}".`,
      requiresStashOrForce: true,
    };
  }

  const updatedBranches = repo.branches.map((b) => ({
    ...b,
    isCurrent: b.name === targetBranchName,
  }));

  return {
    repo: {
      ...repo,
      currentBranch: targetBranchName,
      headHash: targetBranch.commitHash,
      branches: updatedBranches,
    },
  };
}

/**
 * Renames a local branch.
 */
export function renameBranch(
  repo: GitRepository,
  oldName: string,
  newName: string
): { repo: GitRepository; error?: string } {
  if (oldName === newName) return { repo };

  const existing = repo.branches
    .filter((b) => b.name !== oldName)
    .map((b) => b.name);

  const validation = validateBranchName(newName, existing);
  if (!validation.isValid) {
    return { repo, error: validation.error };
  }

  const updatedBranches = repo.branches.map((b) => {
    if (b.name === oldName) {
      return { ...b, name: newName };
    }
    return b;
  });

  return {
    repo: {
      ...repo,
      currentBranch: repo.currentBranch === oldName ? newName : repo.currentBranch,
      branches: updatedBranches,
    },
  };
}

/**
 * Deletes a branch with safety checks.
 */
export function deleteBranch(
  repo: GitRepository,
  branchName: string
): { repo: GitRepository; error?: string } {
  if (branchName === repo.currentBranch) {
    return { repo, error: `Cannot delete the current active branch "${branchName}". Switch to another branch first.` };
  }

  const branchToDelete = repo.branches.find((b) => b.name === branchName);
  if (!branchToDelete) {
    return { repo, error: `Branch "${branchName}" not found.` };
  }

  return {
    repo: {
      ...repo,
      branches: repo.branches.filter((b) => b.name !== branchName),
    },
  };
}

/**
 * Merges a source branch into the current branch.
 */
export function mergeBranch(
  repo: GitRepository,
  sourceBranchName: string
): {
  repo: GitRepository;
  merged: boolean;
  hasConflicts: boolean;
  summary: string;
} {
  const source = repo.branches.find((b) => b.name === sourceBranchName);
  if (!source) {
    return {
      repo,
      merged: false,
      hasConflicts: false,
      summary: `Source branch "${sourceBranchName}" not found.`,
    };
  }

  if (source.name === repo.currentBranch) {
    return {
      repo,
      merged: false,
      hasConflicts: false,
      summary: `Cannot merge branch "${sourceBranchName}" into itself.`,
    };
  }

  // If already at same commit
  if (source.commitHash === repo.headHash) {
    return {
      repo,
      merged: true,
      hasConflicts: false,
      summary: `Already up to date. Branch "${repo.currentBranch}" has latest commits from "${sourceBranchName}".`,
    };
  }

  // Fast forward simulation
  const isFastForward = repo.commits.some((c) => c.hash === source.commitHash);

  if (isFastForward) {
    const updatedBranches = repo.branches.map((b) => {
      if (b.name === repo.currentBranch) {
        return { ...b, commitHash: source.commitHash, ahead: b.ahead + 1 };
      }
      return b;
    });

    return {
      repo: {
        ...repo,
        headHash: source.commitHash,
        branches: updatedBranches,
      },
      merged: true,
      hasConflicts: false,
      summary: `Fast-forward merged "${sourceBranchName}" into "${repo.currentBranch}".`,
    };
  }

  // 3-way merge: create merge commit or flag conflict
  const authorDate = new Date().toISOString();
  const commitHash = generateCommitHash(`Merge branch '${sourceBranchName}'`, authorDate);

  const mergeCommit: GitCommit = {
    hash: commitHash,
    shortHash: commitHash.slice(0, 7),
    subject: `Merge branch '${sourceBranchName}' into ${repo.currentBranch}`,
    author: {
      name: 'DevDesk Merge Engine',
      email: 'git@devdesk.local',
      date: authorDate,
    },
    parentHashes: [repo.headHash, source.commitHash],
    filesChanged: [],
    isMerge: true,
  };

  const updatedBranches = repo.branches.map((b) => {
    if (b.name === repo.currentBranch) {
      return { ...b, commitHash, ahead: b.ahead + 1 };
    }
    return b;
  });

  return {
    repo: {
      ...repo,
      commits: [mergeCommit, ...repo.commits],
      headHash: commitHash,
      branches: updatedBranches,
      isMerging: false,
      mergingBranch: undefined,
    },
    merged: true,
    hasConflicts: false,
    summary: `Merged branch "${sourceBranchName}" into "${repo.currentBranch}" (3-way merge).`,
  };
}

/**
 * Resolves a conflict in a file and marks it as resolved.
 */
export function resolveFileConflict(
  repo: GitRepository,
  filePath: string,
  resolvedContent?: string
): GitRepository {
  const updatedConflicts = repo.conflicts.map((c) => {
    if (c.filePath === filePath) {
      const finalContent =
        resolvedContent !== undefined
          ? resolvedContent
          : formatResolvedContent(c.blocks.map((b) => b.currentContent).join('\n'), c.blocks);
      return {
        ...c,
        isResolved: true,
        resolvedContent: finalContent,
      };
    }
    return c;
  });

  const updatedChanges = repo.changes.map((ch) => {
    if (ch.filePath === filePath) {
      return {
        ...ch,
        status: 'M' as const,
        isResolved: true,
      };
    }
    return ch;
  });

  return {
    ...repo,
    conflicts: updatedConflicts,
    changes: updatedChanges,
  };
}

/**
 * Creates a stash from uncommitted changes.
 */
export function createStash(repo: GitRepository, message = 'WIP on working tree'): {
  repo: GitRepository;
  stash?: GitStash;
} {
  if (repo.changes.length === 0) {
    return { repo };
  }

  const newIndex = repo.stashes.length;
  const newStash: GitStash = {
    id: `stash-${Date.now()}`,
    index: newIndex,
    message,
    timestamp: new Date().toISOString(),
    branchName: repo.currentBranch,
    commitHash: repo.headHash,
    changes: [...repo.changes],
  };

  return {
    repo: {
      ...repo,
      changes: [],
      stashes: [newStash, ...repo.stashes].map((s, idx) => ({ ...s, index: idx })),
    },
    stash: newStash,
  };
}

/**
 * Applies a stash into the working tree.
 */
export function applyStash(repo: GitRepository, stashId: string): { repo: GitRepository; error?: string } {
  const stash = repo.stashes.find((s) => s.id === stashId);
  if (!stash) {
    return { repo, error: 'Stash not found.' };
  }

  // Merge stash changes with current changes
  const existingPaths = new Set(repo.changes.map((c) => c.filePath));
  const newChanges = stash.changes.filter((c) => !existingPaths.has(c.filePath));

  return {
    repo: {
      ...repo,
      changes: [...repo.changes, ...newChanges],
    },
  };
}

/**
 * Pops a stash (applies then drops).
 */
export function popStash(repo: GitRepository, stashId: string): { repo: GitRepository; error?: string } {
  const res = applyStash(repo, stashId);
  if (res.error) return res;

  return {
    repo: dropStash(res.repo, stashId),
  };
}

/**
 * Drops a stash by ID.
 */
export function dropStash(repo: GitRepository, stashId: string): GitRepository {
  const remaining = repo.stashes.filter((s) => s.id !== stashId);
  return {
    ...repo,
    stashes: remaining.map((s, idx) => ({ ...s, index: idx })),
  };
}

/**
 * Creates a Git tag.
 */
export function createTag(
  repo: GitRepository,
  name: string,
  commitHash: string,
  message?: string,
  tagger?: string
): { repo: GitRepository; error?: string } {
  if (!name || !name.trim()) {
    return { repo, error: 'Tag name cannot be empty.' };
  }

  const trimmed = name.trim();
  if (repo.tags.some((t) => t.name === trimmed)) {
    return { repo, error: `Tag "${trimmed}" already exists.` };
  }

  const newTag: GitTag = {
    name: trimmed,
    commitHash,
    message,
    tagger: tagger || 'Developer',
    date: new Date().toISOString(),
  };

  return {
    repo: {
      ...repo,
      tags: [...repo.tags, newTag],
    },
  };
}

/**
 * Deletes a tag by name.
 */
export function deleteTag(repo: GitRepository, tagName: string): GitRepository {
  return {
    ...repo,
    tags: repo.tags.filter((t) => t.name !== tagName),
  };
}

/**
 * Adds a remote.
 */
export function addRemote(
  repo: GitRepository,
  name: string,
  fetchUrl: string,
  pushUrl?: string
): { repo: GitRepository; error?: string } {
  if (!name.trim()) return { repo, error: 'Remote name cannot be empty.' };
  if (!fetchUrl.trim()) return { repo, error: 'Remote URL cannot be empty.' };

  if (repo.remotes.some((r) => r.name.toLowerCase() === name.trim().toLowerCase())) {
    return { repo, error: `Remote "${name.trim()}" already exists.` };
  }

  const newRemote: GitRemote = {
    name: name.trim(),
    fetchUrl: fetchUrl.trim(),
    pushUrl: pushUrl?.trim() || fetchUrl.trim(),
  };

  return {
    repo: {
      ...repo,
      remotes: [...repo.remotes, newRemote],
    },
  };
}

/**
 * Edits an existing remote.
 */
export function editRemote(
  repo: GitRepository,
  oldName: string,
  newName: string,
  fetchUrl: string,
  pushUrl?: string
): { repo: GitRepository; error?: string } {
  const updatedRemotes = repo.remotes.map((r) => {
    if (r.name === oldName) {
      return {
        name: newName.trim(),
        fetchUrl: fetchUrl.trim(),
        pushUrl: (pushUrl || fetchUrl).trim(),
      };
    }
    return r;
  });

  return {
    repo: { ...repo, remotes: updatedRemotes },
  };
}

/**
 * Removes a remote by name.
 */
export function removeRemote(repo: GitRepository, name: string): GitRepository {
  return {
    ...repo,
    remotes: repo.remotes.filter((r) => r.name !== name),
  };
}

/**
 * Fetches remotes, tracking upstream branches.
 */
export function fetchRemote(
  repo: GitRepository,
  remoteName = 'origin'
): { repo: GitRepository; summary: string } {
  const remote = repo.remotes.find((r) => r.name === remoteName);
  const maskedUrl = remote ? maskCredentialsInUrl(remote.fetchUrl) : 'configured remote';

  return {
    repo,
    summary: `Fetched remote "${remoteName}" (${maskedUrl}). Branches are synchronized.`,
  };
}

/**
 * Pulls commits from upstream into current branch.
 */
export function pullRemote(
  repo: GitRepository,
  remoteName = 'origin'
): { repo: GitRepository; summary: string; error?: string } {
  if (repo.changes.length > 0) {
    return {
      repo,
      summary: '',
      error: 'Cannot pull: You have uncommitted local changes. Commit or stash before pulling.',
    };
  }

  const currentBranch = repo.branches.find((b) => b.name === repo.currentBranch);
  const behindCount = currentBranch?.behind || 0;

  const updatedBranches = repo.branches.map((b) => {
    if (b.name === repo.currentBranch) {
      return { ...b, behind: 0 };
    }
    return b;
  });

  return {
    repo: { ...repo, branches: updatedBranches },
    summary: behindCount > 0
      ? `Successfully pulled ${behindCount} commit(s) from "${remoteName}". Branch is up to date.`
      : `Already up to date with "${remoteName}".`,
  };
}

/**
 * Pushes commits from current branch to upstream remote.
 */
export function pushRemote(
  repo: GitRepository,
  remoteName = 'origin',
  authProvided = true
): { repo: GitRepository; summary: string; error?: string } {
  if (!authProvided) {
    return {
      repo,
      summary: '',
      error: 'Push failed: Authentication is required. Configure your personal access token in Remote Settings.',
    };
  }

  const currentBranch = repo.branches.find((b) => b.name === repo.currentBranch);
  const aheadCount = currentBranch?.ahead || 0;

  const updatedBranches = repo.branches.map((b) => {
    if (b.name === repo.currentBranch) {
      return { ...b, ahead: 0 };
    }
    return b;
  });

  return {
    repo: { ...repo, branches: updatedBranches },
    summary: aheadCount > 0
      ? `Push success: ${aheadCount} commit(s) pushed to "${remoteName}/${repo.currentBranch}".`
      : `Branch "${repo.currentBranch}" is already up to date on "${remoteName}".`,
  };
}
