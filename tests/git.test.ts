import { describe, it, expect } from 'vitest';
import {
  maskCredentialsInUrl,
  isPotentialSecretFile,
  validateBranchName,
  computeLineDiff,
  parseUnifiedDiff,
  buildSplitDiffRows,
  isBinaryFile,
  parseConflictBlocks,
  formatResolvedContent,
  countUnresolvedConflicts,
  generateGitignoreContent,
  GITIGNORE_PRESETS,
  createDemoRepository,
  stageFile,
  unstageFile,
  toggleHunkStage,
  validateCommit,
  commitChanges,
  createBranch,
  switchBranch,
  deleteBranch,
  mergeBranch,
  createStash,
  popStash,
  dropStash,
  createTag,
  deleteTag,
  addRemote,
  removeRemote,
} from '../src/services/git';
import type { GitFileConflict } from '../src/types/git';

describe('Git Security & Environment Safety', () => {
  it('masks username and password in remote URLs', () => {
    expect(maskCredentialsInUrl('https://user:password123@github.com/org/repo.git'))
      .toBe('https://user:***@github.com/org/repo.git');
    expect(maskCredentialsInUrl('https://token12345@gitlab.com/project.git'))
      .toBe('https://token12345:***@gitlab.com/project.git');
    expect(maskCredentialsInUrl('https://github.com/normal/repo.git'))
      .toBe('https://github.com/normal/repo.git');
    expect(maskCredentialsInUrl('git@github.com:org/repo.git'))
      .toBe('git@github.com:org/repo.git');
    expect(maskCredentialsInUrl('')).toBe('');
  });

  it('detects potentially sensitive secret and credential files', () => {
    expect(isPotentialSecretFile('.env').isSecret).toBe(true);
    expect(isPotentialSecretFile('.env.local').isSecret).toBe(true);
    expect(isPotentialSecretFile('.env.production').isSecret).toBe(true);
    expect(isPotentialSecretFile('id_rsa').isSecret).toBe(true);
    expect(isPotentialSecretFile('server.pem').isSecret).toBe(true);
    expect(isPotentialSecretFile('config/credentials.json').isSecret).toBe(true);
    expect(isPotentialSecretFile('auth-token.txt').isSecret).toBe(true);
    expect(isPotentialSecretFile('certs/private.key').isSecret).toBe(true);

    expect(isPotentialSecretFile('src/App.tsx').isSecret).toBe(false);
    expect(isPotentialSecretFile('package.json').isSecret).toBe(false);
    expect(isPotentialSecretFile('README.md').isSecret).toBe(false);
    expect(isPotentialSecretFile('.gitignore').isSecret).toBe(false);
  });
});

describe('Git Branch Validation', () => {
  it('validates branch names according to Git ref rules', () => {
    expect(validateBranchName('main').isValid).toBe(true);
    expect(validateBranchName('feature/login-oauth').isValid).toBe(true);
    expect(validateBranchName('fix/issue_404').isValid).toBe(true);
    expect(validateBranchName('v1.0.0-rc1').isValid).toBe(true);

    // Invalid branch names
    expect(validateBranchName('').isValid).toBe(false);
    expect(validateBranchName('  ').isValid).toBe(false);
    expect(validateBranchName('feature..test').isValid).toBe(false);
    expect(validateBranchName('feature/test.lock').isValid).toBe(false);
    expect(validateBranchName('/leading-slash').isValid).toBe(false);
    expect(validateBranchName('trailing-slash/').isValid).toBe(false);
    expect(validateBranchName('double//slash').isValid).toBe(false);
    expect(validateBranchName('has space').isValid).toBe(false);
    expect(validateBranchName('tilde~branch').isValid).toBe(false);
    expect(validateBranchName('caret^branch').isValid).toBe(false);
    expect(validateBranchName('colon:branch').isValid).toBe(false);
    expect(validateBranchName('branch?name').isValid).toBe(false);
    expect(validateBranchName('branch*name').isValid).toBe(false);
    expect(validateBranchName('branch[name').isValid).toBe(false);
    expect(validateBranchName('branch@{name').isValid).toBe(false);
  });

  it('rejects duplicate branch names', () => {
    const existing = ['main', 'develop', 'feature/api'];
    expect(validateBranchName('main', existing).isValid).toBe(false);
    expect(validateBranchName('develop', existing).isValid).toBe(false);
    expect(validateBranchName('feature/new-api', existing).isValid).toBe(true);
  });
});

