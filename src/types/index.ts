import type { SupportedLocale } from '../services/i18n/translations';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  confirmDestructive: boolean;
  trackHistory: boolean;
  locale?: SupportedLocale;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  projectId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  projectId?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed' | 'archived';
  isFavorite: boolean;
  color: string;
  links: ProjectLink[];
  notes?: string;
  gitRepositoryId?: string;
  gitRepoUrl?: string;
  gitBranch?: string;
  logSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScratchpadData {
  content: string;
  isPinned: boolean;
  lastSaved: string;
}

export type HistoryItemType = 'tool' | 'snippet' | 'project';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  targetId: string;
  title: string;
  subtitle?: string;
  timestamp: string; // ISO string
}

export interface FavoriteItem {
  id: string;
  type: 'tool' | 'snippet' | 'project';
  targetId: string;
  title: string;
  subtitle?: string;
  addedAt: string;
}

export * from './api';
export * from './git';
export * from './ssh';
export * from './logs';
export * from './config';

export type ViewType =
  | 'dashboard'
  | 'docs'
  | 'scratchpad'
  | 'tasks'
  | 'projects'
  | 'project-detail'
  | 'snippets'
  | 'all-tools'
  | 'tool'
  | 'favorites'
  | 'recent'
  | 'settings'
  | 'api-client'
  | 'collections'
  | 'environments'
  | 'webhooks'
  | 'http-inspector'
  | 'graphql'
  | 'websocket'
  | 'sse'
  | 'mock-server'
  | 'openapi-explorer'
  | 'git'
  | 'ssh'
  | 'logs'
  | 'yaml-toolkit';

import type {
  ApiCollection,
  ApiRequest,
  ApiHistoryItem,
  Environment,
  WebhookSession,
  GraphQLRequest,
  WebSocketConnection,
  SseConnection,
  MockEndpoint,
  MockRequestLog,
  OpenApiDocumentRecord,
} from './api';
import type { GitRepository, GitSettings } from './git';
import type { SSHProfile } from './ssh';
import type { LogEntry } from './logs';
import type { EnvFileRecord } from './config';

export interface WorkspaceData {
  tasks: Task[];
  snippets: Snippet[];
  projects: Project[];
  scratchpad: ScratchpadData;
  favorites: FavoriteItem[];
  history: HistoryItem[];
  settings: UserSettings;
  version: number;

  // Phase 2: Developer Integrations
  apiCollections: ApiCollection[];
  apiRequests: ApiRequest[];
  apiHistory: ApiHistoryItem[];
  environments: Environment[];
  activeEnvironmentId?: string;
  webhookSessions: WebhookSession[];
  activeWebhookSessionId?: string;

  // Phase 3: Real-Time, GraphQL, Mock Server & OpenAPI
  graphqlQueries?: GraphQLRequest[];
  webSocketConnections?: WebSocketConnection[];
  sseConnections?: SseConnection[];
  mockEndpoints?: MockEndpoint[];
  mockLogs?: MockRequestLog[];
  openApiDocuments?: OpenApiDocumentRecord[];

  // Phase 4: Git & Version Control
  gitRepositories?: GitRepository[];
  activeGitRepoId?: string | null;
  gitSettings?: GitSettings;

  // Phase 5: Essential Developer Integrations
  sshProfiles?: SSHProfile[];
  logEntries?: LogEntry[];
  envFiles?: EnvFileRecord[];
}
