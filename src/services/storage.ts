import type {
  WorkspaceData,
  UserSettings,
  ScratchpadData,
  ApiCollection,
  ApiRequest,
  Environment,
  WebhookSession,
  MockEndpoint,
  GraphQLRequest,
  WebSocketConnection,
  SseConnection,
  OpenApiDocumentRecord,
  GitSettings,
} from '../types';
import { createDemoRepository } from './git';
import { INITIAL_DEMO_SSH_PROFILES } from './ssh/sshService';
import { INITIAL_DEMO_LOGS } from './logs/logService';
import { INITIAL_DEMO_ENV_FILES } from './config/envFileService';
import { saveSnapshotToDb } from './storage/indexedDbStorage';
import { pruneApiHistoryIfExceeded } from './storage/storageQuotaService';

const STORAGE_KEY = 'devdesk_workspace_v3';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  autoSave: true,
  confirmDestructive: true,
  trackHistory: true,
  locale: 'en',
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

// Phase 3: Default Mock Endpoints
export const DEFAULT_MOCK_ENDPOINTS: MockEndpoint[] = [
  {
    id: 'mock-users',
    name: 'Get All Users',
    method: 'GET',
    path: '/api/v1/users',
    description: 'Simulates listing active user profiles',
    enabled: true,
    scenarios: [
      {
        id: 'sc-users-200',
        name: '200 OK (3 Users)',
        status: 200,
        statusText: 'OK',
        headers: [{ id: 'mh-1', key: 'Content-Type', value: 'application/json', enabled: true }],
        contentType: 'application/json',
        body: JSON.stringify(
          [
            { id: 'usr_1', name: 'Alex Rivera', role: 'Staff Engineer', status: 'active' },
            { id: 'usr_2', name: 'Sam Chen', role: 'Product Architect', status: 'active' },
            { id: 'usr_3', name: 'Jordan Taylor', role: 'DevOps Lead', status: 'away' },
          ],
          null,
          2
        ),
        delayMs: 60,
        isDefault: true,
      },
      {
        id: 'sc-users-500',
        name: '500 Server Error',
        status: 500,
        statusText: 'Internal Server Error',
        headers: [{ id: 'mh-2', key: 'Content-Type', value: 'application/json', enabled: true }],
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection pool exhausted', code: 'DB_OVERLOAD' }, null, 2),
        delayMs: 200,
        isDefault: false,
      },
    ],
    activeScenarioId: 'sc-users-200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-detail',
    name: 'Get User By ID',
    method: 'GET',
    path: '/api/v1/users/:id',
    description: 'Dynamic route parameter matching user detail',
    enabled: true,
    scenarios: [
      {
        id: 'sc-user-detail-200',
        name: '200 Found User',
        status: 200,
        statusText: 'OK',
        headers: [{ id: 'mh-3', key: 'Content-Type', value: 'application/json', enabled: true }],
        contentType: 'application/json',
        body: JSON.stringify(
          {
            id: 'usr_1',
            name: 'Alex Rivera',
            email: 'alex@devdesk.local',
            tier: 'enterprise',
            created_at: '2026-01-15T08:00:00Z',
          },
          null,
          2
        ),
        delayMs: 50,
        isDefault: true,
      },
      {
        id: 'sc-user-detail-404',
        name: '404 Not Found',
        status: 404,
        statusText: 'Not Found',
        headers: [{ id: 'mh-4', key: 'Content-Type', value: 'application/json', enabled: true }],
        contentType: 'application/json',
        body: JSON.stringify({ error: 'User does not exist in workspace', code: 'USER_NOT_FOUND' }, null, 2),
        delayMs: 40,
        isDefault: false,
      },
    ],
    activeScenarioId: 'sc-user-detail-200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Phase 3: Default GraphQL Requests
export const DEFAULT_GRAPHQL_REQUESTS: GraphQLRequest[] = [
  {
    id: 'gql-countries-demo',
    name: 'Countries & Continents',
    endpoint: 'https://countries.trevorblades.com/graphql',
    query: `query GetCountries($filter: CountryFilterInput) {
  countries(filter: $filter) {
    code
    name
    capital
    currency
    emoji
  }
}`,
    variables: JSON.stringify(
      {
        filter: {
          code: { in: ['US', 'GB', 'DE', 'JP', 'FR'] },
        },
      },
      null,
      2
    ),
    headers: [{ id: 'gh-1', key: 'Content-Type', value: 'application/json', enabled: true }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Phase 3: Default WebSocket Connections
export const DEFAULT_WEBSOCKET_CONNECTIONS: WebSocketConnection[] = [
  {
    id: 'ws-echo-demo',
    name: 'WebSocket Echo Server',
    url: 'wss://echo.websocket.org',
    protocols: [],
    headers: [],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Phase 3: Default SSE Connections
export const DEFAULT_SSE_CONNECTIONS: SseConnection[] = [
  {
    id: 'sse-httpbin-stream',
    name: 'HTTPBin Stream (5 Events)',
    url: 'https://httpbin.org/stream/5',
    headers: [{ id: 'sseh-1', key: 'Accept', value: 'text/event-stream', enabled: true }],
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Phase 3: Default OpenAPI Documents
export const DEFAULT_OPENAPI_DOCUMENTS: OpenApiDocumentRecord[] = [];

// Phase 4: Default Git Settings
export const DEFAULT_GIT_SETTINGS: GitSettings = {
  defaultBranch: 'main',
  defaultDiffMode: 'unified',
  confirmDestructive: true,
  authorName: 'Developer',
  authorEmail: 'developer@devdesk.local',
  autoFetchIntervalMinutes: 0,
};

export const INITIAL_WORKSPACE: WorkspaceData = {
  tasks: [],
  snippets: [],
  projects: [],
  scratchpad: EMPTY_SCRATCHPAD,
  favorites: [],
  history: [],
  settings: DEFAULT_SETTINGS,
  version: 5,

  // Phase 2
  apiCollections: DEFAULT_COLLECTIONS,
  apiRequests: DEFAULT_API_REQUESTS,
  apiHistory: [],
  environments: DEFAULT_ENVIRONMENTS,
  activeEnvironmentId: 'env-dev',
  webhookSessions: DEFAULT_WEBHOOK_SESSIONS,
  activeWebhookSessionId: 'wh-session-default',

  // Phase 3
  graphqlQueries: DEFAULT_GRAPHQL_REQUESTS,
  webSocketConnections: DEFAULT_WEBSOCKET_CONNECTIONS,
  sseConnections: DEFAULT_SSE_CONNECTIONS,
  mockEndpoints: DEFAULT_MOCK_ENDPOINTS,
  mockLogs: [],
  openApiDocuments: DEFAULT_OPENAPI_DOCUMENTS,

  // Phase 4: Git & Version Control
  gitRepositories: [createDemoRepository()],
  activeGitRepoId: 'repo-demo-devdesk',
  gitSettings: DEFAULT_GIT_SETTINGS,

  // Phase 5: Essential Developer Integrations
  sshProfiles: INITIAL_DEMO_SSH_PROFILES,
  logEntries: INITIAL_DEMO_LOGS,
  envFiles: INITIAL_DEMO_ENV_FILES,
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
    version: 5,

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

    // Phase 3 items
    graphqlQueries: Array.isArray(parsed.graphqlQueries) && parsed.graphqlQueries.length > 0
      ? parsed.graphqlQueries
      : DEFAULT_GRAPHQL_REQUESTS,
    webSocketConnections: Array.isArray(parsed.webSocketConnections) && parsed.webSocketConnections.length > 0
      ? parsed.webSocketConnections
      : DEFAULT_WEBSOCKET_CONNECTIONS,
    sseConnections: Array.isArray(parsed.sseConnections) && parsed.sseConnections.length > 0
      ? parsed.sseConnections
      : DEFAULT_SSE_CONNECTIONS,
    mockEndpoints: Array.isArray(parsed.mockEndpoints) && parsed.mockEndpoints.length > 0
      ? parsed.mockEndpoints
      : DEFAULT_MOCK_ENDPOINTS,
    mockLogs: Array.isArray(parsed.mockLogs) ? parsed.mockLogs : [],
    openApiDocuments: Array.isArray(parsed.openApiDocuments) ? parsed.openApiDocuments : [],

    // Phase 4: Git & Version Control
    gitRepositories: Array.isArray(parsed.gitRepositories) && parsed.gitRepositories.length > 0
      ? parsed.gitRepositories
      : [createDemoRepository()],
    activeGitRepoId: parsed.activeGitRepoId || 'repo-demo-devdesk',
    gitSettings: { ...DEFAULT_GIT_SETTINGS, ...(parsed.gitSettings || {}) },

    // Phase 5: Essential Developer Integrations
    sshProfiles: Array.isArray(parsed.sshProfiles) && parsed.sshProfiles.length > 0
      ? parsed.sshProfiles
      : INITIAL_DEMO_SSH_PROFILES,
    logEntries: Array.isArray(parsed.logEntries) && parsed.logEntries.length > 0
      ? parsed.logEntries
      : INITIAL_DEMO_LOGS,
    envFiles: Array.isArray(parsed.envFiles) && parsed.envFiles.length > 0
      ? parsed.envFiles
      : INITIAL_DEMO_ENV_FILES,
  };
}

export function loadWorkspaceData(): WorkspaceData {
  try {
    // Try v3 storage key first, then fallback to v2 and v1 for migration
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('devdesk_workspace_v2');
    }
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
    console.warn('LocalStorage quota limit reached, attempting automatic LRU history pruning...', err);
    try {
      const pruned = pruneApiHistoryIfExceeded(data, 25);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch {
      saveSnapshotToDb('Emergency Quota Recovery Checkpoint', data).catch(() => {});
      console.error('Critical storage quota exceeded: saved emergency snapshot to IndexedDB.');
    }
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
  let parsed = JSON.parse(jsonStr);
  // Support verified export envelope format
  if (parsed && parsed.format === 'devdesk-workspace' && parsed.payload) {
    parsed = parsed.payload;
  }

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
    version: 5,

    // Phase 2 items
    apiCollections: Array.isArray(parsed.apiCollections) ? parsed.apiCollections : DEFAULT_COLLECTIONS,
    apiRequests: Array.isArray(parsed.apiRequests) ? parsed.apiRequests : DEFAULT_API_REQUESTS,
    apiHistory: Array.isArray(parsed.apiHistory) ? parsed.apiHistory : [],
    environments: Array.isArray(parsed.environments) ? parsed.environments : DEFAULT_ENVIRONMENTS,
    activeEnvironmentId: parsed.activeEnvironmentId || 'env-dev',
    webhookSessions: Array.isArray(parsed.webhookSessions) ? parsed.webhookSessions : DEFAULT_WEBHOOK_SESSIONS,
    activeWebhookSessionId: parsed.activeWebhookSessionId || 'wh-session-default',

    // Phase 3 items
    graphqlQueries: Array.isArray(parsed.graphqlQueries) ? parsed.graphqlQueries : DEFAULT_GRAPHQL_REQUESTS,
    webSocketConnections: Array.isArray(parsed.webSocketConnections) ? parsed.webSocketConnections : DEFAULT_WEBSOCKET_CONNECTIONS,
    sseConnections: Array.isArray(parsed.sseConnections) ? parsed.sseConnections : DEFAULT_SSE_CONNECTIONS,
    mockEndpoints: Array.isArray(parsed.mockEndpoints) ? parsed.mockEndpoints : DEFAULT_MOCK_ENDPOINTS,
    mockLogs: Array.isArray(parsed.mockLogs) ? parsed.mockLogs : [],
    openApiDocuments: Array.isArray(parsed.openApiDocuments) ? parsed.openApiDocuments : [],

    // Phase 4 items
    gitRepositories: Array.isArray(parsed.gitRepositories) ? parsed.gitRepositories : [createDemoRepository()],
    activeGitRepoId: parsed.activeGitRepoId || 'repo-demo-devdesk',
    gitSettings: { ...DEFAULT_GIT_SETTINGS, ...(parsed.gitSettings || {}) },

    // Phase 5 items
    sshProfiles: Array.isArray(parsed.sshProfiles) ? parsed.sshProfiles : INITIAL_DEMO_SSH_PROFILES,
    logEntries: Array.isArray(parsed.logEntries) ? parsed.logEntries : INITIAL_DEMO_LOGS,
    envFiles: Array.isArray(parsed.envFiles) ? parsed.envFiles : INITIAL_DEMO_ENV_FILES,
  };
}

export function clearWorkspaceStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('devdesk_workspace_v2');
  localStorage.removeItem('devdesk_workspace_v1');
}