describe('Git Diff & Hunk Parsing', () => {
  it('computes line-by-line diff between two strings', () => {
    const original = 'line1\nline2\nline3';
    const modified = 'line1\nline2 modified\nline3\nline4';
    const diffResult = computeLineDiff(original, modified);

    expect(diffResult.hunks.length).toBeGreaterThan(0);
    expect(diffResult.additions).toBeGreaterThan(0);
    expect(diffResult.deletions).toBeGreaterThan(0);
    expect(diffResult.unifiedDiff).toContain('line2 modified');
  });

  it('parses unified git diff into hunks and summary statistics', () => {
    const rawDiff = `@@ -1,4 +1,5 @@
 import React from 'react';
-const oldConst = 1;
+const newConst = 2;
+console.log('debug');
 export default App;`;

    const hunks = parseUnifiedDiff(rawDiff);
    expect(hunks.length).toBe(1);
    expect(hunks[0].header).toContain('@@ -1,4 +1,5 @@');
    expect(hunks[0].lines.length).toBe(5);
    expect(hunks[0].lines.filter((l) => l.type === 'add').length).toBe(2);
    expect(hunks[0].lines.filter((l) => l.type === 'delete').length).toBe(1);
    expect(hunks[0].lines.filter((l) => l.type === 'context').length).toBe(2);
  });

  it('builds split diff rows correctly paired', () => {
    const hunks = parseUnifiedDiff(`@@ -1,2 +1,2 @@
-old line
+new line`);

    const splitRows = buildSplitDiffRows(hunks[0]);
    expect(splitRows.length).toBe(1);
    expect(splitRows[0].left?.content).toBe('old line');
    expect(splitRows[0].right?.content).toBe('new line');
  });

  it('detects binary file extensions safely', () => {
    expect(isBinaryFile('assets/logo.png')).toBe(true);
    expect(isBinaryFile('binary.wasm')).toBe(true);
    expect(isBinaryFile('document.pdf')).toBe(true);
    expect(isBinaryFile('archive.zip')).toBe(true);
    expect(isBinaryFile('src/index.ts')).toBe(false);
    expect(isBinaryFile('src/styles.css')).toBe(false);
    expect(isBinaryFile('package.json')).toBe(false);
  });
});

describe('Git Conflict Resolution Service', () => {
  const sampleConflictContent = `const config = {
<<<<<<< HEAD
  apiUrl: 'https://api.production.internal',
  timeout: 5000,
=======
  apiUrl: 'https://api.v2.production.internal',
  timeout: 8000,
  retries: 3,
>>>>>>> feature/api-v2
};`;

  it('parses conflict markers into structured blocks', () => {
    const blocks = parseConflictBlocks(sampleConflictContent);
    expect(blocks.length).toBe(1);
    expect(blocks[0].currentBranch).toBe('HEAD');
    expect(blocks[0].incomingBranch).toBe('feature/api-v2');
    expect(blocks[0].currentContent).toContain("apiUrl: 'https://api.production.internal'");
    expect(blocks[0].incomingContent).toContain("apiUrl: 'https://api.v2.production.internal'");
  });

  it('formats resolved content when accepting current branch', () => {
    const blocks = parseConflictBlocks(sampleConflictContent);
    blocks[0].resolution = 'current';

    const resolved = formatResolvedContent(sampleConflictContent, blocks);
    expect(resolved).toContain("apiUrl: 'https://api.production.internal'");
    expect(resolved).not.toContain("apiUrl: 'https://api.v2.production.internal'");
    expect(resolved).not.toContain('<<<<<<< HEAD');
    expect(resolved).not.toContain('>>>>>>>');
  });

  it('formats resolved content when accepting incoming branch', () => {
    const blocks = parseConflictBlocks(sampleConflictContent);
    blocks[0].resolution = 'incoming';

    const resolved = formatResolvedContent(sampleConflictContent, blocks);
    expect(resolved).toContain("apiUrl: 'https://api.v2.production.internal'");
    expect(resolved).toContain('retries: 3');
    expect(resolved).not.toContain('<<<<<<< HEAD');
  });

  it('formats resolved content when accepting both branches', () => {
    const blocks = parseConflictBlocks(sampleConflictContent);
    blocks[0].resolution = 'both';

    const resolved = formatResolvedContent(sampleConflictContent, blocks);
    expect(resolved).toContain("apiUrl: 'https://api.production.internal'");
    expect(resolved).toContain("apiUrl: 'https://api.v2.production.internal'");
  });

  it('counts unresolved conflicts accurately across files', () => {
    const conflicts: GitFileConflict[] = [
      {
        filePath: 'src/api.ts',
        blocks: [],
        isResolved: false,
      },
      {
        filePath: 'package.json',
        blocks: [],
        isResolved: true,
      },
    ];

    expect(countUnresolvedConflicts(conflicts)).toBe(1);
    conflicts[0].isResolved = true;
    expect(countUnresolvedConflicts(conflicts)).toBe(0);
  });
});

