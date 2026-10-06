import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useWorkspace } from '@/hooks';
import type {
  GitChange,
  GitRepository,
} from '../../../types/git';
import { GitDiffViewer } from './GitDiffViewer';
import { GitConflictEditor } from './GitConflictEditor';
import { GitDiscardModal } from './GitDiscardModal';
import { GitSensitiveWarningModal } from './GitSensitiveWarningModal';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { openLocalDirectory, parseRemoteProvider } from '../../../services/git/fileSystemAdapter';
import { GITIGNORE_PRESETS, generateGitignoreContent } from '../../../services/git/gitignorePresets';
import { createDemoRepository } from '../../../services/git/demoRepository';
import { maskCredentialsInUrl } from '../../../services/git/securityService';
import { formatDate } from '../../../utils/date';
import {
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitPullRequest,
  GitMerge,
  History,
  FileCode,
  Plus,
  Trash2,
  Edit2,
  Folder,
  Tag,
  Archive,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Shield,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  FolderGit2,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/hooks';
import './git.css';

type GitTab =
  | 'overview'
  | 'changes'
  | 'history'
  | 'branches'
  | 'merge'
  | 'stash'
  | 'tags'
  | 'remotes'
  | 'gitignore'
  | 'settings';

export const GitWorkspaceView: React.FC = () => {
  const {
    data,
    gitRepositories,
    activeGitRepo,
    setActiveGitRepoId,
    addGitRepository,
    deleteGitRepository,
    stageGitFile,
    unstageGitFile,
    stageAllGitFiles,
    unstageAllGitFiles,
    toggleGitHunkStage,
    discardGitFileChanges,
    discardAllGitChanges,
    commitGitChanges,
    createGitBranch,
    switchGitBranch,
    renameGitBranch,
    deleteGitBranch,
    mergeGitBranch,
    resolveGitConflict,
    createGitStash,
    applyGitStash,
    popGitStash,
    dropGitStash,
    createGitTag,
    deleteGitTag,
    addGitRemote,
    editGitRemote,
    removeGitRemote,
    fetchGitRemote,
    pullGitRemote,
    pushGitRemote,
    linkProjectToGitRepo,
    gitSettings,
    updateGitSettings,
    setActiveView,
  } = useWorkspace();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<GitTab>('changes');

  // Currently selected change in Changes tab
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  // Commit form inputs
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isAmend, setIsAmend] = useState<boolean>(false);
  const commitInputRef = useRef<HTMLInputElement>(null);

  // History filtering & selected commit
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyAuthorFilter, setHistoryAuthorFilter] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);

  // Modals state
  const [discardModalFiles, setDiscardModalFiles] = useState<string[] | null>(null);
  const [discardChangeId, setDiscardChangeId] = useState<string | null>(null);

  const [sensitiveModalFiles, setSensitiveModalFiles] = useState<string[] | null>(null);

  // Branch create/rename/delete
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState<boolean>(false);
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchBasedOn, setNewBranchBasedOn] = useState<string>('');

  const [renameBranchOld, setRenameBranchOld] = useState<string | null>(null);
  const [renameBranchNew, setRenameBranchNew] = useState<string>('');

  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

  // Branch compare
  const [compareSourceBranch, setCompareSourceBranch] = useState<string>('');
  const [compareTargetBranch, setCompareTargetBranch] = useState<string>('');

  // Merge modal
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergeSourceBranch, setMergeSourceBranch] = useState<string>('');

  // Stash create modal
  const [isCreateStashOpen, setIsCreateStashOpen] = useState<boolean>(false);
  const [stashMessage, setStashMessage] = useState<string>('');
  const [stashToDrop, setStashToDrop] = useState<string | null>(null);
  const [viewingStashDiff, setViewingStashDiff] = useState<string | null>(null);

  // Tag modal
  const [isCreateTagOpen, setIsCreateTagOpen] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagMessage, setNewTagMessage] = useState<string>('');
  const [newTagCommit, setNewTagCommit] = useState<string>('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Remote modals
  const [isAddRemoteOpen, setIsAddRemoteOpen] = useState<boolean>(false);
  const [remoteNameInput, setRemoteNameInput] = useState<string>('');
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>('');
  const [editingRemoteName, setEditingRemoteName] = useState<string | null>(null);
  const [remoteToDelete, setRemoteToDelete] = useState<string | null>(null);

  // New Repository modal
  const [isNewRepoModalOpen, setIsNewRepoModalOpen] = useState<boolean>(false);
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [newRepoPath, setNewRepoPath] = useState<string>('');
  const [newRepoProjectId, setNewRepoProjectId] = useState<string>('');

  // .gitignore helper
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['node', 'react-vite', 'env-files']);
  const [customIgnoreRule, setCustomIgnoreRule] = useState<string>('');
  const [customIgnoreList, setCustomIgnoreList] = useState<string[]>([]);

  // Browser sandbox info banner dismissed state
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);

  // Current active repository (unconditional)
  const repo = activeGitRepo || gitRepositories[0] || null;

  // Derive currently selected change file object without calling setState in an effect
  const currentSelectedChange = useMemo(() => {
    if (!repo || repo.changes.length === 0) return null;
    if (selectedChangeId) {
      const match = repo.changes.find((c) => c.id === selectedChangeId);
      if (match) return match;
    }
    return repo.changes[0];
  }, [repo, selectedChangeId]);

  // Derive selected commit in history without calling setState in an effect
  const currentSelectedCommit = useMemo(() => {
    if (!repo || repo.commits.length === 0) return null;
    if (selectedCommitHash) {
      const match = repo.commits.find((c) => c.hash === selectedCommitHash);
      if (match) return match;
    }
    return repo.commits[0];
  }, [repo, selectedCommitHash]);

  // Current branch model
  const currentBranchObj = useMemo(() => {
    if (!repo) return null;
    return repo.branches.find((b) => b.name === repo.currentBranch) || null;
  }, [repo]);

  // Staged and unstaged changes
  const stagedChanges = useMemo(() => repo?.changes.filter((c) => c.staged) || [], [repo]);
  const unstagedChanges = useMemo(() => repo?.changes.filter((c) => !c.staged && c.status !== '?') || [], [repo]);
  const untrackedFiles = useMemo(() => repo?.changes.filter((c) => !c.staged && c.status === '?') || [], [repo]);
  const conflictedFiles = useMemo(() => repo?.changes.filter((c) => c.status === '!') || [], [repo]);

  // Filtered Commits for History Tab (unconditional hook)
  const filteredCommits = useMemo(() => {
    if (!repo) return [];
    const filterTimeThreshold = historyDateFilter === 'today'
      ? 86400 * 1000
      : historyDateFilter === '7days'
      ? 7 * 86400 * 1000
      : historyDateFilter === '30days'
      ? 30 * 86400 * 1000
      : 0;

    return repo.commits.filter((c) => {
      // Search
      if (historySearch) {
        const query = historySearch.toLowerCase();
        const matchesSubject = c.subject.toLowerCase().includes(query);
        const matchesHash = c.hash.toLowerCase().includes(query);
        const matchesAuthor = c.author.name.toLowerCase().includes(query);
        if (!matchesSubject && !matchesHash && !matchesAuthor) return false;
      }
      // Author filter
      if (historyAuthorFilter !== 'all') {
        if (c.author.name !== historyAuthorFilter) return false;
      }
      // Date filter
      if (filterTimeThreshold > 0) {
        const commitTime = new Date(c.author.date).getTime();
        const refTime = new Date(repo.updatedAt).getTime();
        if (refTime - commitTime > filterTimeThreshold) return false;
      }
      return true;
    });
  }, [repo, historySearch, historyAuthorFilter, historyDateFilter]);

  // Distinct authors in history (unconditional hook)
  const distinctAuthors = useMemo(() => {
    if (!repo) return [];
    const set = new Set<string>();
    repo.commits.forEach((c) => set.add(c.author.name));
    return Array.from(set);
  }, [repo]);

  // Commit action
  const handlePerformCommit = useCallback(() => {
    if (!repo) return;
    const res = commitGitChanges(repo.id, commitMessage, isAmend);
    if (!res.success) {
      showToast(res.error || 'Commit failed', 'error', 3000);
      return;
    }
    setCommitMessage('');
    setIsAmend(false);
    showToast(`Committed to ${repo.currentBranch}`, 'success', 2000);
  }, [repo, commitGitChanges, commitMessage, isAmend, showToast]);

  // Keyboard shortcut Ctrl/Cmd + Enter to commit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.key === 'Enter') {
        const activeElem = document.activeElement;
        if (
          activeElem &&
          (activeElem.id === 'git-commit-msg-input' || activeElem.id === 'git-commit-desc-input')
        ) {
          e.preventDefault();
          handlePerformCommit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePerformCommit]);

  // Fallback if no repo
  if (!repo) {
    return (
      <div className="workspace-page" style={{ padding: 40, textAlign: 'center' }}>
        <FolderGit2 size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
        <h2>No Git Repositories Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Create a virtual repository or load the official demo repository.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            const demo = createDemoRepository();
            addGitRepository(demo);
            setActiveGitRepoId(demo.id);
            showToast('Loaded Demo Repository', 'success', 1500);
          }}
        >
          Load Demo Repository
        </button>
      </div>
    );
  }

  // Staging handlers
  const handleStageFile = (changeId: string) => {
    const target = repo.changes.find((c) => c.id === changeId);
    if (!target) return;
    stageGitFile(repo.id, changeId);
  };

  const handleUnstageFile = (changeId: string) => {
    unstageGitFile(repo.id, changeId);
  };

  const handleStageAll = () => {
    const res = stageAllGitFiles(repo.id);
    if (res.sensitiveWarnings.length > 0) {
      setSensitiveModalFiles(res.sensitiveWarnings);
    } else {
      showToast('All changes staged', 'info', 1200);
    }
  };

  const handleUnstageAll = () => {
    unstageAllGitFiles(repo.id);
    showToast('All changes unstaged', 'info', 1200);
  };

  const handleToggleHunk = (hunkId: string, shouldStage: boolean) => {
    if (!currentSelectedChange) return;
    toggleGitHunkStage(repo.id, currentSelectedChange.id, hunkId, shouldStage);
  };

  const handlePromptDiscardSingle = (change: GitChange) => {
    setDiscardChangeId(change.id);
    setDiscardModalFiles([change.filePath]);
  };

  const handlePromptDiscardAll = () => {
    const unstagedPaths = [...unstagedChanges, ...untrackedFiles].map((c) => c.filePath);
    if (unstagedPaths.length === 0) {
      showToast('No unstaged changes to discard', 'info', 1200);
      return;
    }
    setDiscardChangeId(null);
    setDiscardModalFiles(unstagedPaths);
  };

  const handleConfirmDiscard = () => {
    if (discardChangeId) {
      discardGitFileChanges(repo.id, discardChangeId);
      showToast('Changes discarded', 'info', 1500);
    } else {
      discardAllGitChanges(repo.id);
      showToast('All unstaged changes discarded', 'info', 1500);
    }
    setDiscardModalFiles(null);
    setDiscardChangeId(null);
  };

  // Switch branch
  const handleSwitchBranch = (branchName: string) => {
    const res = switchGitBranch(repo.id, branchName);
    if (!res.success) {
      if (res.requiresStashOrForce) {
        showToast(res.error || 'Please stash or commit changes first', 'error', 3500);
      } else {
        showToast(res.error || 'Failed to switch branch', 'error', 2500);
      }
      return;
    }
    showToast(`Switched to branch '${branchName}'`, 'success', 1500);
  };

  // Create branch
  const handleCreateBranch = () => {
    const res = createGitBranch(repo.id, newBranchName, newBranchBasedOn || undefined);
    if (!res.success) {
      showToast(res.error || 'Invalid branch name', 'error', 3000);
      return;
    }
    showToast(`Created branch '${newBranchName.trim()}'`, 'success', 1500);
    setIsCreateBranchOpen(false);
    setNewBranchName('');
    setNewBranchBasedOn('');
    switchGitBranch(repo.id, newBranchName.trim());
  };

  // Rename branch
  const handleConfirmRenameBranch = () => {
    if (!renameBranchOld || !renameBranchNew.trim()) return;
    const res = renameGitBranch(repo.id, renameBranchOld, renameBranchNew.trim());
    if (!res.success) {
      showToast(res.error || 'Failed to rename branch', 'error', 2500);
      return;
    }
    showToast(`Renamed branch to '${renameBranchNew.trim()}'`, 'success', 1500);
    setRenameBranchOld(null);
    setRenameBranchNew('');
  };

  // Delete branch
  const handleConfirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const res = deleteGitBranch(repo.id, branchToDelete);
    if (!res.success) {
      showToast(res.error || 'Failed to delete branch', 'error', 2500);
      return;
    }
    showToast(`Deleted branch '${branchToDelete}'`, 'info', 1500);
    setBranchToDelete(null);
  };

  // Merge branch
  const handlePerformMerge = () => {
    if (!mergeSourceBranch) return;
    const res = mergeGitBranch(repo.id, mergeSourceBranch);
    setIsMergeModalOpen(false);
    setMergeSourceBranch('');

    if (res.hasConflicts) {
      setActiveTab('merge');
      showToast(res.summary, 'warning', 4000);
    } else if (res.success) {
      showToast(res.summary, 'success', 2500);
    } else {
      showToast(res.summary, 'error', 3000);
    }
  };

  // Stash actions
  const handleCreateStash = () => {
    createGitStash(repo.id, stashMessage.trim() || undefined);
    setIsCreateStashOpen(false);
    setStashMessage('');
    showToast('Saved working tree to stash', 'success', 1500);
  };

  // Tag actions
  const handleCreateTag = () => {
    const commitTarget = newTagCommit.trim() || repo.headHash;
    const res = createGitTag(repo.id, newTagName.trim(), commitTarget, newTagMessage.trim() || undefined);
    if (!res.success) {
      showToast(res.error || 'Failed to create tag', 'error', 2500);
      return;
    }
    showToast(`Tag '${newTagName.trim()}' created`, 'success', 1500);
    setIsCreateTagOpen(false);
    setNewTagName('');
    setNewTagMessage('');
    setNewTagCommit('');
  };

  // Remote actions
  const handleSaveRemote = () => {
    if (editingRemoteName) {
      const res = editGitRemote(repo.id, editingRemoteName, remoteNameInput, remoteUrlInput);
      if (!res.success) {
        showToast(res.error || 'Failed to update remote', 'error', 2500);
        return;
      }
      showToast(`Updated remote '${remoteNameInput}'`, 'success', 1500);
    } else {
      const res = addGitRemote(repo.id, remoteNameInput, remoteUrlInput);
      if (!res.success) {
        showToast(res.error || 'Failed to add remote', 'error', 2500);
        return;
      }
      showToast(`Added remote '${remoteNameInput}'`, 'success', 1500);
    }
    setIsAddRemoteOpen(false);
    setEditingRemoteName(null);
    setRemoteNameInput('');
    setRemoteUrlInput('');
  };

  const handleFetchRemote = (name = 'origin') => {
    const summary = fetchGitRemote(repo.id, name);
    showToast(summary, 'info', 2000);
  };

  const handlePullRemote = (name = 'origin') => {
    const res = pullGitRemote(repo.id, name);
    if (!res.success) {
      showToast(res.error || 'Pull failed', 'error', 3000);
    } else {
      showToast(res.summary, 'success', 2000);
    }
  };

  const handlePushRemote = (name = 'origin') => {
    const hasAuth = Boolean(gitSettings.githubToken || gitSettings.gitlabToken || repo.isDemo);
    const res = pushGitRemote(repo.id, name, hasAuth);
    if (!res.success) {
      showToast(res.error || 'Push failed', 'error', 3500);
    } else {
      showToast(res.summary, 'success', 2000);
    }
  };

  // Local directory picker
  const handleOpenLocalDirectory = async () => {
    const res = await openLocalDirectory();
    if (res.isSandboxRestricted) {
      setSandboxNotice(res.error || 'Browser security restriction on .git folder.');
      showToast('Browser Sandbox: Cannot access hidden .git folder directly.', 'warning', 4000);
      return;
    }
    if (!res.success) {
      if (res.error && !res.error.includes('cancelled')) {
        showToast(res.error, 'error', 3000);
      }
      return;
    }
    if (res.repo) {
      addGitRepository(res.repo);
      setActiveGitRepoId(res.repo.id);
      showToast(`Connected local directory: ${res.repo.name}`, 'success', 2000);
    }
  };

  // Create new virtual repository
  const handleCreateNewRepo = () => {
    if (!newRepoName.trim()) {
      showToast('Repository name is required', 'error', 1500);
      return;
    }
    const newRepo: GitRepository = {
      id: `repo-${Date.now()}`,
      name: newRepoName.trim(),
      path: newRepoPath.trim() || `devdesk://${newRepoName.trim().toLowerCase()}`,
      projectId: newRepoProjectId || undefined,
      isDemo: false,
      currentBranch: gitSettings.defaultBranch || 'main',
      headHash: '0000000000000000000000000000000000000000',
      branches: [
        {
          name: gitSettings.defaultBranch || 'main',
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

    addGitRepository(newRepo);
    setActiveGitRepoId(newRepo.id);
    if (newRepoProjectId) {
      linkProjectToGitRepo(newRepoProjectId, newRepo.id);
    }
    setIsNewRepoModalOpen(false);
    setNewRepoName('');
    setNewRepoPath('');
    setNewRepoProjectId('');
    showToast('New repository initialized', 'success', 1500);
  };

  // Associated project
  const linkedProject = data.projects.find((p) => p.gitRepositoryId === repo.id || p.id === repo.projectId);

  // External provider links
  const primaryRemoteUrl = repo.remotes[0]?.fetchUrl || '';
  const providerInfo = parseRemoteProvider(primaryRemoteUrl);

  return (
    <div className="git-workspace-page">
      {/* Top Header Bar */}
      <div className="git-top-bar">
        <div className="git-top-left">
          {/* Repository Selector */}
          <select
            className="git-repo-select"
            value={repo.id}
            onChange={(e) => setActiveGitRepoId(e.target.value)}
            title="Switch Git Repository"
          >
            {gitRepositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.isDemo ? '(Demo)' : ''}
              </option>
            ))}
          </select>

          {/* Rule 45: Explicit Demo Repository Label */}
          {repo.isDemo && (
            <span className="git-demo-badge" title="Demo data for local exploration">
              <Sparkles size={11} />
              <span>Demo Repository</span>
            </span>
          )}

          {/* Linked Project Badge */}
          {linkedProject && (
            <span
              className="git-branch-pill"
              style={{ cursor: 'pointer', borderColor: linkedProject.color }}
              onClick={() => setActiveView('project-detail', { projectId: linkedProject.id })}
              title="Open linked DevDesk project"
            >
              <Folder size={12} style={{ color: linkedProject.color }} />
              <span>Project: {linkedProject.name}</span>
            </span>
          )}

          {/* Current Branch */}
          <div className="git-branch-pill">
            <GitBranchIcon size={13} style={{ color: 'var(--accent)' }} />
            <span>{repo.currentBranch}</span>
          </div>

          {/* Ahead / Behind count */}
          {currentBranchObj && (
            <div className="git-ahead-behind" title="Commits ahead/behind tracking remote branch">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <ArrowDown size={11} /> {currentBranchObj.behind}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <ArrowUp size={11} /> {currentBranchObj.ahead}
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Toolbar */}
        <div className="git-top-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleFetchRemote()}
            title="Fetch changes from remote"
          >
            <RefreshCw size={12} />
            <span>Fetch</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handlePullRemote()}
            title="Pull upstream commits into current branch"
          >
            <ArrowDown size={12} />
            <span>Pull</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handlePushRemote()}
            title="Push local commits to remote"
          >
            <ArrowUp size={12} />
            <span>Push</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setNewBranchName('');
              setNewBranchBasedOn(repo.currentBranch);
              setIsCreateBranchOpen(true);
            }}
            title="Create new branch"
          >
            <Plus size={12} />
            <span>New Branch</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setMergeSourceBranch('');
              setIsMergeModalOpen(true);
            }}
            title="Merge branch into current branch"
          >
            <GitMerge size={12} />
            <span>Merge</span>
          </button>

          <button
            className="btn btn-subtle btn-sm btn-icon"
            onClick={() => setIsNewRepoModalOpen(true)}
            title="Initialize or Add Repository"
          >
            <Plus size={14} />
          </button>

          <button
            className="btn btn-subtle btn-sm btn-icon"
            onClick={handleOpenLocalDirectory}
            title="Connect Local Project Folder"
          >
            <Folder size={14} />
          </button>
        </div>
      </div>

      {/* Browser Sandbox Notice Banner if applicable */}
      {sandboxNotice && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <span>{sandboxNotice}</span>
          </div>
          <button
            className="btn btn-subtle btn-xs"
            onClick={() => setSandboxNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="git-tabs-nav">
        <button
          className={`git-tab-btn ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          <FileCode size={13} />
          <span>Changes</span>
          {repo.changes.length > 0 && (
            <span className={`git-tab-badge ${conflictedFiles.length > 0 ? 'conflict' : ''}`}>
              {repo.changes.length}
            </span>
          )}
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Sliders size={13} />
          <span>Overview</span>
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={13} />
          <span>History</span>
          <span className="git-tab-badge">{repo.commits.length}</span>
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <GitBranchIcon size={13} />
          <span>Branches</span>
          <span className="git-tab-badge">{repo.branches.length}</span>
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
          onClick={() => setActiveTab('merge')}
        >
          <GitMerge size={13} />
          <span>Merge & Conflicts</span>
          {conflictedFiles.length > 0 && (
            <span className="git-tab-badge conflict">
              ! {conflictedFiles.length}
            </span>
          )}
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'stash' ? 'active' : ''}`}
          onClick={() => setActiveTab('stash')}
        >
          <Archive size={13} />
          <span>Stash</span>
          {repo.stashes.length > 0 && (
            <span className="git-tab-badge">{repo.stashes.length}</span>
          )}
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          <Tag size={13} />
          <span>Tags</span>
          {repo.tags.length > 0 && (
            <span className="git-tab-badge">{repo.tags.length}</span>
          )}
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'remotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('remotes')}
        >
          <GitPullRequest size={13} />
          <span>Remotes</span>
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'gitignore' ? 'active' : ''}`}
          onClick={() => setActiveTab('gitignore')}
        >
          <Shield size={13} />
          <span>.gitignore Helper</span>
        </button>

        <button
          className={`git-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Sliders size={13} />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="git-tab-content">
        {/* =================================================================
            TAB 1: CHANGES VIEW & COMMIT WORKSPACE
            ================================================================= */}
        {activeTab === 'changes' && (
          <div className="git-changes-layout">
            {/* Left Column: Staging lists & Commit Box */}
            <div className="git-changes-sidebar">
              {/* Commit Workspace Box */}
              <div className="git-commit-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>Commit Changes</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {stagedChanges.length} file{stagedChanges.length !== 1 ? 's' : ''} staged
                  </span>
                </div>

                <input
                  id="git-commit-msg-input"
                  ref={commitInputRef}
                  type="text"
                  placeholder="Commit message summary (Ctrl+Enter to commit)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="git-commit-input"
                />

                <textarea
                  id="git-commit-desc-input"
                  placeholder="Extended description (optional)..."
                  value={isAmend && !commitMessage ? (repo.commits[0]?.body || '') : undefined}
                  className="git-commit-textarea"
                />

                <div className="git-commit-footer">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isAmend}
                      onChange={(e) => {
                        setIsAmend(e.target.checked);
                        if (e.target.checked && repo.commits[0]) {
                          setCommitMessage(repo.commits[0].subject);
                        }
                      }}
                    />
                    <span>Amend previous</span>
                  </label>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handlePerformCommit}
                    disabled={stagedChanges.length === 0 && !isAmend}
                    title="Commit staged changes to branch (Ctrl+Enter)"
                  >
                    <GitCommitIcon size={13} />
                    <span>Commit to {repo.currentBranch}</span>
                  </button>
                </div>
              </div>

              {/* Conflicted Files Warning */}
              {conflictedFiles.length > 0 && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(200, 36, 47, 0.1)',
                    border: '1px solid rgba(200, 36, 47, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                    <span className="git-status-badge status-!">!</span>
                    <span>{conflictedFiles.length} Conflicted File(s)</span>
                  </div>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => setActiveTab('merge')}
                  >
                    Resolve
                  </button>
                </div>
              )}

              {/* Staged Changes Card */}
              <div className="git-file-list-card">
                <div className="git-file-list-header">
                  <span>Staged Changes ({stagedChanges.length})</span>
                  {stagedChanges.length > 0 && (
                    <button
                      className="btn btn-subtle btn-xs"
                      onClick={handleUnstageAll}
                      title="Unstage all files"
                    >
                      Unstage All
                    </button>
                  )}
                </div>

                {stagedChanges.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    No staged changes. Click (+) on unstaged files to stage.
                  </div>
                ) : (
                  stagedChanges.map((change) => (
                    <div
                      key={change.id}
                      className={`git-file-item ${currentSelectedChange?.id === change.id ? 'selected' : ''}`}
                      onClick={() => setSelectedChangeId(change.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span className={`git-status-badge status-${change.status}`}>
                          {change.status}
                        </span>
                        <span className="git-file-path">{change.filePath}</span>
                      </div>

                      <div className="git-file-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-subtle btn-xs btn-icon"
                          onClick={() => handleUnstageFile(change.id)}
                          title="Unstage file"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Unstaged Changes Card */}
              <div className="git-file-list-card">
                <div className="git-file-list-header">
                  <span>Changes ({unstagedChanges.length})</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {unstagedChanges.length > 0 && (
                      <>
                        <button
                          className="btn btn-subtle btn-xs"
                          onClick={handlePromptDiscardAll}
                          title="Discard all changes"
                        >
                          Discard All
                        </button>
                        <button
                          className="btn btn-subtle btn-xs"
                          onClick={handleStageAll}
                          title="Stage all changes"
                        >
                          Stage All
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {unstagedChanges.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    Working tree clean.
                  </div>
                ) : (
                  unstagedChanges.map((change) => (
                    <div
                      key={change.id}
                      className={`git-file-item ${currentSelectedChange?.id === change.id ? 'selected' : ''}`}
                      onClick={() => setSelectedChangeId(change.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span className={`git-status-badge status-${change.status}`}>
                          {change.status}
                        </span>
                        <span className="git-file-path">{change.filePath}</span>
                      </div>

                      <div className="git-file-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-subtle btn-xs btn-icon"
                          onClick={() => handlePromptDiscardSingle(change)}
                          title="Discard changes in this file"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          className="btn btn-subtle btn-xs btn-icon"
                          onClick={() => handleStageFile(change.id)}
                          title="Stage file"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Untracked Files Card */}
              {untrackedFiles.length > 0 && (
                <div className="git-file-list-card">
                  <div className="git-file-list-header">
                    <span>Untracked Files ({untrackedFiles.length})</span>
                    <button
                      className="btn btn-subtle btn-xs"
                      onClick={() => {
                        untrackedFiles.forEach((u) => stageGitFile(repo.id, u.id));
                      }}
                      title="Stage all untracked files"
                    >
                      Track All
                    </button>
                  </div>

                  {untrackedFiles.map((change) => (
                    <div
                      key={change.id}
                      className={`git-file-item ${currentSelectedChange?.id === change.id ? 'selected' : ''}`}
                      onClick={() => setSelectedChangeId(change.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span className="git-status-badge status-?">?</span>
                        <span className="git-file-path">{change.filePath}</span>
                      </div>

                      <div className="git-file-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-subtle btn-xs btn-icon"
                          onClick={() => handlePromptDiscardSingle(change)}
                          title="Delete untracked file"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          className="btn btn-subtle btn-xs btn-icon"
                          onClick={() => handleStageFile(change.id)}
                          title="Stage untracked file"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Diff Viewer or Empty State */}
            <div style={{ height: '100%', overflow: 'hidden' }}>
              {currentSelectedChange ? (
                currentSelectedChange.status === '!' ? (
                  // If conflicted, show Conflict Editor directly
                  <GitConflictEditor
                    conflict={
                      repo.conflicts.find((c) => c.filePath === currentSelectedChange.filePath) || {
                        filePath: currentSelectedChange.filePath,
                        blocks: [],
                        isResolved: false,
                      }
                    }
                    onResolve={(resolvedContent) => {
                      resolveGitConflict(repo.id, currentSelectedChange.filePath, resolvedContent);
                    }}
                  />
                ) : (
                  <GitDiffViewer
                    change={currentSelectedChange}
                    defaultMode={gitSettings.defaultDiffMode || 'unified'}
                    onToggleHunk={handleToggleHunk}
                  />
                )
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  Select a changed file on the left to inspect its diff.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: OVERVIEW / DASHBOARD
            ================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            {/* Left side: Repository info card & Working Tree Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Repository Card */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FolderGit2 size={15} style={{ color: 'var(--accent)' }} />
                    Repository Details
                  </span>
                  {repo.isDemo && <span className="git-demo-badge">Demo Repository</span>}
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Repository Name:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{repo.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Directory / Path:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{repo.path}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Branch:</span>
                    <span className="git-branch-pill">
                      <GitBranchIcon size={12} /> {repo.currentBranch}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>HEAD Commit:</span>
                    <span className="git-commit-sha">{repo.headHash.slice(0, 7)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tracking Remote:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {repo.remotes[0] ? maskCredentialsInUrl(repo.remotes[0].fetchUrl) : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Working Tree Changes Summary */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span>Working Tree Status</span>
                  <button className="btn btn-subtle btn-xs" onClick={() => setActiveTab('changes')}>
                    Open Changes View
                  </button>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Staged</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
                        {stagedChanges.length}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Unstaged</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>
                        {unstagedChanges.length}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Untracked</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#0a6690' }}>
                        {untrackedFiles.length}
                      </div>
                    </div>
                  </div>

                  {repo.changes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {repo.changes.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'var(--bg-sunken)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`git-status-badge status-${c.status}`}>{c.status}</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{c.filePath}</span>
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {c.staged ? 'Staged' : 'Unstaged'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Working tree is clean. No uncommitted changes.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Latest Commit & Quick Remote Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Latest Commit Card */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span>Latest Commit</span>
                  <button className="btn btn-subtle btn-xs" onClick={() => setActiveTab('history')}>
                    View History
                  </button>
                </div>
                <div style={{ padding: 16 }}>
                  {repo.commits[0] ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="git-commit-sha">{repo.commits[0].shortHash}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {formatDate(repo.commits[0].author.date)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
                        {repo.commits[0].subject}
                      </div>
                      {repo.commits[0].body && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                          {repo.commits[0].body}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Committed by <strong>{repo.commits[0].author.name}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No commits yet.</div>
                  )}
                </div>
              </div>

              {/* Provider Links if GitHub/GitLab */}
              {providerInfo.provider !== 'other' && (
                <div className="tool-panel">
                  <div className="tool-panel-header">
                    <span style={{ textTransform: 'capitalize' }}>{providerInfo.provider} Integration</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {providerInfo.webUrl && (
                      <a
                        href={providerInfo.webUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'flex-start', gap: 8 }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Repository on {providerInfo.provider}</span>
                      </a>
                    )}
                    {providerInfo.pullRequestUrl && (
                      <a
                        href={providerInfo.pullRequestUrl(repo.currentBranch)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'flex-start', gap: 8 }}
                      >
                        <GitPullRequest size={13} />
                        <span>Create Pull Request ({repo.currentBranch})</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: COMMIT HISTORY & DETAILS
            ================================================================= */}
        {activeTab === 'history' && (
          <div className="git-history-layout">
            {/* Left: Commit list & filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              {/* Search & Filters Bar */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search commits by message, SHA, author..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{ flex: 1, minWidth: 160, fontSize: 12, padding: '6px 10px' }}
                />

                <select
                  value={historyAuthorFilter}
                  onChange={(e) => setHistoryAuthorFilter(e.target.value)}
                  style={{ fontSize: 12, padding: '6px 8px' }}
                >
                  <option value="all">All Authors</option>
                  {distinctAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>

                <select
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value as 'all' | 'today' | '7days' | '30days')}
                  style={{ fontSize: 12, padding: '6px 8px' }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Past 7 days</option>
                  <option value="30days">Past 30 days</option>
                </select>
              </div>

              {/* Commit cards list */}
              <div className="git-history-list">
                {filteredCommits.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No commits match your filters.
                  </div>
                ) : (
                  filteredCommits.map((c) => (
                    <div
                      key={c.hash}
                      className={`git-commit-card ${currentSelectedCommit?.hash === c.hash ? 'selected' : ''}`}
                      onClick={() => setSelectedCommitHash(c.hash)}
                    >
                      <div className="git-commit-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="git-commit-sha">{c.shortHash}</span>
                          <button
                            className="btn btn-subtle btn-xs btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(c.hash);
                              showToast('Commit SHA copied', 'success', 1200);
                            }}
                            title="Copy full SHA"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatDate(c.author.date)}
                        </span>
                      </div>

                      <div className="git-commit-subject">{c.subject}</div>

                      <div className="git-commit-meta">
                        <span>{c.author.name}</span>
                        {c.tags && c.tags.length > 0 && (
                          <span style={{ display: 'flex', gap: 4 }}>
                            {c.tags.map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  background: 'var(--bg-sunken)',
                                  borderRadius: 4,
                                  color: 'var(--accent)',
                                  fontWeight: 600,
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </span>
                        )}
                        {c.isMerge && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                            [Merge]
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Commit Details & Changed Files Diff */}
            <div style={{ height: '100%', overflowY: 'auto' }}>
              {currentSelectedCommit ? (
                <div className="tool-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="tool-panel-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GitCommitIcon size={14} style={{ color: 'var(--accent)' }} />
                      <span>Commit {currentSelectedCommit.shortHash}</span>
                    </span>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(currentSelectedCommit.hash);
                        showToast('Full commit SHA copied', 'success', 1500);
                      }}
                    >
                      <Copy size={11} />
                      <span>Copy SHA</span>
                    </button>
                  </div>

                  <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      {currentSelectedCommit.subject}
                    </div>
                    {currentSelectedCommit.body && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 12 }}>
                        {currentSelectedCommit.body}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Author: </span>
                        <strong>{currentSelectedCommit.author.name}</strong> ({currentSelectedCommit.author.email})
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Date: </span>
                        <span>{new Date(currentSelectedCommit.author.date).toLocaleString()}</span>
                      </div>
                      {currentSelectedCommit.parentHashes.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Parent: </span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {currentSelectedCommit.parentHashes.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files Changed */}
                  <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 10 }}>
                      Files changed ({currentSelectedCommit.filesChanged.length}):
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {currentSelectedCommit.filesChanged.map((fc) => (
                        <div
                          key={fc.filePath}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`git-status-badge status-${fc.status}`}>{fc.status}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fc.filePath}</span>
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: 'var(--success)' }}>+{fc.additions}</span>
                            <span style={{ color: 'var(--danger)', marginLeft: 6 }}>-{fc.deletions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Select a commit from history to view details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: BRANCH MANAGEMENT & COMPARE
            ================================================================= */}
        {activeTab === 'branches' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            {/* Left: Branches list & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Local Branches */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GitBranchIcon size={14} style={{ color: 'var(--accent)' }} />
                    <span>Local Branches ({repo.branches.filter((b) => !b.isRemote).length})</span>
                  </span>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      setNewBranchName('');
                      setNewBranchBasedOn(repo.currentBranch);
                      setIsCreateBranchOpen(true);
                    }}
                  >
                    <Plus size={11} />
                    <span>Create Branch</span>
                  </button>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {repo.branches
                    .filter((b) => !b.isRemote)
                    .map((branch) => {
                      const isCurrent = branch.name === repo.currentBranch;

                      return (
                        <div
                          key={branch.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isCurrent ? 'var(--bg-surface-active)' : 'var(--bg-input)',
                            border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <GitBranchIcon
                              size={14}
                              style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}
                            />
                            <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 13 }}>
                              {branch.name}
                            </span>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  background: 'var(--accent)',
                                  color: 'white',
                                  borderRadius: 4,
                                }}
                              >
                                CURRENT
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {!isCurrent && (
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleSwitchBranch(branch.name)}
                                title="Checkout branch"
                              >
                                Checkout
                              </button>
                            )}

                            <button
                              className="btn btn-subtle btn-xs btn-icon"
                              onClick={() => {
                                setRenameBranchOld(branch.name);
                                setRenameBranchNew(branch.name);
                              }}
                              title="Rename branch"
                            >
                              <Edit2 size={12} />
                            </button>

                            {!isCurrent && (
                              <button
                                className="btn btn-subtle btn-xs btn-icon"
                                onClick={() => setBranchToDelete(branch.name)}
                                title="Delete branch"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Remote Branches */}
              <div className="tool-panel">
                <div className="tool-panel-header">
                  <span>Remote Tracking Branches</span>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {repo.branches.filter((b) => b.isRemote).length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      No remote branches tracked. Configure a remote to fetch branches.
                    </div>
                  ) : (
                    repo.branches
                      .filter((b) => b.isRemote)
                      .map((branch) => (
                        <div
                          key={branch.name}
                          style={{
                            padding: '6px 10px',
                            background: 'var(--bg-sunken)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                            fontFamily: 'var(--font-mono)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <GitBranchIcon size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>{branch.name}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Branch Compare */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span>Branch Comparison</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Base Branch:
                    </label>
                    <select
                      value={compareTargetBranch || repo.currentBranch}
                      onChange={(e) => setCompareTargetBranch(e.target.value)}
                      style={{ width: '100%', fontSize: 12 }}
                    >
                      {repo.branches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Compare Branch:
                    </label>
                    <select
                      value={compareSourceBranch || (repo.branches[1]?.name ?? repo.currentBranch)}
                      onChange={(e) => setCompareSourceBranch(e.target.value)}
                      style={{ width: '100%', fontSize: 12 }}
                    >
                      {repo.branches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    padding: 14,
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Comparison Summary</div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                    Comparing <code>{compareSourceBranch || repo.branches[1]?.name || 'feature'}</code> into <code>{compareTargetBranch || repo.currentBranch}</code>.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>Able to merge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 5: MERGE WORKFLOW & CONFLICT RESOLUTION
            ================================================================= */}
        {activeTab === 'merge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Merge Control Card */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitMerge size={15} style={{ color: 'var(--accent)' }} />
                  <span>Merge Workflow</span>
                </span>
              </div>
              <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Target (Current): </span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{repo.currentBranch}</strong>
                  </div>
                  <div>&larr;</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Merge Branch: </span>
                    <select
                      value={mergeSourceBranch}
                      onChange={(e) => setMergeSourceBranch(e.target.value)}
                      style={{ fontSize: 12, minWidth: 160 }}
                    >
                      <option value="">Select branch to merge...</option>
                      {repo.branches
                        .filter((b) => b.name !== repo.currentBranch)
                        .map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handlePerformMerge}
                  disabled={!mergeSourceBranch}
                >
                  <GitMerge size={13} />
                  <span>Merge into {repo.currentBranch}</span>
                </button>
              </div>
            </div>

            {/* Merge Conflict Resolution Section */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="git-status-badge status-!">!</span>
                  <span>
                    Merge Conflicts ({conflictedFiles.length} file{conflictedFiles.length !== 1 ? 's' : ''})
                  </span>
                </span>
                {conflictedFiles.length === 0 && (
                  <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
                    No active conflicts.
                  </span>
                )}
              </div>

              <div style={{ padding: 16 }}>
                {conflictedFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600 }}>No unresolved conflicts</div>
                    <div style={{ fontSize: 12 }}>All files are clean and ready for commits.</div>
                  </div>
                ) : (
                  conflictedFiles.map((c) => {
                    const conflictObj = repo.conflicts.find((conf) => conf.filePath === c.filePath);

                    return (
                      <div key={c.id} style={{ marginBottom: 20 }}>
                        <GitConflictEditor
                          conflict={
                            conflictObj || {
                              filePath: c.filePath,
                              blocks: [],
                              isResolved: false,
                            }
                          }
                          onResolve={(resolvedContent) => {
                            resolveGitConflict(repo.id, c.filePath, resolvedContent);
                          }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 6: STASH MANAGEMENT
            ================================================================= */}
        {activeTab === 'stash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Archive size={14} style={{ color: 'var(--accent)' }} />
                  <span>Stash Manager ({repo.stashes.length})</span>
                </span>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => setIsCreateStashOpen(true)}
                  disabled={repo.changes.length === 0}
                  title={repo.changes.length === 0 ? 'No changes to stash' : 'Stash working tree changes'}
                >
                  <Plus size={11} />
                  <span>Create Stash</span>
                </button>
              </div>

              <div style={{ padding: 14 }}>
                {repo.stashes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
                    No stashes recorded in this repository.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {repo.stashes.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '10px 14px',
                          background: 'var(--bg-input)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span className="git-commit-sha">stash@&#123;{s.index}&#125;</span>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{s.message}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            Branch: <strong>{s.branchName}</strong> &bull; {s.changes.length} changed file(s) &bull; {formatDate(s.timestamp)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                              const res = applyGitStash(repo.id, s.id);
                              if (res.error) showToast(res.error, 'error', 2000);
                              else showToast('Applied stash to working tree', 'success', 1500);
                            }}
                            title="Apply stash (keep in list)"
                          >
                            Apply
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                              const res = popGitStash(repo.id, s.id);
                              if (res.error) showToast(res.error, 'error', 2000);
                              else showToast('Popped stash to working tree', 'success', 1500);
                            }}
                            title="Pop stash (restore and drop)"
                          >
                            Pop
                          </button>
                          <button
                            className="btn btn-subtle btn-xs"
                            onClick={() => setViewingStashDiff(viewingStashDiff === s.id ? null : s.id)}
                          >
                            {viewingStashDiff === s.id ? 'Hide Diff' : 'View Diff'}
                          </button>
                          <button
                            className="btn btn-subtle btn-xs btn-icon"
                            onClick={() => setStashToDrop(s.id)}
                            title="Drop stash"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Viewing Stash Diff Pane */}
            {viewingStashDiff && (() => {
              const stash = repo.stashes.find((s) => s.id === viewingStashDiff);
              if (!stash) return null;
              return (
                <div className="tool-panel">
                  <div className="tool-panel-header">
                    <span>Stash Diff: {stash.message}</span>
                  </div>
                  <div style={{ padding: 12 }}>
                    {stash.changes.map((c) => (
                      <div key={c.id} style={{ marginBottom: 12 }}>
                        <GitDiffViewer change={c} readOnly />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =================================================================
            TAB 7: TAGS MANAGEMENT
            ================================================================= */}
        {activeTab === 'tags' && (
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={14} style={{ color: 'var(--accent)' }} />
                <span>Git Tags ({repo.tags.length})</span>
              </span>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setNewTagName('');
                  setNewTagMessage('');
                  setNewTagCommit(repo.headHash);
                  setIsCreateTagOpen(true);
                }}
              >
                <Plus size={11} />
                <span>Create Tag</span>
              </button>
            </div>

            <div style={{ padding: 14 }}>
              {repo.tags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
                  No tags created in this repository yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {repo.tags.map((tag) => (
                    <div
                      key={tag.name}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Tag size={13} style={{ color: 'var(--accent)' }} />
                          <strong style={{ fontSize: 13 }}>{tag.name}</strong>
                          <span className="git-commit-sha">{tag.commitHash.slice(0, 7)}</span>
                        </div>
                        {tag.message && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            {tag.message}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Created by {tag.tagger || 'Developer'} &bull; {formatDate(tag.date)}
                        </div>
                      </div>

                      <button
                        className="btn btn-subtle btn-xs btn-icon"
                        onClick={() => setTagToDelete(tag.name)}
                        title="Delete tag"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 8: REMOTE MANAGEMENT
            ================================================================= */}
        {activeTab === 'remotes' && (
          <div className="tool-panel">
            <div className="tool-panel-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitPullRequest size={14} style={{ color: 'var(--accent)' }} />
                <span>Remote Repositories ({repo.remotes.length})</span>
              </span>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  setEditingRemoteName(null);
                  setRemoteNameInput('origin');
                  setRemoteUrlInput('');
                  setIsAddRemoteOpen(true);
                }}
              >
                <Plus size={11} />
                <span>Add Remote</span>
              </button>
            </div>

            <div style={{ padding: 14 }}>
              {repo.remotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
                  No remotes configured. Click &quot;Add Remote&quot; to connect a remote URL (GitHub, GitLab, etc.).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {repo.remotes.map((r) => {
                    const maskedFetch = maskCredentialsInUrl(r.fetchUrl);
                    const maskedPush = maskCredentialsInUrl(r.pushUrl);

                    return (
                      <div
                        key={r.name}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-input)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            Fetch: {maskedFetch}
                          </div>
                          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            Push: {maskedPush}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleFetchRemote(r.name)}
                          >
                            Fetch
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handlePullRemote(r.name)}
                          >
                            Pull
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handlePushRemote(r.name)}
                          >
                            Push
                          </button>
                          <button
                            className="btn btn-subtle btn-xs btn-icon"
                            onClick={() => {
                              setEditingRemoteName(r.name);
                              setRemoteNameInput(r.name);
                              setRemoteUrlInput(r.fetchUrl);
                              setIsAddRemoteOpen(true);
                            }}
                            title="Edit remote"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-subtle btn-xs btn-icon"
                            onClick={() => setRemoteToDelete(r.name)}
                            title="Remove remote"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 9: .GITIGNORE HELPER
            ================================================================= */}
        {activeTab === 'gitignore' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            {/* Presets Selector */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span>Select .gitignore Categories & Presets</span>
              </div>
              <div style={{ padding: 14 }}>
                <div className="git-preset-grid">
                  {GITIGNORE_PRESETS.map((preset) => {
                    const isSelected = selectedPresets.includes(preset.id);

                    return (
                      <div
                        key={preset.id}
                        className={`git-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPresets((prev) => prev.filter((id) => id !== preset.id));
                          } else {
                            setSelectedPresets((prev) => [...prev, preset.id]);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{preset.name}</span>
                          <input type="checkbox" checked={isSelected} readOnly />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {preset.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Ignore Pattern */}
                <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Add custom pattern (e.g. *.backup, /temp/)..."
                    value={customIgnoreRule}
                    onChange={(e) => setCustomIgnoreRule(e.target.value)}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (!customIgnoreRule.trim()) return;
                      setCustomIgnoreList((prev) => [...prev, customIgnoreRule.trim()]);
                      setCustomIgnoreRule('');
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Preview */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span>.gitignore Preview</span>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    const content = generateGitignoreContent(selectedPresets, customIgnoreList);
                    navigator.clipboard.writeText(content);
                    showToast('Copied .gitignore content', 'success', 1500);
                  }}
                >
                  <Copy size={11} />
                  <span>Copy</span>
                </button>
              </div>
              <div style={{ padding: 12 }}>
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    background: 'var(--bg-code)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    maxHeight: 380,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {generateGitignoreContent(selectedPresets, customIgnoreList)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 10: GIT SETTINGS & RUNTIME INFO
            ================================================================= */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            {/* Git Preferences */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span>Git Preferences & Author Identity</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Author Name:
                  </label>
                  <input
                    type="text"
                    value={gitSettings.authorName}
                    onChange={(e) => updateGitSettings({ authorName: e.target.value })}
                    style={{ width: '100%', fontSize: 12.5 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Author Email:
                  </label>
                  <input
                    type="email"
                    value={gitSettings.authorEmail}
                    onChange={(e) => updateGitSettings({ authorEmail: e.target.value })}
                    style={{ width: '100%', fontSize: 12.5 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Default Initial Branch Name:
                  </label>
                  <input
                    type="text"
                    value={gitSettings.defaultBranch}
                    onChange={(e) => updateGitSettings({ defaultBranch: e.target.value })}
                    style={{ width: '100%', fontSize: 12.5 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Default Diff View Mode:
                  </label>
                  <select
                    value={gitSettings.defaultDiffMode}
                    onChange={(e) => updateGitSettings({ defaultDiffMode: e.target.value as 'unified' | 'split' })}
                    style={{ width: '100%', fontSize: 12.5 }}
                  >
                    <option value="unified">Unified</option>
                    <option value="split">Split (Side-by-side)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Runtime & Security Architecture */}
            <div className="tool-panel">
              <div className="tool-panel-header">
                <span>Runtime & Security Architecture</span>
              </div>
              <div style={{ padding: 16, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: 10 }}>
                  <strong>Browser Environment Notice:</strong> DevDesk is a local-first browser application. For privacy and sandbox isolation, browser security policies restrict direct arbitrary writes to your operating system&apos;s hidden <code>.git</code> folders without explicit user permission.
                </p>
                <p style={{ marginBottom: 10 }}>
                  <strong>Security Guarantee:</strong> DevDesk never sends your repository source code or Git credentials to any third-party analytics or telemetry servers. All operations happen in-memory and in your local browser sandbox.
                </p>
                {repo && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (gitRepositories.length <= 1) {
                          showToast('Cannot delete the only repository', 'error', 1500);
                          return;
                        }
                        deleteGitRepository(repo.id);
                        showToast(`Deleted repository '${repo.name}'`, 'info', 1500);
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Delete Repository from DevDesk</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          MODALS
          ================================================================= */}

      {/* Discard Confirmation Dialog */}
      {discardModalFiles && (
        <GitDiscardModal
          isOpen={Boolean(discardModalFiles)}
          onClose={() => setDiscardModalFiles(null)}
          onConfirm={handleConfirmDiscard}
          filePaths={discardModalFiles}
        />
      )}

      {/* Sensitive File Warning Modal */}
      {sensitiveModalFiles && (
        <GitSensitiveWarningModal
          isOpen={Boolean(sensitiveModalFiles)}
          onClose={() => setSensitiveModalFiles(null)}
          onConfirm={() => {
            setSensitiveModalFiles(null);
            showToast('Staged files despite sensitivity warning', 'info', 1500);
          }}
          filePaths={sensitiveModalFiles}
        />
      )}

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateBranchOpen}
        onClose={() => setIsCreateBranchOpen(false)}
        title="Create Branch"
        maxWidth={420}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateBranchOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
              Create Branch
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Branch Name:
            </label>
            <input
              type="text"
              placeholder="e.g. feature/api-client"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Based On:
            </label>
            <select
              value={newBranchBasedOn || repo.currentBranch}
              onChange={(e) => setNewBranchBasedOn(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            >
              {repo.branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.commitHash.slice(0, 7)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Rename Branch Modal */}
      <Modal
        isOpen={Boolean(renameBranchOld)}
        onClose={() => setRenameBranchOld(null)}
        title="Rename Branch"
        maxWidth={400}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRenameBranchOld(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmRenameBranch}>
              Rename Branch
            </button>
          </>
        }
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
            New Branch Name:
          </label>
          <input
            type="text"
            value={renameBranchNew}
            onChange={(e) => setRenameBranchNew(e.target.value)}
            style={{ width: '100%', fontSize: 12.5 }}
          />
        </div>
      </Modal>

      {/* Delete Branch Dialog */}
      <ConfirmDialog
        isOpen={Boolean(branchToDelete)}
        onClose={() => setBranchToDelete(null)}
        onConfirm={handleConfirmDeleteBranch}
        title="Delete Branch?"
        message={`Are you sure you want to delete branch "${branchToDelete}"? This action cannot be undone.`}
        confirmLabel="Delete Branch"
      />

      {/* Merge Modal */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title={`Merge into ${repo.currentBranch}`}
        maxWidth={420}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsMergeModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handlePerformMerge} disabled={!mergeSourceBranch}>
              Merge Branch
            </button>
          </>
        }
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Select branch to merge into <strong>{repo.currentBranch}</strong>:
          </label>
          <select
            value={mergeSourceBranch}
            onChange={(e) => setMergeSourceBranch(e.target.value)}
            style={{ width: '100%', fontSize: 12.5 }}
          >
            <option value="">Select branch...</option>
            {repo.branches
              .filter((b) => b.name !== repo.currentBranch)
              .map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
      </Modal>

      {/* Create Stash Modal */}
      <Modal
        isOpen={isCreateStashOpen}
        onClose={() => setIsCreateStashOpen(false)}
        title="Create Stash"
        maxWidth={400}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateStashOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateStash}>
              Stash Changes
            </button>
          </>
        }
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Stash Message:
          </label>
          <input
            type="text"
            placeholder="e.g. WIP on user authentication flow"
            value={stashMessage}
            onChange={(e) => setStashMessage(e.target.value)}
            style={{ width: '100%', fontSize: 12.5 }}
          />
        </div>
      </Modal>

      {/* Drop Stash Dialog */}
      <ConfirmDialog
        isOpen={Boolean(stashToDrop)}
        onClose={() => setStashToDrop(null)}
        onConfirm={() => {
          if (stashToDrop) {
            dropGitStash(repo.id, stashToDrop);
            showToast('Stash dropped', 'info', 1200);
            setStashToDrop(null);
          }
        }}
        title="Drop Stash?"
        message="Are you sure you want to drop this stash? Its changes will be permanently removed."
        confirmLabel="Drop Stash"
      />

      {/* Create Tag Modal */}
      <Modal
        isOpen={isCreateTagOpen}
        onClose={() => setIsCreateTagOpen(false)}
        title="Create Tag"
        maxWidth={420}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateTagOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateTag} disabled={!newTagName.trim()}>
              Create Tag
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Tag Name:
            </label>
            <input
              type="text"
              placeholder="e.g. v1.2.0"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Target Commit SHA (optional, defaults to HEAD):
            </label>
            <input
              type="text"
              placeholder={repo.headHash.slice(0, 7)}
              value={newTagCommit}
              onChange={(e) => setNewTagCommit(e.target.value)}
              style={{ width: '100%', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Tag Message (optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Release candidate 1"
              value={newTagMessage}
              onChange={(e) => setNewTagMessage(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Tag Dialog */}
      <ConfirmDialog
        isOpen={Boolean(tagToDelete)}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => {
          if (tagToDelete) {
            deleteGitTag(repo.id, tagToDelete);
            showToast(`Tag '${tagToDelete}' deleted`, 'info', 1200);
            setTagToDelete(null);
          }
        }}
        title="Delete Tag?"
        message={`Are you sure you want to delete tag "${tagToDelete}"?`}
        confirmLabel="Delete Tag"
      />

      {/* Add / Edit Remote Modal */}
      <Modal
        isOpen={isAddRemoteOpen}
        onClose={() => setIsAddRemoteOpen(false)}
        title={editingRemoteName ? 'Edit Remote' : 'Add Remote'}
        maxWidth={440}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddRemoteOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveRemote}
              disabled={!remoteNameInput.trim() || !remoteUrlInput.trim()}
            >
              Save Remote
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Remote Name:
            </label>
            <input
              type="text"
              placeholder="origin"
              value={remoteNameInput}
              onChange={(e) => setRemoteNameInput(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Remote URL:
            </label>
            <input
              type="text"
              placeholder="https://github.com/username/repository.git"
              value={remoteUrlInput}
              onChange={(e) => setRemoteUrlInput(e.target.value)}
              style={{ width: '100%', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </Modal>

      {/* Remove Remote Dialog */}
      <ConfirmDialog
        isOpen={Boolean(remoteToDelete)}
        onClose={() => setRemoteToDelete(null)}
        onConfirm={() => {
          if (remoteToDelete) {
            removeGitRemote(repo.id, remoteToDelete);
            showToast(`Remote '${remoteToDelete}' removed`, 'info', 1200);
            setRemoteToDelete(null);
          }
        }}
        title="Remove Remote?"
        message={`Are you sure you want to remove remote "${remoteToDelete}"?`}
        confirmLabel="Remove Remote"
      />

      {/* New Repository Modal */}
      <Modal
        isOpen={isNewRepoModalOpen}
        onClose={() => setIsNewRepoModalOpen(false)}
        title="Initialize New Repository"
        maxWidth={440}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsNewRepoModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateNewRepo}
              disabled={!newRepoName.trim()}
            >
              Create Repository
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Repository Name:
            </label>
            <input
              type="text"
              placeholder="e.g. backend-api"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Local Path (optional):
            </label>
            <input
              type="text"
              placeholder="c:/Users/.../project"
              value={newRepoPath}
              onChange={(e) => setNewRepoPath(e.target.value)}
              style={{ width: '100%', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Associate with DevDesk Project:
            </label>
            <select
              value={newRepoProjectId}
              onChange={(e) => setNewRepoProjectId(e.target.value)}
              style={{ width: '100%', fontSize: 12.5 }}
            >
              <option value="">None (Independent Repository)</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
