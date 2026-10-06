export type GitFileStatus = 'M' | 'A' | 'D' | 'R' | '?' | '!';

export interface GitDiffLine {
  type: 'add' | 'delete' | 'context' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitHunk {
  id: string;
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
  staged: boolean;
}

export interface GitChange {
  id: string;
  filePath: string;
  oldPath?: string;
  status: GitFileStatus;
  staged: boolean;
  isBinary?: boolean;
  additions: number;
  deletions: number;
  diff?: string;
  hunks?: GitHunk[];
  conflictContent?: string;
  isResolved?: boolean;
  oldContent?: string;
  newContent?: string;
}

export interface GitCommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface GitCommitFileChange {
  filePath: string;
  status: GitFileStatus;
  additions: number;
  deletions: number;
  diff?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  subject: string;
  body?: string;
  author: GitCommitAuthor;
  committer?: GitCommitAuthor;
  parentHashes: string[];
  filesChanged: GitCommitFileChange[];
  tags?: string[];
  isMerge?: boolean;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commitHash: string;
  upstream?: string;
  ahead: number;
  behind: number;
}

export interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface GitStash {
  id: string;
  index: number;
  message: string;
  timestamp: string;
  branchName: string;
  commitHash: string;
  changes: GitChange[];
}

export interface GitTag {
  name: string;
  commitHash: string;
  message?: string;
  tagger?: string;
  date: string;
}

export interface GitConflictBlock {
  id: string;
  currentContent: string;
  incomingContent: string;
  currentBranch: string;
  incomingBranch: string;
  resolution?: 'current' | 'incoming' | 'both' | 'custom';
  customContent?: string;
}

export interface GitFileConflict {
  filePath: string;
  blocks: GitConflictBlock[];
  isResolved: boolean;
  resolvedContent?: string;
}

export interface GitRepository {
  id: string;
  name: string;
  path: string;
  projectId?: string;
  isDemo?: boolean;
  currentBranch: string;
  branches: GitBranch[];
  remotes: GitRemote[];
  commits: GitCommit[];
  changes: GitChange[];
  stashes: GitStash[];
  tags: GitTag[];
  conflicts: GitFileConflict[];
  isMerging?: boolean;
  mergingBranch?: string;
  headHash: string;
  gitIgnoreContent?: string;
  provider?: 'github' | 'gitlab' | 'bitbucket' | 'local';
  createdAt: string;
  updatedAt: string;
}

export interface GitSettings {
  defaultBranch: string;
  defaultDiffMode: 'unified' | 'split';
  confirmDestructive: boolean;
  authorName: string;
  authorEmail: string;
  autoFetchIntervalMinutes: number;
  githubToken?: string;
  gitlabToken?: string;
}
