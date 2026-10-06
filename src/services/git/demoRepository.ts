import type { GitRepository, GitCommit, GitChange, GitFileConflict } from '../../types/git';
import { parseUnifiedDiff } from './diffService';
import { parseConflictBlocks } from './conflictService';

const SAMPLE_API_DIFF = `@@ -42,8 +42,10 @@ export interface RequestOptions {
   headers?: Record<string, string>;
-  timeout?: number;
+  timeoutMs?: number;
+  retries?: number;
 }

 export async function executeApiRequest(url: string, options: RequestOptions = {}) {
-  const controller = new AbortController();
+  const maxRetries = options.retries ?? 3;
+  const controller = new AbortController();
+  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);
@@ -88,4 +90,6 @@ export async function executeApiRequest(url: string, options: RequestOptions = {
   try {
     const res = await fetch(url, { signal: controller.signal });
+    clearTimeout(timeout);
     return await res.json();
   } catch (err) {
`;

const SAMPLE_APP_DIFF = `@@ -15,4 +15,6 @@ export function App() {
   const [theme, setTheme] = useState('dark');
+  // Smooth transition support
+  const isDarkMode = theme === 'dark';

   return (
`;

const SAMPLE_PACKAGE_CONFLICT = `{
  "name": "devdesk",
  "version": "1.0.0",
  "dependencies": {
<<<<<<< HEAD
    "lucide-react": "^1.48.0",
    "react": "^19.2.8"
=======
    "lucide-react": "^1.49.0",
    "react": "^19.3.0"
>>>>>>> feature/api-client
  }
}`;

