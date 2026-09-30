import type {
  WorkspaceData,
  UserSettings,
  ScratchpadData,
  ApiCollection,
  ApiRequest,
  Environment,
  WebhookSession,
} from '../types';

const STORAGE_KEY = 'devdesk_workspace_v2';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  autoSave: true,
  confirmDestructive: true,
  trackHistory: true,
};

const EMPTY_SCRATCHPAD: ScratchpadData = {
  content: '',
  isPinned: false,
  lastSaved: new Date().toISOString(),
};

// Default Environments for Phase 2
export const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'env-dev',
    name: 'Development',
    description: 'Local development environment with mock endpoints',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [
      {
        id: 'var-1',
        key: 'base_url',
        value: 'https://jsonplaceholder.typicode.com',
        isSecret: false,
        enabled: true,
      },
      {
        id: 'var-2',
        key: 'api_key',
        value: 'dev_desk_secret_key_8829',
        isSecret: true,
        enabled: true,
      },
      {
        id: 'var-3',
        key: 'version',
        value: 'v1',
        isSecret: false,
        enabled: true,
      },
    ],
  },
  {
    id: 'env-staging',
    name: 'Staging',
    description: 'Pre-production staging cluster',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [
      {
        id: 'var-4',
        key: 'base_url',
        value: 'https://httpbin.org',
        isSecret: false,
        enabled: true,
      },
      {
        id: 'var-5',
        key: 'api_key',
        value: 'stage_secret_key_991823',
        isSecret: true,
        enabled: true,
      },
      {
        id: 'var-6',
        key: 'version',
        value: 'v1',
        isSecret: false,
        enabled: true,
      },
    ],
  },
];

