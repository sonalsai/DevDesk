import type { GitRepository } from '../../types/git';
import { maskCredentialsInUrl } from './securityService';

export interface LocalDirectoryResult {
  success: boolean;
  repo?: GitRepository;
  error?: string;
  isSandboxRestricted?: boolean;
}

/**
 * Checks if the browser supports the File System Access API.
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Attempts to connect to a local directory via browser File System Access API.
 */
export async function openLocalDirectory(): Promise<LocalDirectoryResult> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      error: 'File System Access API is not supported in this browser. Please use Chrome, Edge, or an explicitly supported Chromium runtime.',
    };
  }

  try {
    // Prompt directory picker
    const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
    const dirName = dirHandle.name;

    // Check for .git directory
    let hasGit = false;
    try {
      await dirHandle.getDirectoryHandle('.git');
      hasGit = true;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      // Chromium often flags .git as a sensitive directory
      if (err.name === 'SecurityError' || err.message?.toLowerCase().includes('sensitive')) {
        return {
          success: false,
          isSandboxRestricted: true,
          error: `Browser Security Restriction: Chromium web browsers restrict direct read/write access to system ".git" directories for security reasons. DevDesk provides high-performance Virtual Git Repositories and File System Workspace linking for full offline Git workflows.`,
        };
      }
    }

    const repoId = `repo-local-${Date.now()}`;
    const detectedRepo: GitRepository = {
      id: repoId,
      name: dirName,
      path: `local:/${dirName}`,
      isDemo: false,
      currentBranch: 'main',
      headHash: '0000000000000000000000000000000000000000',
      branches: [
        {
          name: 'main',
          isCurrent: true,
          isRemote: false,
          commitHash: '0000000000000000000000000000000000000000',
          ahead: 0,
          behind: 0,
        },
      ],
      remotes: [],
      commits: [],
      changes: [],
      stashes: [],
      tags: [],
      conflicts: [],
      provider: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      repo: detectedRepo,
      error: hasGit ? undefined : 'No .git directory found. You can initialize this directory as a new Git repository.',
    };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    if (errorObj.name === 'AbortError') {
      return { success: false, error: 'Directory selection was cancelled.' };
    }
    return {
      success: false,
      error: errorObj.message || 'Failed to access local directory.',
    };
  }
}

/**
 * Parses Git remote URL to detect platform provider and links (GitHub, GitLab, Bitbucket).
 */
export function parseRemoteProvider(url: string): {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'other';
  webUrl?: string;
  compareUrl?: (base: string, head: string) => string;
  pullRequestUrl?: (branch: string) => string;
  commitUrl?: (sha: string) => string;
} {
  if (!url) return { provider: 'other' };

  const sanitized = maskCredentialsInUrl(url).trim();

  // GitHub detection: git@github.com:owner/repo.git or https://github.com/owner/repo.git
  let match = sanitized.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (match) {
    const owner = match[1];
    const repo = match[2];
    const base = `https://github.com/${owner}/${repo}`;
    return {
      provider: 'github',
      webUrl: base,
      compareUrl: (b, h) => `${base}/compare/${b}...${h}`,
      pullRequestUrl: (branch) => `${base}/pull/new/${branch}`,
      commitUrl: (sha) => `${base}/commit/${sha}`,
    };
  }

  // GitLab detection
  match = sanitized.match(/gitlab\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (match) {
    const owner = match[1];
    const repo = match[2];
    const base = `https://gitlab.com/${owner}/${repo}`;
    return {
      provider: 'gitlab',
      webUrl: base,
      compareUrl: (b, h) => `${base}/-/compare/${b}...${h}`,
      pullRequestUrl: (branch) => `${base}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${branch}`,
      commitUrl: (sha) => `${base}/-/commit/${sha}`,
    };
  }

  // Bitbucket detection
  match = sanitized.match(/bitbucket\.org[:/]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (match) {
    const owner = match[1];
    const repo = match[2];
    const base = `https://bitbucket.org/${owner}/${repo}`;
    return {
      provider: 'bitbucket',
      webUrl: base,
      compareUrl: (b, h) => `${base}/branches/compare/${h}..${b}`,
      pullRequestUrl: (branch) => `${base}/pull-requests/new?source=${branch}`,
      commitUrl: (sha) => `${base}/commits/${sha}`,
    };
  }

  return { provider: 'other', webUrl: sanitized.startsWith('http') ? sanitized : undefined };
}
