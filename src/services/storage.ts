import type {
  WorkspaceData,
  UserSettings,
  Task,
  Snippet,
  Project,
  ScratchpadData,
  FavoriteItem,
  HistoryItem
} from '../types';

const STORAGE_KEY = 'devdesk_workspace_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  autoSave: true,
  confirmDestructive: true,
  trackHistory: true,
};

const DEFAULT_SCRATCHPAD: ScratchpadData = {
  content: `# Today's Work

## TODO
- [ ] Fix auth token refresh middleware
- [ ] Review PR #142 (Stripe webhook idempotency)
- [ ] Verify database migration on staging

## Quick Notes & Commands
\`\`\`bash
# Start local dev stack with Redis & Postgres
docker compose up -d postgres redis
npm run dev
\`\`\`

## API Response Sample
\`\`\`json
{
  "status": "healthy",
  "version": "1.4.0",
  "uptime": 86400,
  "cluster": "us-east-1"
}
\`\`\`
`,
  isPinned: true,
  lastSaved: new Date().toISOString(),
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Fix auth token refresh middleware bug',
    description: 'Ensure token expiration triggers background silent refresh before 401 response.',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    projectId: 'proj-1',
    tags: ['auth', 'backend', 'bug'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review PR #142: Payment idempotent keys',
    description: 'Verify redis locking mechanism and retry logic for duplicate stripe events.',
    status: 'todo',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: 'proj-1',
    tags: ['payments', 'review'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Audit regex patterns for ReDoS vulnerabilities',
    description: 'Check regex tester inputs in user signup validation.',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    tags: ['security', 'audit'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Upgrade Node runtime dependencies in CI',
    description: 'Update GitHub actions workflow to Node 22 LTS.',
    status: 'done',
    priority: 'low',
    projectId: 'proj-2',
    tags: ['devops', 'ci'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Payment Service API',
    description: 'Core microservice managing billing subscriptions, stripe webhooks, and invoices.',
    status: 'active',
    isFavorite: true,
    color: '#4750DD',
    links: [
      { id: 'link-1', label: 'API Docs', url: 'https://docs.stripe.com' },
      { id: 'link-2', label: 'GitHub Repo', url: 'https://github.com' },
    ],
    notes: 'Handles high-throughput subscription billing. Never commit API secret keys to git.',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Developer Portal',
    description: 'Internal documentation, utilities, and developer productivity tooling.',
    status: 'active',
    isFavorite: false,
    color: '#05C274',
    links: [
      { id: 'link-3', label: 'Staging App', url: 'https://staging.internal' },
    ],
    notes: 'Central hub for engineering onboarding.',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Mobile Client v2',
    description: 'Next generation iOS and Android client written with React Native.',
    status: 'planning',
    isFavorite: false,
    color: '#0A6690',
    links: [],
    notes: 'Design review planned for Q4.',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'snip-1',
    title: 'React Custom Debounce Hook',
    description: 'Smooth debounce hook for search inputs and rapid state changes with cleanup.',
    language: 'typescript',
    tags: ['react', 'hooks', 'typescript'],
    projectId: 'proj-2',
    isFavorite: true,
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'snip-2',
    title: 'Resilient Fetch with Timeout and Retry',
    description: 'Fetch wrapper with exponential backoff and AbortController timeout signal.',
    language: 'typescript',
    tags: ['api', 'network', 'async'],
    projectId: 'proj-1',
    isFavorite: true,
    code: `export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 5000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok || attempt === retries) return response;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt === retries) throw err;
    }
    // Exponential backoff
    await new Promise((r) => setTimeout(r, 2 ** attempt * 250));
  }
  throw new Error('Request failed after retries');
}`,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'snip-3',
    title: 'PostgreSQL Upsert with CTE',
    description: 'Idempotent insert or update query pattern for payment transaction records.',
    language: 'sql',
    tags: ['sql', 'postgres', 'database'],
    projectId: 'proj-1',
    isFavorite: false,
    code: `INSERT INTO customer_subscriptions (
  id, customer_id, plan_id, status, current_period_end
) VALUES (
  $1, $2, $3, $4, $5
)
ON CONFLICT (customer_id, plan_id)
DO UPDATE SET
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW()
RETURNING *;`,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const DEFAULT_FAVORITES: FavoriteItem[] = [
  {
    id: 'fav-tool-1',
    type: 'tool',
    targetId: 'json-formatter',
    title: 'JSON Formatter',
    subtitle: 'Format, validate and minify JSON with tree view',
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'fav-tool-2',
    type: 'tool',
    targetId: 'jwt-decoder',
    title: 'JWT Decoder',
    subtitle: 'Decode header, payload and inspect token claims',
    addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'fav-tool-3',
    type: 'tool',
    targetId: 'uuid-generator',
    title: 'UUID Generator',
    subtitle: 'Generate secure v4 UUIDs in bulk',
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'fav-snip-1',
    type: 'snippet',
    targetId: 'snip-1',
    title: 'React Custom Debounce Hook',
    subtitle: 'TypeScript snippet',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'fav-proj-1',
    type: 'project',
    targetId: 'proj-1',
    title: 'Payment Service API',
    subtitle: 'Active project workspace',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    type: 'tool',
    targetId: 'json-formatter',
    title: 'JSON Formatter',
    subtitle: 'Format, validate & minify',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
  },
  {
    id: 'hist-2',
    type: 'tool',
    targetId: 'jwt-decoder',
    title: 'JWT Decoder',
    subtitle: 'Decoded authorization token',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
  },
  {
    id: 'hist-3',
    type: 'snippet',
    targetId: 'snip-1',
    title: 'React Custom Debounce Hook',
    subtitle: 'Viewed snippet',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
  },
  {
    id: 'hist-4',
    type: 'project',
    targetId: 'proj-1',
    title: 'Payment Service API',
    subtitle: 'Project workspace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
];

export const INITIAL_WORKSPACE: WorkspaceData = {
  tasks: DEFAULT_TASKS,
  snippets: DEFAULT_SNIPPETS,
  projects: DEFAULT_PROJECTS,
  scratchpad: DEFAULT_SCRATCHPAD,
  favorites: DEFAULT_FAVORITES,
  history: DEFAULT_HISTORY,
  settings: DEFAULT_SETTINGS,
  version: 2,
};

export function loadWorkspaceData(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceData(INITIAL_WORKSPACE);
      return INITIAL_WORKSPACE;
    }
    const parsed = JSON.parse(raw);
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
    // v2 made light the default theme: switch v1 workspaces over once
    if ((parsed.version || 1) < 2) settings.theme = 'light';
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_TASKS,
      snippets: Array.isArray(parsed.snippets) ? parsed.snippets : DEFAULT_SNIPPETS,
      projects: Array.isArray(parsed.projects) ? parsed.projects : DEFAULT_PROJECTS,
      scratchpad: parsed.scratchpad && typeof parsed.scratchpad.content === 'string'
        ? parsed.scratchpad
        : DEFAULT_SCRATCHPAD,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT_FAVORITES,
      history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_HISTORY,
      settings,
      version: 2,
    };
  } catch (err) {
    console.error('Error loading DevDesk workspace data from localStorage:', err);
    return INITIAL_WORKSPACE;
  }
}

export function saveWorkspaceData(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving DevDesk workspace data to localStorage:', err);
  }
}

export function exportWorkspaceJSON(data: WorkspaceData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadWorkspaceBackup(data: WorkspaceData): void {
  const json = exportWorkspaceJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `devdesk-workspace-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedWorkspace(jsonStr: string): WorkspaceData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format for DevDesk workspace.');
  }
  return {
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    snippets: Array.isArray(parsed.snippets) ? parsed.snippets : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    scratchpad: parsed.scratchpad && typeof parsed.scratchpad.content === 'string'
      ? parsed.scratchpad
      : { content: '', isPinned: false, lastSaved: new Date().toISOString() },
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    // Imported backups keep the theme they were saved with
    version: 2,
  };
}

export function clearWorkspaceStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