// Default Collections for Phase 2
export const DEFAULT_COLLECTIONS: ApiCollection[] = [
  {
    id: 'col-jsonplaceholder',
    name: 'JSONPlaceholder API',
    description: 'Fake online REST API for testing and prototyping',
    order: 0,
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-httpbin',
    name: 'HTTPBin Diagnostics',
    description: 'HTTP request & response service for debugging methods and headers',
    order: 1,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default API Requests for Phase 2
export const DEFAULT_API_REQUESTS: ApiRequest[] = [
  {
    id: 'req-get-posts',
    collectionId: 'col-jsonplaceholder',
    name: 'Get All Posts',
    description: 'Retrieve a list of public demo posts',
    method: 'GET',
    url: '{{base_url}}/posts',
    params: [
      { id: 'p-1', key: '_limit', value: '5', enabled: true },
      { id: 'p-2', key: '_page', value: '1', enabled: true },
    ],
    headers: [
      { id: 'h-1', key: 'Accept', value: 'application/json', enabled: true },
    ],
    body: {
      type: 'none',
      rawText: '',
      jsonContent: '',
      formParams: [],
      multipartParams: [],
    },
    auth: {
      type: 'none',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'req-create-post',
    collectionId: 'col-jsonplaceholder',
    name: 'Create New Post',
    description: 'POST sample JSON record to public demo endpoint',
    method: 'POST',
    url: '{{base_url}}/posts',
    params: [],
    headers: [
      { id: 'h-2', key: 'Content-Type', value: 'application/json; charset=UTF-8', enabled: true },
    ],
    body: {
      type: 'json',
      rawText: '',
      jsonContent: JSON.stringify(
        {
          title: 'DevDesk Phase 2 Launch',
          body: 'All-in-one developer workspace with full API client and developer tools.',
          userId: 1,
        },
        null,
        2
      ),
      formParams: [],
      multipartParams: [],
    },
    auth: {
      type: 'bearer',
      bearerToken: '{{api_key}}',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'req-httpbin-headers',
    collectionId: 'col-httpbin',
    name: 'Inspect Request Headers',
    description: 'Echoes back all HTTP headers sent by the client',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    params: [],
    headers: [
      { id: 'h-3', key: 'X-DevDesk-Client', value: 'Phase-2', enabled: true },
    ],
    body: {
      type: 'none',
      rawText: '',
      jsonContent: '',
      formParams: [],
      multipartParams: [],
    },
    auth: {
      type: 'none',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default Webhook Session
export const DEFAULT_WEBHOOK_SESSIONS: WebhookSession[] = [
  {
    id: 'wh-session-default',
    name: 'Local Inspection Session',
    token: 'wh_local_' + Math.random().toString(36).substring(2, 8),
    events: [],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_WORKSPACE: WorkspaceData = {
  tasks: [],
  snippets: [],
  projects: [],
  scratchpad: EMPTY_SCRATCHPAD,
  favorites: [],
  history: [],
  settings: DEFAULT_SETTINGS,
  version: 4,

  // Phase 2
  apiCollections: DEFAULT_COLLECTIONS,
  apiRequests: DEFAULT_API_REQUESTS,
  apiHistory: [],
  environments: DEFAULT_ENVIRONMENTS,
  activeEnvironmentId: 'env-dev',
  webhookSessions: DEFAULT_WEBHOOK_SESSIONS,
  activeWebhookSessionId: 'wh-session-default',
};

export function migrateWorkspaceData(parsed: any): WorkspaceData {
  if (!parsed || typeof parsed !== 'object') {
    return INITIAL_WORKSPACE;
  }

  const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };

  return {
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    snippets: Array.isArray(parsed.snippets) ? parsed.snippets : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    scratchpad:
      parsed.scratchpad && typeof parsed.scratchpad.content === 'string'
        ? parsed.scratchpad
        : EMPTY_SCRATCHPAD,
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
    settings,
    version: 4,

    // Phase 2 items
    apiCollections: Array.isArray(parsed.apiCollections) && parsed.apiCollections.length > 0
      ? parsed.apiCollections
      : DEFAULT_COLLECTIONS,
    apiRequests: Array.isArray(parsed.apiRequests) && parsed.apiRequests.length > 0
      ? parsed.apiRequests
      : DEFAULT_API_REQUESTS,
    apiHistory: Array.isArray(parsed.apiHistory) ? parsed.apiHistory : [],
    environments: Array.isArray(parsed.environments) && parsed.environments.length > 0
      ? parsed.environments
      : DEFAULT_ENVIRONMENTS,
    activeEnvironmentId: parsed.activeEnvironmentId || 'env-dev',
    webhookSessions: Array.isArray(parsed.webhookSessions) && parsed.webhookSessions.length > 0
      ? parsed.webhookSessions
      : DEFAULT_WEBHOOK_SESSIONS,
    activeWebhookSessionId: parsed.activeWebhookSessionId || 'wh-session-default',
  };
}

export function loadWorkspaceData(): WorkspaceData {
  try {
    // Try v2 storage key first, then fallback to v1 for migration
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('devdesk_workspace_v1');
    }

    if (!raw) {
      saveWorkspaceData(INITIAL_WORKSPACE);
      return INITIAL_WORKSPACE;
    }

    const parsed = JSON.parse(raw);
    return migrateWorkspaceData(parsed);
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

export function exportWorkspaceJSON(data: WorkspaceData, includeSecrets = false): string {
  // If secrets should not be exported, sanitize environment secret values
  if (!includeSecrets) {
    const sanitizedEnvironments = data.environments.map((env) => ({
      ...env,
      variables: env.variables.map((v) =>
        v.isSecret ? { ...v, value: '••••••••••••' } : v
      ),
    }));

    const sanitizedData = {
      ...data,
      environments: sanitizedEnvironments,
    };
    return JSON.stringify(sanitizedData, null, 2);
  }

  return JSON.stringify(data, null, 2);
}

export function downloadWorkspaceBackup(data: WorkspaceData, includeSecrets = false): void {
  const json = exportWorkspaceJSON(data, includeSecrets);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `devdesk-workspace-backup-${date}${includeSecrets ? '-with-secrets' : ''}.json`;
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
    scratchpad:
      parsed.scratchpad && typeof parsed.scratchpad.content === 'string'
        ? parsed.scratchpad
        : EMPTY_SCRATCHPAD,
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    version: 4,

    // Phase 2 items
    apiCollections: Array.isArray(parsed.apiCollections) ? parsed.apiCollections : DEFAULT_COLLECTIONS,
    apiRequests: Array.isArray(parsed.apiRequests) ? parsed.apiRequests : DEFAULT_API_REQUESTS,
    apiHistory: Array.isArray(parsed.apiHistory) ? parsed.apiHistory : [],
    environments: Array.isArray(parsed.environments) ? parsed.environments : DEFAULT_ENVIRONMENTS,
    activeEnvironmentId: parsed.activeEnvironmentId || 'env-dev',
    webhookSessions: Array.isArray(parsed.webhookSessions) ? parsed.webhookSessions : DEFAULT_WEBHOOK_SESSIONS,
    activeWebhookSessionId: parsed.activeWebhookSessionId || 'wh-session-default',
  };
}

export function clearWorkspaceStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('devdesk_workspace_v1');
}