const DEMO_COMMITS: GitCommit[] = [
  {
    hash: 'a82c91f42d8819ef347c6198f121a81239c81b21',
    shortHash: 'a82c91f',
    subject: 'Improve API request timeout handling and connection retry',
    body: 'Configured exponential backoff for network timeouts and added abort controller signaling to prevent stalled connections.',
    author: {
      name: 'Sonal',
      email: 'sonal@devdesk.local',
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    parentHashes: ['7cd82a194ebca9082531aa92ef8817cb2188432a'],
    filesChanged: [
      { filePath: 'src/services/apiExecutor.ts', status: 'M', additions: 18, deletions: 4 },
      { filePath: 'src/types/api.ts', status: 'M', additions: 5, deletions: 1 },
    ],
  },
  {
    hash: '7cd82a194ebca9082531aa92ef8817cb2188432a',
    shortHash: '7cd82a1',
    subject: 'Add GraphQL schema introspection and explorer query runner',
    body: 'Supports variables, header interpolation, and schema AST field completion.',
    author: {
      name: 'Sonal',
      email: 'sonal@devdesk.local',
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    parentHashes: ['e51ba091176bfa29304cbe98129034fead811902'],
    filesChanged: [
      { filePath: 'src/services/graphqlExecutor.ts', status: 'A', additions: 142, deletions: 0 },
      { filePath: 'src/components/views/api/GraphqlView.tsx', status: 'A', additions: 310, deletions: 0 },
    ],
  },
  {
    hash: 'e51ba091176bfa29304cbe98129034fead811902',
    shortHash: 'e51ba09',
    subject: 'Implement WebSocket live stream & SSE auto-reconnect',
    body: 'Added heartbeat ping/pong verification and live event filtering.',
    author: {
      name: 'DevDesk Core Team',
      email: 'team@devdesk.local',
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    parentHashes: ['2b69f8812cba190273aef9012389104fae109823'],
    filesChanged: [
      { filePath: 'src/services/webSocketManager.ts', status: 'A', additions: 195, deletions: 0 },
      { filePath: 'src/services/sseManager.ts', status: 'A', additions: 160, deletions: 0 },
    ],
  },
  {
    hash: '2b69f8812cba190273aef9012389104fae109823',
    shortHash: '2b69f88',
    subject: 'Create mock server router and response schema generator',
    body: 'Supports status code simulation, latency delay, and wildcards.',
    author: {
      name: 'DevDesk Core Team',
      email: 'team@devdesk.local',
      date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
    parentHashes: ['0f98ac2918bcde01923847acff81298412093856'],
    filesChanged: [
      { filePath: 'src/services/mockServer.ts', status: 'A', additions: 220, deletions: 0 },
    ],
    tags: ['v1.0.0'],
  },
  {
    hash: '0f98ac2918bcde01923847acff81298412093856',
    shortHash: '0f98ac2',
    subject: 'Initial DevDesk core architecture and workspace persistence',
    body: 'Local-first offline storage, tools registry, and dark/light design system.',
    author: {
      name: 'DevDesk Core Team',
      email: 'team@devdesk.local',
      date: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    },
    parentHashes: [],
    filesChanged: [
      { filePath: 'README.md', status: 'A', additions: 85, deletions: 0 },
      { filePath: 'package.json', status: 'A', additions: 35, deletions: 0 },
      { filePath: 'src/App.tsx', status: 'A', additions: 90, deletions: 0 },
    ],
    tags: ['v0.9.0'],
  },
];

export function createDemoRepository(): GitRepository {
  const apiHunks = parseUnifiedDiff(SAMPLE_API_DIFF);
  const appHunks = parseUnifiedDiff(SAMPLE_APP_DIFF);

  const demoChanges: GitChange[] = [
    {
      id: 'change-1',
      filePath: 'src/services/api.ts',
      status: 'M',
      staged: false,
      additions: 6,
      deletions: 2,
      diff: SAMPLE_API_DIFF,
      hunks: apiHunks,
    },
    {
      id: 'change-2',
      filePath: 'src/App.tsx',
      status: 'M',
      staged: true,
      additions: 2,
      deletions: 0,
      diff: SAMPLE_APP_DIFF,
      hunks: appHunks,
    },
    {
      id: 'change-3',
      filePath: 'src/types/telemetry.ts',
      status: 'A',
      staged: true,
      additions: 24,
      deletions: 0,
      diff: `@@ -0,0 +1,24 @@\n+export interface TelemetryEvent {\n+  event: string;\n+  timestamp: string;\n+  payload: Record<string, unknown>;\n+}`,
      hunks: parseUnifiedDiff(
        `@@ -0,0 +1,6 @@\n+export interface TelemetryEvent {\n+  event: string;\n+  timestamp: string;\n+}`
      ),
    },
    {
      id: 'change-4',
      filePath: 'scratchpad-notes.md',
      status: '?',
      staged: false,
      additions: 12,
      deletions: 0,
      diff: `@@ -0,0 +1,12 @@\n+# Phase 4 Git Notes\n+- Verified split diff\n+- Tested conflict editor\n`,
      hunks: parseUnifiedDiff(`@@ -0,0 +1,4 @@\n+# Phase 4 Git Notes\n`),
    },
    {
      id: 'change-5',
      filePath: 'package.json',
      status: '!',
      staged: false,
      additions: 4,
      deletions: 2,
      diff: `@@ -4,4 +4,6 @@\n<<<<<<< HEAD\n    "lucide-react": "^1.48.0",\n=======\n    "lucide-react": "^1.49.0",\n>>>>>>> feature/api-client`,
      conflictContent: SAMPLE_PACKAGE_CONFLICT,
      isResolved: false,
    },
  ];

  const conflictBlocks = parseConflictBlocks(
    SAMPLE_PACKAGE_CONFLICT,
    'HEAD (main)',
    'feature/api-client'
  );

  const conflicts: GitFileConflict[] = [
    {
      filePath: 'package.json',
      blocks: conflictBlocks,
      isResolved: false,
    },
  ];

  return {
    id: 'repo-demo-devdesk',
    name: 'DevDesk Core (Demo)',
    path: 'c:/Users/Developer/DevDesk',
    isDemo: true,
    currentBranch: 'main',
    headHash: DEMO_COMMITS[0].hash,
    branches: [
      {
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commitHash: DEMO_COMMITS[0].hash,
        upstream: 'origin/main',
        ahead: 2,
        behind: 0,
      },
      {
        name: 'feature/api-client',
        isCurrent: false,
        isRemote: false,
        commitHash: DEMO_COMMITS[1].hash,
        ahead: 1,
        behind: 0,
      },
      {
        name: 'fix/webhook-timeout',
        isCurrent: false,
        isRemote: false,
        commitHash: '3f901cb91244e8bc19d9021e8cb30129feac6781',
        ahead: 0,
        behind: 1,
      },
      {
        name: 'origin/main',
        isCurrent: false,
        isRemote: true,
        commitHash: DEMO_COMMITS[1].hash,
        ahead: 0,
        behind: 0,
      },
    ],
    remotes: [
      {
        name: 'origin',
        fetchUrl: 'https://github.com/sonalsai/DevDesk.git',
        pushUrl: 'https://github.com/sonalsai/DevDesk.git',
      },
    ],
    commits: DEMO_COMMITS,
    changes: demoChanges,
    stashes: [
      {
        id: 'stash-1',
        index: 0,
        message: 'WIP: Quick fix for dark mode toggle styling',
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        branchName: 'main',
        commitHash: DEMO_COMMITS[0].hash,
        changes: [
          {
            id: 'stash-change-1',
            filePath: 'src/index.css',
            status: 'M',
            staged: false,
            additions: 4,
            deletions: 1,
            diff: '@@ -40,3 +40,6 @@\n+  --border-focus: #4750dd;\n',
          },
        ],
      },
    ],
    tags: [
      {
        name: 'v1.0.0',
        commitHash: DEMO_COMMITS[3].hash,
        message: 'Phase 3 Release: Realtime & Mock Server Engine',
        tagger: 'DevDesk Core Team',
        date: DEMO_COMMITS[3].author.date,
      },
      {
        name: 'v0.9.0',
        commitHash: DEMO_COMMITS[4].hash,
        message: 'Phase 1 Baseline Workspace',
        tagger: 'DevDesk Core Team',
        date: DEMO_COMMITS[4].author.date,
      },
    ],
    conflicts,
    isMerging: true,
    mergingBranch: 'feature/api-client',
    provider: 'github',
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
