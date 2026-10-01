import { createContext } from 'react';
import type {
  WorkspaceData,
  UserSettings,
  Task,
  Snippet,
  Project,
  ViewType,
  ApiCollection,
  ApiRequest,
  ApiTab,
  ApiResponse,
  ApiHistoryItem,
  Environment,
  WebhookSession,
  WebhookEvent,
  MockEndpoint,
  MockRequestLog,
  GraphQLRequest,
  WebSocketConnection,
  SseConnection,
  OpenApiDocumentRecord,
} from '../types';

export interface WorkspaceContextType {
  data: WorkspaceData;
  activeView: ViewType;
  selectedToolId: string | null;
  selectedProjectId: string | null;
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsOpen: boolean;
  isPrivacyModalOpen: boolean;
  scratchpadSaveStatus: 'saved' | 'saving' | 'idle';
  setActiveView: (view: ViewType, options?: { toolId?: string; projectId?: string }) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  setIsSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsPrivacyModalOpen: (open: boolean) => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Snippets
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => Snippet;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  duplicateSnippet: (id: string) => void;
  toggleFavoriteSnippet: (id: string) => void;

  // Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;

  // Scratchpad
  updateScratchpad: (content: string, isPinned?: boolean) => void;
  clearScratchpad: () => void;

  // Tools & Favorites
  isToolFavorite: (toolId: string) => boolean;
  toggleFavoriteTool: (toolId: string, title: string, subtitle?: string) => void;
  removeFavorite: (id: string) => void;

  // History
  recordHistory: (type: 'tool' | 'snippet' | 'project', targetId: string, title: string, subtitle?: string) => void;
  clearHistory: () => void;

  // Settings & Storage
  updateSettings: (updates: Partial<UserSettings>) => void;
  setWorkspaceData: (newData: WorkspaceData) => void;
  resetToDefaults: () => void;

  // Phase 2: API Client & Tabs
  apiTabs: ApiTab[];
  activeTabId: string;
  activeTab: ApiTab | undefined;
  activeEnvironment: Environment | undefined;
  setActiveEnvironmentId: (id: string) => void;
  setActiveTabId: (tabId: string) => void;
  openRequestInTab: (request: ApiRequest) => void;
  createNewTab: (initial?: Partial<ApiRequest>) => void;
  closeTab: (tabId: string) => void;
  updateTabRequest: (tabId: string, updates: Partial<ApiRequest>) => void;
  updateTabResponse: (tabId: string, response: ApiResponse | null) => void;
  setTabLoading: (tabId: string, isLoading: boolean) => void;

  // Phase 2: Collections & Requests
  addCollection: (col: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => ApiCollection;
  updateCollection: (id: string, updates: Partial<ApiCollection>) => void;
  deleteCollection: (id: string) => void;
  addApiRequest: (req: Omit<ApiRequest, 'id' | 'createdAt' | 'updatedAt'>) => ApiRequest;
  updateApiRequest: (id: string, updates: Partial<ApiRequest>) => void;
  deleteApiRequest: (id: string) => void;
  duplicateApiRequest: (id: string) => ApiRequest | null;

  // Phase 2: Environments
  addEnvironment: (env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => Environment;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  duplicateEnvironment: (id: string) => Environment | null;

  // Phase 2: API History
  addApiHistoryItem: (item: ApiHistoryItem) => void;
  clearApiHistory: () => void;
  deleteApiHistoryItem: (id: string) => void;

  // Phase 2: Webhooks
  addWebhookEvent: (sessionId: string, event: Omit<WebhookEvent, 'id' | 'timestamp'>) => void;
  clearWebhookEvents: (sessionId: string) => void;
  createWebhookSession: (name: string) => WebhookSession;

  // Phase 3: Mock Server
  mockEndpoints: MockEndpoint[];
  mockLogs: MockRequestLog[];
  addMockEndpoint: (endpoint: Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>) => MockEndpoint;
  updateMockEndpoint: (id: string, updates: Partial<MockEndpoint>) => void;
  deleteMockEndpoint: (id: string) => void;
  duplicateMockEndpoint: (id: string) => MockEndpoint | null;
  addMockLog: (log: MockRequestLog) => void;
  clearMockLogs: () => void;

  // Phase 3: GraphQL Explorer
  graphqlQueries: GraphQLRequest[];
  addGraphQLRequest: (req: Omit<GraphQLRequest, 'id' | 'createdAt' | 'updatedAt'>) => GraphQLRequest;
  updateGraphQLRequest: (id: string, updates: Partial<GraphQLRequest>) => void;
  deleteGraphQLRequest: (id: string) => void;

  // Phase 3: WebSocket Client
  webSocketConnections: WebSocketConnection[];
  addWebSocketConnection: (conn: Omit<WebSocketConnection, 'id' | 'createdAt' | 'updatedAt'>) => WebSocketConnection;
  updateWebSocketConnection: (id: string, updates: Partial<WebSocketConnection>) => void;
  deleteWebSocketConnection: (id: string) => void;

  // Phase 3: Server-Sent Events (SSE) Client
  sseConnections: SseConnection[];
  addSseConnection: (conn: Omit<SseConnection, 'id' | 'createdAt' | 'updatedAt'>) => SseConnection;
  updateSseConnection: (id: string, updates: Partial<SseConnection>) => void;
  deleteSseConnection: (id: string) => void;

  // Phase 3: OpenAPI / Swagger Explorer
  openApiDocuments: OpenApiDocumentRecord[];
  addOpenApiDocument: (doc: Omit<OpenApiDocumentRecord, 'id' | 'importedAt'>) => OpenApiDocumentRecord;
  deleteOpenApiDocument: (id: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