describe('Git Engine Core Operations', () => {
  it('creates demo repository with valid initial state', () => {
    const repo = createDemoRepository();
    expect(repo.id).toBe('repo-demo-devdesk');
    expect(repo.isDemo).toBe(true);
    expect(repo.currentBranch).toBe('main');
    expect(repo.commits.length).toBeGreaterThan(0);
    expect(repo.changes.length).toBeGreaterThan(0);
    expect(repo.branches.length).toBeGreaterThan(0);
    expect(repo.remotes.length).toBeGreaterThan(0);
  });

  it('stages and unstages files properly', () => {
    let repo = createDemoRepository();
    const targetFile = repo.changes.find((c) => !c.staged);
    expect(targetFile).toBeDefined();

    if (targetFile) {
      repo = stageFile(repo, targetFile.id);
      const updated = repo.changes.find((c) => c.id === targetFile.id);
      expect(updated?.staged).toBe(true);

      repo = unstageFile(repo, targetFile.id);
      const reverted = repo.changes.find((c) => c.id === targetFile.id);
      expect(reverted?.staged).toBe(false);
    }
  });

  it('toggles hunk staging state inside a changed file', () => {
    let repo = createDemoRepository();
    const fileWithHunks = repo.changes.find((c) => c.hunks && c.hunks.length > 0);
    expect(fileWithHunks).toBeDefined();

    if (fileWithHunks && fileWithHunks.hunks) {
      const hunkId = fileWithHunks.hunks[0].id;
      const initialStaged = fileWithHunks.hunks[0].staged;

      repo = toggleHunkStage(repo, fileWithHunks.id, hunkId, !initialStaged);
      const updatedFile = repo.changes.find((c) => c.id === fileWithHunks.id);
      const updatedHunk = updatedFile?.hunks?.find((h) => h.id === hunkId);
      expect(updatedHunk?.staged).toBe(!initialStaged);
    }
  });

  it('validates and creates commits, updating commit history', () => {
    let repo = createDemoRepository();

    // Empty message validation
    const emptyCheck = validateCommit(repo, '   ');
    expect(emptyCheck.isValid).toBe(false);
    expect(emptyCheck.error).toContain('Please enter a commit message');

    // Stage all changes and resolve conflicts to allow commit
    repo = {
      ...repo,
      changes: repo.changes.filter((c) => c.status !== '!').map((c) => ({ ...c, staged: true })),
      conflicts: [],
    };

    const validCheck = validateCommit(repo, 'feat: add git integration workspace');
    expect(validCheck.isValid).toBe(true);

    const initialCommitCount = repo.commits.length;
    const { repo: newRepo, commit } = commitChanges(
      repo,
      'feat: add git integration workspace',
      { name: 'Tester', email: 'tester@example.com' }
    );

    expect(newRepo.commits.length).toBe(initialCommitCount + 1);
    expect(commit.subject).toBe('feat: add git integration workspace');
    expect(newRepo.headHash).toBe(commit.hash);
    // Staged files should now be removed from changes
    expect(newRepo.changes.filter((c) => c.staged).length).toBe(0);
  });

  it('creates, switches, and deletes branches safely', () => {
    let repo = createDemoRepository();

    // Create branch
    const createRes = createBranch(repo, 'feature/test-branch');
    expect(createRes.error).toBeUndefined();
    repo = createRes.repo;
    expect(repo.branches.some((b) => b.name === 'feature/test-branch')).toBe(true);

    // Switch branch (clear changes to allow safe checkout)
    repo = { ...repo, changes: [] };
    const switchRes = switchBranch(repo, 'feature/test-branch');
    expect(switchRes.error).toBeUndefined();
    repo = switchRes.repo;
    expect(repo.currentBranch).toBe('feature/test-branch');

    // Cannot delete active branch
    const deleteActiveRes = deleteBranch(repo, 'feature/test-branch');
    expect(deleteActiveRes.error).toBeDefined();
    expect(deleteActiveRes.error).toContain('Cannot delete the current active branch');

    // Switch back to main and delete feature branch
    repo = switchBranch(repo, 'main').repo;
    const deleteRes = deleteBranch(repo, 'feature/test-branch');
    expect(deleteRes.error).toBeUndefined();
    repo = deleteRes.repo;
    expect(repo.branches.some((b) => b.name === 'feature/test-branch')).toBe(false);
  });

  it('performs merge between branches', () => {
    let repo = createDemoRepository();
    // Fast-forward merge
    const ffRes = mergeBranch(repo, 'feature/api-client');
    expect(ffRes.merged).toBe(true);

    // 3-way merge with new branch commit
    const threeWayRes = mergeBranch(repo, 'fix/webhook-timeout');
    expect(threeWayRes.merged).toBe(true);
    expect(threeWayRes.repo.commits.length).toBeGreaterThan(repo.commits.length);
  });

  it('creates, applies, pops, and drops stashes', () => {
    let repo = createDemoRepository();
    const initialStashCount = repo.stashes.length;

    // Create stash
    const createRes = createStash(repo, 'WIP: test work');
    expect(createRes.stash).toBeDefined();
    repo = createRes.repo;
    expect(repo.stashes.length).toBe(initialStashCount + 1);

    const newStash = repo.stashes[0];
    expect(newStash.message).toBe('WIP: test work');

    // Pop stash
    const popRes = popStash(repo, newStash.id);
    expect(popRes.error).toBeUndefined();
    repo = popRes.repo;
    expect(repo.stashes.some((s) => s.id === newStash.id)).toBe(false);

    // Create another stash to test drop
    repo = {
      ...repo,
      changes: [{ id: 'c1', filePath: 'test.ts', status: 'M', staged: false, additions: 1, deletions: 0 }],
    };
    repo = createStash(repo, 'WIP: to drop').repo;
    const stashToDrop = repo.stashes[0];
    repo = dropStash(repo, stashToDrop.id);
    expect(repo.stashes.some((s) => s.id === stashToDrop.id)).toBe(false);
  });

  it('manages git tags', () => {
    let repo = createDemoRepository();
    const createTagRes = createTag(repo, 'v2.0.0', repo.headHash, 'Release 2.0.0');
    expect(createTagRes.error).toBeUndefined();
    repo = createTagRes.repo;
    expect(repo.tags.some((t) => t.name === 'v2.0.0')).toBe(true);

    repo = deleteTag(repo, 'v2.0.0');
    expect(repo.tags.some((t) => t.name === 'v2.0.0')).toBe(false);
  });

  it('manages git remotes', () => {
    let repo = createDemoRepository();
    const addRemoteRes = addRemote(repo, 'upstream', 'https://github.com/upstream/devdesk.git');
    expect(addRemoteRes.error).toBeUndefined();
    repo = addRemoteRes.repo;
    expect(repo.remotes.some((r) => r.name === 'upstream')).toBe(true);

    repo = removeRemote(repo, 'upstream');
    expect(repo.remotes.some((r) => r.name === 'upstream')).toBe(false);
  });
});

describe('Gitignore Presets Helper', () => {
  it('has presets for major tech stacks', () => {
    expect(GITIGNORE_PRESETS.length).toBeGreaterThanOrEqual(10);
    const ids = GITIGNORE_PRESETS.map((p) => p.id);
    expect(ids).toContain('node');
    expect(ids).toContain('react-vite');
    expect(ids).toContain('python');
    expect(ids).toContain('docker');
    expect(ids).toContain('env-files');
  });

  it('generates .gitignore file with chosen categories', () => {
    const content = generateGitignoreContent(['node', 'env-files']);
    expect(content).toContain('node_modules/');
    expect(content).toContain('.env');
    expect(content).toContain('.env.local');
    expect(content).toContain('# Created by DevDesk .gitignore Helper');
  });
});
