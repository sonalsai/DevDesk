import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  WorkspaceData,
  UserSettings,
  Task,
  Snippet,
  Project,
  FavoriteItem,
  HistoryItem,
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
  GitRepository,
  GitSettings,
} from '../types';
import {
  loadWorkspaceData,
  saveWorkspaceData,
  clearWorkspaceStorage,
  INITIAL_WORKSPACE,
  DEFAULT_API_REQUESTS,
} from '../services/storage';
import {
  createInitialNavigationState,
  pushNavigation,
  goBackNavigation,
  goForwardNavigation,
  canGoBack,
  canGoForward,
  type NavigationState,
} from '../services/navigation';
import {
  stageFile,
  unstageFile,
  stageAll,
  unstageAll,
  toggleHunkStage,
  discardFileChanges,
  discardAllUnstaged,
  commitChanges,
  validateCommit,
  createBranch,
  switchBranch,
  renameBranch,
  deleteBranch,
  mergeBranch,
  resolveFileConflict,
  createStash,
  applyStash,
  popStash,
  dropStash,
  createTag,
  deleteTag,
  addRemote,
  editRemote,
  removeRemote,
  fetchRemote,
  pullRemote,
  pushRemote,
} from '../services/git';
import { trimLogsToRetention } from '../services/logs';
import { parseEnvFile } from '../services/config';
import type { SSHProfile, LogEntry, EnvFileRecord } from '../types';
import { WorkspaceContext } from './workspaceContextDef';

function createDefaultTab(request?: ApiRequest): ApiTab {
  const baseReq: ApiRequest = request || {
    id: `req-new-${Date.now()}`,
    name: 'Untitled Request',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    params: [],
    headers: [
      { id: 'h-def-1', key: 'Accept', value: 'application/json', enabled: true },
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
  };

  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    requestId: request?.id,
    title: baseReq.name,
    isDirty: false,
    request: baseReq,
    response: null,
    isLoading: false,
  };
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<WorkspaceData>(() => loadWorkspaceData());
  const [activeView, setActiveViewState] = useState<ViewType>('dashboard');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [scratchpadSaveStatus, setScratchpadSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  // Phase 2: API Client Tabs
  const [apiTabs, setApiTabs] = useState<ApiTab[]>(() => {
    const firstReq = (data.apiRequests && data.apiRequests.length > 0)
      ? data.apiRequests[0]
      : DEFAULT_API_REQUESTS[0];
    const initialTab = createDefaultTab(firstReq);
    return [initialTab];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => apiTabs[0]?.id || '');

  // Sync to localStorage
  useEffect(() => {
    saveWorkspaceData(data);
  }, [data]);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    const theme = data.settings.theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [data.settings.theme]);

  // Navigation history stack for Back/Forward navigation
  const [navState, setNavState] = useState<NavigationState>(createInitialNavigationState);

  const canGoBackVal = canGoBack(navState);
  const canGoForwardVal = canGoForward(navState);

  const setActiveView = useCallback(
    (view: ViewType, options?: { toolId?: string; projectId?: string }) => {
      setActiveViewState(view);
      setSelectedToolId(options?.toolId ?? null);
      setSelectedProjectId(options?.projectId ?? null);

      setNavState((prev) =>
        pushNavigation(prev, {
          view,
          toolId: options?.toolId,
          projectId: options?.projectId,
        })
      );

      window.scrollTo(0, 0);
    },
    []
  );

  const goBack = useCallback(() => {
    setNavState((prev) => {
      const { nextState, targetItem } = goBackNavigation(prev);
      if (targetItem) {
        setActiveViewState(targetItem.view);
        setSelectedToolId(targetItem.toolId ?? null);
        setSelectedProjectId(targetItem.projectId ?? null);
        window.scrollTo(0, 0);
      }
      return nextState;
    });
  }, []);

  const goForward = useCallback(() => {
    setNavState((prev) => {
      const { nextState, targetItem } = goForwardNavigation(prev);
      if (targetItem) {
        setActiveViewState(targetItem.view);
        setSelectedToolId(targetItem.toolId ?? null);
        setSelectedProjectId(targetItem.projectId ?? null);
        window.scrollTo(0, 0);
      }
      return nextState;
    });
  }, []);

  // History tracking
  const recordHistory = useCallback(
    (type: 'tool' | 'snippet' | 'project', targetId: string, title: string, subtitle?: string) => {
      if (!data.settings.trackHistory) return;
      setData((prev) => {
        const filtered = prev.history.filter((h) => !(h.type === type && h.targetId === targetId));
        const newItem: HistoryItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          type,
          targetId,
          title,
          subtitle,
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          history: [newItem, ...filtered].slice(0, 50),
        };
      });
    },
    [data.settings.trackHistory]
  );

  const clearHistory = useCallback(() => {
    setData((prev) => ({ ...prev, history: [] }));
  }, []);

  // Tasks
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'done' ? 'todo' : 'done';
        return {
          ...t,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Snippets
  const addSnippet = useCallback((snippetData: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Snippet => {
    const now = new Date().toISOString();
    const newSnippet: Snippet = {
      ...snippetData,
      id: `snip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      snippets: [newSnippet, ...prev.snippets],
    }));
    recordHistory('snippet', newSnippet.id, newSnippet.title, newSnippet.language);
    return newSnippet;
  }, [recordHistory]);

  const updateSnippet = useCallback((id: string, updates: Partial<Snippet>) => {
    setData((prev) => ({
      ...prev,
      snippets: prev.snippets.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const deleteSnippet = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      snippets: prev.snippets.filter((s) => s.id !== id),
      favorites: prev.favorites.filter((f) => !(f.type === 'snippet' && f.targetId === id)),
      history: prev.history.filter((h) => !(h.type === 'snippet' && h.targetId === id)),
    }));
  }, []);

  const duplicateSnippet = useCallback((id: string) => {
    setData((prev) => {
      const orig = prev.snippets.find((s) => s.id === id);
      if (!orig) return prev;
      const now = new Date().toISOString();
      const duplicate: Snippet = {
        ...orig,
        id: `snip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `${orig.title} (Copy)`,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...prev,
        snippets: [duplicate, ...prev.snippets],
      };
    });
  }, []);

  const toggleFavoriteSnippet = useCallback((id: string) => {
    setData((prev) => {
      const snippet = prev.snippets.find((s) => s.id === id);
      if (!snippet) return prev;
      const willBeFav = !snippet.isFavorite;

      const updatedSnippets = prev.snippets.map((s) =>
        s.id === id ? { ...s, isFavorite: willBeFav, updatedAt: new Date().toISOString() } : s
      );

      let updatedFavorites = [...prev.favorites];
      if (willBeFav) {
        if (!updatedFavorites.some((f) => f.type === 'snippet' && f.targetId === id)) {
          updatedFavorites.push({
            id: `fav-snip-${id}`,
            type: 'snippet',
            targetId: id,
            title: snippet.title,
            subtitle: `${snippet.language} snippet`,
            addedAt: new Date().toISOString(),
          });
        }
      } else {
        updatedFavorites = updatedFavorites.filter(
          (f) => !(f.type === 'snippet' && f.targetId === id)
        );
      }

      return {
        ...prev,
        snippets: updatedSnippets,
        favorites: updatedFavorites,
      };
    });
  }, []);

  // Projects
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    recordHistory('project', newProject.id, newProject.name, `${newProject.status} project`);
    return newProject;
  }, [recordHistory]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      favorites: prev.favorites.filter((f) => !(f.type === 'project' && f.targetId === id)),
      history: prev.history.filter((h) => !(h.type === 'project' && h.targetId === id)),
      tasks: prev.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
      snippets: prev.snippets.map((s) => (s.projectId === id ? { ...s, projectId: undefined } : s)),
    }));
  }, []);

  const toggleFavoriteProject = useCallback((id: string) => {
    setData((prev) => {
      const proj = prev.projects.find((p) => p.id === id);
      if (!proj) return prev;
      const willBeFav = !proj.isFavorite;

      const updatedProjects = prev.projects.map((p) =>
        p.id === id ? { ...p, isFavorite: willBeFav, updatedAt: new Date().toISOString() } : p
      );

      let updatedFavorites = [...prev.favorites];
      if (willBeFav) {
        if (!updatedFavorites.some((f) => f.type === 'project' && f.targetId === id)) {
          updatedFavorites.push({
            id: `fav-proj-${id}`,
            type: 'project',
            targetId: id,
            title: proj.name,
            subtitle: `${proj.status} project`,
            addedAt: new Date().toISOString(),
          });
        }
      } else {
        updatedFavorites = updatedFavorites.filter(
          (f) => !(f.type === 'project' && f.targetId === id)
        );
      }

      return {
        ...prev,
        projects: updatedProjects,
        favorites: updatedFavorites,
      };
    });
  }, []);

  // Scratchpad
  const updateScratchpad = useCallback((content: string, isPinned?: boolean) => {
    setScratchpadSaveStatus('saving');
    setData((prev) => {
      const updated = {
        content,
        isPinned: isPinned !== undefined ? isPinned : prev.scratchpad.isPinned,
        lastSaved: new Date().toISOString(),
      };
      return {
        ...prev,
        scratchpad: updated,
      };
    });
    setTimeout(() => {
      setScratchpadSaveStatus('saved');
    }, 300);
  }, []);

  const clearScratchpad = useCallback(() => {
    updateScratchpad('');
  }, [updateScratchpad]);

  // Tools Favorites
  const isToolFavorite = useCallback(
    (toolId: string) => {
      return data.favorites.some((f) => f.type === 'tool' && f.targetId === toolId);
    },
    [data.favorites]
  );

  const toggleFavoriteTool = useCallback((toolId: string, title: string, subtitle?: string) => {
    setData((prev) => {
      const exists = prev.favorites.some((f) => f.type === 'tool' && f.targetId === toolId);
      if (exists) {
        return {
          ...prev,
          favorites: prev.favorites.filter((f) => !(f.type === 'tool' && f.targetId === toolId)),
        };
      } else {
        const newFav: FavoriteItem = {
          id: `fav-tool-${toolId}`,
          type: 'tool',
          targetId: toolId,
          title,
          subtitle,
          addedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          favorites: [...prev.favorites, newFav],
        };
      }
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setData((prev) => {
      const item = prev.favorites.find((f) => f.id === id);
      if (!item) return prev;

      let updatedSnippets = prev.snippets;
      let updatedProjects = prev.projects;

      if (item.type === 'snippet') {
        updatedSnippets = prev.snippets.map((s) =>
          s.id === item.targetId ? { ...s, isFavorite: false } : s
        );
      } else if (item.type === 'project') {
        updatedProjects = prev.projects.map((p) =>
          p.id === item.targetId ? { ...p, isFavorite: false } : p
        );
      }

      return {
        ...prev,
        snippets: updatedSnippets,
        projects: updatedProjects,
        favorites: prev.favorites.filter((f) => f.id !== id),
      };
    });
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const setWorkspaceData = useCallback((newData: WorkspaceData) => {
    setData(newData);
  }, []);

  const resetToDefaults = useCallback(() => {
    clearWorkspaceStorage();
    setData(INITIAL_WORKSPACE);
  }, []);

  // =========================================================================
  // PHASE 2: API Client & Environment State
  // =========================================================================

  const activeEnvironment = useMemo(() => {
    return (
      data.environments.find((e) => e.id === data.activeEnvironmentId) ||
      data.environments[0]
    );
  }, [data.environments, data.activeEnvironmentId]);

  const setActiveEnvironmentId = useCallback((id: string) => {
    setData((prev) => ({ ...prev, activeEnvironmentId: id }));
  }, []);

  const activeTab = useMemo(() => {
    return apiTabs.find((t) => t.id === activeTabId) || apiTabs[0];
  }, [apiTabs, activeTabId]);

  const openRequestInTab = useCallback((req: ApiRequest) => {
    setApiTabs((prev) => {
      const existing = prev.find((t) => t.requestId === req.id);
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }
      const newTab = createDefaultTab(req);
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
    setActiveView('api-client');
  }, [setActiveView]);

  const createNewTab = useCallback((initial?: Partial<ApiRequest>) => {
    const base = createDefaultTab();
    if (initial) {
      base.request = { ...base.request, ...initial };
      if (initial.name) base.title = initial.name;
    }
    setApiTabs((prev) => [...prev, base]);
    setActiveTabId(base.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setApiTabs((prev) => {
      if (prev.length <= 1) {
        // Keep at least one tab
        const fresh = createDefaultTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const updateTabRequest = useCallback((tabId: string, updates: Partial<ApiRequest>) => {
    setApiTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        const updatedReq = { ...tab.request, ...updates, updatedAt: new Date().toISOString() };
        return {
          ...tab,
          request: updatedReq,
          title: updates.name || tab.title,
          isDirty: true,
        };
      })
    );
  }, []);

  const updateTabResponse = useCallback((tabId: string, response: ApiResponse | null) => {
    setApiTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, response, isLoading: false } : tab))
    );
  }, []);

  const setTabLoading = useCallback((tabId: string, isLoading: boolean) => {
    setApiTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, isLoading } : tab))
    );
  }, []);

  // Collections & Requests
  const addCollection = useCallback(
    (colData: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt' | 'order'>): ApiCollection => {
      const now = new Date().toISOString();
      const newCol: ApiCollection = {
        ...colData,
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: data.apiCollections.length,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        ...prev,
        apiCollections: [...prev.apiCollections, newCol],
      }));
      return newCol;
    },
    [data.apiCollections.length]
  );

  const updateCollection = useCallback((id: string, updates: Partial<ApiCollection>) => {
    setData((prev) => ({
      ...prev,
      apiCollections: prev.apiCollections.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      apiCollections: prev.apiCollections.filter((c) => c.id !== id),
      apiRequests: prev.apiRequests.filter((r) => r.collectionId !== id),
    }));
  }, []);

  const addApiRequest = useCallback(
    (reqData: Omit<ApiRequest, 'id' | 'createdAt' | 'updatedAt'>): ApiRequest => {
      const now = new Date().toISOString();
      const newReq: ApiRequest = {
        ...reqData,
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        ...prev,
        apiRequests: [...prev.apiRequests, newReq],
      }));
      return newReq;
    },
    []
  );

  const updateApiRequest = useCallback((id: string, updates: Partial<ApiRequest>) => {
    setData((prev) => ({
      ...prev,
      apiRequests: prev.apiRequests.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));

    // If an open tab matches this requestId, sync it
    setApiTabs((prev) =>
      prev.map((t) =>
        t.requestId === id
          ? { ...t, request: { ...t.request, ...updates }, title: updates.name || t.title, isDirty: false }
          : t
      )
    );
  }, []);

  const deleteApiRequest = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      apiRequests: prev.apiRequests.filter((r) => r.id !== id),
    }));
  }, []);

  const duplicateApiRequest = useCallback(
    (id: string): ApiRequest | null => {
      const orig = data.apiRequests.find((r) => r.id === id);
      if (!orig) return null;
      const now = new Date().toISOString();
      const duplicate: ApiRequest = {
        ...orig,
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${orig.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        ...prev,
        apiRequests: [...prev.apiRequests, duplicate],
      }));
      return duplicate;
    },
    [data.apiRequests]
  );

  // Environments
  const addEnvironment = useCallback(
    (envData: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Environment => {
      const now = new Date().toISOString();
      const newEnv: Environment = {
        ...envData,
        id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        ...prev,
        environments: [...prev.environments, newEnv],
        activeEnvironmentId: prev.activeEnvironmentId || newEnv.id,
      }));
      return newEnv;
    },
    []
  );

  const updateEnvironment = useCallback((id: string, updates: Partial<Environment>) => {
    setData((prev) => ({
      ...prev,
      environments: prev.environments.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    }));
  }, []);

  const deleteEnvironment = useCallback((id: string) => {
    setData((prev) => {
      const filtered = prev.environments.filter((e) => e.id !== id);
      const nextActiveId =
        prev.activeEnvironmentId === id ? filtered[0]?.id || '' : prev.activeEnvironmentId;
      return {
        ...prev,
        environments: filtered,
        activeEnvironmentId: nextActiveId,
      };
    });
  }, []);

  const duplicateEnvironment = useCallback(
    (id: string): Environment | null => {
      const orig = data.environments.find((e) => e.id === id);
      if (!orig) return null;
      const now = new Date().toISOString();
      const duplicate: Environment = {
        ...orig,
        id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${orig.name} (Copy)`,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      setData((prev) => ({
        ...prev,
        environments: [...prev.environments, duplicate],
      }));
      return duplicate;
    },
    [data.environments]
  );

  // API History
  const addApiHistoryItem = useCallback((item: ApiHistoryItem) => {
    setData((prev) => ({
      ...prev,
      apiHistory: [item, ...prev.apiHistory].slice(0, 100),
    }));
  }, []);

  const clearApiHistory = useCallback(() => {
    setData((prev) => ({ ...prev, apiHistory: [] }));
  }, []);

  const deleteApiHistoryItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      apiHistory: prev.apiHistory.filter((h) => h.id !== id),
    }));
  }, []);

  // Webhooks
  const addWebhookEvent = useCallback(
    (sessionId: string, eventData: Omit<WebhookEvent, 'id' | 'timestamp'>) => {
      const now = new Date().toISOString();
      const event: WebhookEvent = {
        ...eventData,
        id: `wh-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
      };
      setData((prev) => ({
        ...prev,
        webhookSessions: prev.webhookSessions.map((s) =>
          s.id === sessionId ? { ...s, events: [event, ...s.events] } : s
        ),
      }));
    },
    []
  );

  const clearWebhookEvents = useCallback((sessionId: string) => {
    setData((prev) => ({
      ...prev,
      webhookSessions: prev.webhookSessions.map((s) =>
        s.id === sessionId ? { ...s, events: [] } : s
      ),
    }));
  }, []);

  const createWebhookSession = useCallback((name: string): WebhookSession => {
    const session: WebhookSession = {
      id: `wh-session-${Date.now()}`,
      name,
      token: `wh_${Math.random().toString(36).substring(2, 10)}`,
      events: [],
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      webhookSessions: [...prev.webhookSessions, session],
      activeWebhookSessionId: session.id,
    }));
    return session;
  }, []);

  // Phase 3: Mock Endpoints & Logs
  const mockEndpoints = useMemo(() => data.mockEndpoints || [], [data.mockEndpoints]);
  const mockLogs = useMemo(() => data.mockLogs || [], [data.mockLogs]);

  const addMockEndpoint = useCallback((endpoint: Omit<MockEndpoint, 'id' | 'createdAt' | 'updatedAt'>): MockEndpoint => {
    const newEp: MockEndpoint = {
      ...endpoint,
      id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      mockEndpoints: [newEp, ...(prev.mockEndpoints || [])],
    }));
    return newEp;
  }, []);

  const updateMockEndpoint = useCallback((id: string, updates: Partial<MockEndpoint>) => {
    setData((prev) => ({
      ...prev,
      mockEndpoints: (prev.mockEndpoints || []).map((ep) =>
        ep.id === id ? { ...ep, ...updates, updatedAt: new Date().toISOString() } : ep
      ),
    }));
  }, []);

  const deleteMockEndpoint = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      mockEndpoints: (prev.mockEndpoints || []).filter((ep) => ep.id !== id),
    }));
  }, []);

  const duplicateMockEndpoint = useCallback((id: string): MockEndpoint | null => {
    let duplicated: MockEndpoint | null = null;
    setData((prev) => {
      const ep = (prev.mockEndpoints || []).find((e) => e.id === id);
      if (!ep) return prev;
      duplicated = {
        ...ep,
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${ep.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        mockEndpoints: [duplicated, ...(prev.mockEndpoints || [])],
      };
    });
    return duplicated;
  }, []);

  const addMockLog = useCallback((log: MockRequestLog) => {
    setData((prev) => ({
      ...prev,
      mockLogs: [log, ...(prev.mockLogs || [])].slice(0, 100),
    }));
  }, []);

  const clearMockLogs = useCallback(() => {
    setData((prev) => ({
      ...prev,
      mockLogs: [],
    }));
  }, []);

  // Phase 3: GraphQL Explorer
  const graphqlQueries = useMemo(() => data.graphqlQueries || [], [data.graphqlQueries]);

  const addGraphQLRequest = useCallback((req: Omit<GraphQLRequest, 'id' | 'createdAt' | 'updatedAt'>): GraphQLRequest => {
    const newGql: GraphQLRequest = {
      ...req,
      id: `gql-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      graphqlQueries: [newGql, ...(prev.graphqlQueries || [])],
    }));
    return newGql;
  }, []);

  const updateGraphQLRequest = useCallback((id: string, updates: Partial<GraphQLRequest>) => {
    setData((prev) => ({
      ...prev,
      graphqlQueries: (prev.graphqlQueries || []).map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      ),
    }));
  }, []);

  const deleteGraphQLRequest = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      graphqlQueries: (prev.graphqlQueries || []).filter((g) => g.id !== id),
    }));
  }, []);

  // Phase 3: WebSocket Client
  const webSocketConnections = useMemo(() => data.webSocketConnections || [], [data.webSocketConnections]);

  const addWebSocketConnection = useCallback((conn: Omit<WebSocketConnection, 'id' | 'createdAt' | 'updatedAt'>): WebSocketConnection => {
    const newWs: WebSocketConnection = {
      ...conn,
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      webSocketConnections: [newWs, ...(prev.webSocketConnections || [])],
    }));
    return newWs;
  }, []);

  const updateWebSocketConnection = useCallback((id: string, updates: Partial<WebSocketConnection>) => {
    setData((prev) => ({
      ...prev,
      webSocketConnections: (prev.webSocketConnections || []).map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
    }));
  }, []);

  const deleteWebSocketConnection = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      webSocketConnections: (prev.webSocketConnections || []).filter((w) => w.id !== id),
    }));
  }, []);

  // Phase 3: Server-Sent Events (SSE) Client
  const sseConnections = useMemo(() => data.sseConnections || [], [data.sseConnections]);

  const addSseConnection = useCallback((conn: Omit<SseConnection, 'id' | 'createdAt' | 'updatedAt'>): SseConnection => {
    const newSse: SseConnection = {
      ...conn,
      id: `sse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      sseConnections: [newSse, ...(prev.sseConnections || [])],
    }));
    return newSse;
  }, []);

  const updateSseConnection = useCallback((id: string, updates: Partial<SseConnection>) => {
    setData((prev) => ({
      ...prev,
      sseConnections: (prev.sseConnections || []).map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const deleteSseConnection = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      sseConnections: (prev.sseConnections || []).filter((s) => s.id !== id),
    }));
  }, []);

  // Phase 3: OpenAPI / Swagger Explorer
  const openApiDocuments = useMemo(() => data.openApiDocuments || [], [data.openApiDocuments]);

  const addOpenApiDocument = useCallback((doc: Omit<OpenApiDocumentRecord, 'id' | 'importedAt'>): OpenApiDocumentRecord => {
    const newDoc: OpenApiDocumentRecord = {
      ...doc,
      id: `openapi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      importedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      openApiDocuments: [newDoc, ...(prev.openApiDocuments || [])],
    }));
    return newDoc;
  }, []);

  const deleteOpenApiDocument = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      openApiDocuments: (prev.openApiDocuments || []).filter((d) => d.id !== id),
    }));
  }, []);

  // Phase 4: Git & Version Control
  const gitRepositories = useMemo(() => data.gitRepositories || [], [data.gitRepositories]);
  const activeGitRepoId = data.activeGitRepoId || (gitRepositories[0]?.id ?? null);
  const activeGitRepo = useMemo(
    () => gitRepositories.find((r) => r.id === activeGitRepoId) || gitRepositories[0],
    [gitRepositories, activeGitRepoId]
  );

  const gitSettings: GitSettings = useMemo(
    () => data.gitSettings || {
      defaultBranch: 'main',
      defaultDiffMode: 'unified' as const,
      confirmDestructive: true,
      authorName: 'Developer',
      authorEmail: 'developer@devdesk.local',
      autoFetchIntervalMinutes: 0,
    },
    [data.gitSettings]
  );

  const updateGitSettings = useCallback((updates: Partial<GitSettings>) => {
    setData((prev) => ({
      ...prev,
      gitSettings: {
        ...(prev.gitSettings || {
          defaultBranch: 'main',
          defaultDiffMode: 'unified',
          confirmDestructive: true,
          authorName: 'Developer',
          authorEmail: 'developer@devdesk.local',
          autoFetchIntervalMinutes: 0,
        }),
        ...updates,
      },
    }));
  }, []);

  const setActiveGitRepoId = useCallback((repoId: string | null) => {
    setData((prev) => ({ ...prev, activeGitRepoId: repoId }));
  }, []);

  const addGitRepository = useCallback((repo: GitRepository) => {
    setData((prev) => ({
      ...prev,
      gitRepositories: [...(prev.gitRepositories || []), repo],
      activeGitRepoId: repo.id,
    }));
  }, []);

  const updateGitRepository = useCallback((id: string, updates: Partial<GitRepository>) => {
    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));
  }, []);

  const deleteGitRepository = useCallback((id: string) => {
    setData((prev) => {
      const remaining = (prev.gitRepositories || []).filter((r) => r.id !== id);
      const nextActiveId = prev.activeGitRepoId === id ? (remaining[0]?.id ?? null) : prev.activeGitRepoId;
      return {
        ...prev,
        gitRepositories: remaining,
        activeGitRepoId: nextActiveId,
      };
    });
  }, []);

  const stageGitFile = useCallback((repoId: string, changeId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = stageFile(repo, changeId);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const unstageGitFile = useCallback((repoId: string, changeId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = unstageFile(repo, changeId);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const stageAllGitFiles = useCallback((repoId: string): { sensitiveWarnings: string[] } => {
    let warnings: string[] = [];
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const res = stageAll(repo);
      warnings = res.sensitiveWarnings;
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
      };
    });
    return { sensitiveWarnings: warnings };
  }, []);

  const unstageAllGitFiles = useCallback((repoId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = unstageAll(repo);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const toggleGitHunkStage = useCallback((repoId: string, changeId: string, hunkId: string, shouldStage: boolean) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = toggleHunkStage(repo, changeId, hunkId, shouldStage);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const discardGitFileChanges = useCallback((repoId: string, changeId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = discardFileChanges(repo, changeId);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const discardAllGitChanges = useCallback((repoId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = discardAllUnstaged(repo);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const commitGitChanges = useCallback((repoId: string, message: string, isAmend = false): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const validation = validateCommit(repo, message, isAmend);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { repo: updatedRepo } = commitChanges(
      repo,
      message,
      {
        name: gitSettings.authorName || 'Developer',
        email: gitSettings.authorEmail || 'developer@devdesk.local',
        date: new Date().toISOString(),
      },
      isAmend
    );

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updatedRepo : r)),
    }));

    return { success: true };
  }, [data.gitRepositories, gitSettings]);

  const createGitBranch = useCallback((repoId: string, name: string, basedOnCommit?: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = createBranch(repo, name, basedOnCommit);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const switchGitBranch = useCallback((repoId: string, targetBranchName: string, force = false): { success: boolean; error?: string; requiresStashOrForce?: boolean } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = switchBranch(repo, targetBranchName, force);
    if (res.error) {
      return { success: false, error: res.error, requiresStashOrForce: res.requiresStashOrForce };
    }

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const renameGitBranch = useCallback((repoId: string, oldName: string, newName: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = renameBranch(repo, oldName, newName);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const deleteGitBranch = useCallback((repoId: string, branchName: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = deleteBranch(repo, branchName);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const mergeGitBranch = useCallback((repoId: string, sourceBranchName: string): { success: boolean; merged: boolean; hasConflicts: boolean; summary: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, merged: false, hasConflicts: false, summary: 'Repository not found.' };

    const res = mergeBranch(repo, sourceBranchName);
    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: res.merged, merged: res.merged, hasConflicts: res.hasConflicts, summary: res.summary };
  }, [data.gitRepositories]);

  const resolveGitConflict = useCallback((repoId: string, filePath: string, resolvedContent?: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = resolveFileConflict(repo, filePath, resolvedContent);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const createGitStash = useCallback((repoId: string, message?: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const res = createStash(repo, message);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
      };
    });
  }, []);

  const applyGitStash = useCallback((repoId: string, stashId: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = applyStash(repo, stashId);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const popGitStash = useCallback((repoId: string, stashId: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = popStash(repo, stashId);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const dropGitStash = useCallback((repoId: string, stashId: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = dropStash(repo, stashId);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const createGitTag = useCallback((repoId: string, name: string, commitHash: string, message?: string, tagger?: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = createTag(repo, name, commitHash, message, tagger);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const deleteGitTag = useCallback((repoId: string, tagName: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = deleteTag(repo, tagName);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const addGitRemote = useCallback((repoId: string, name: string, fetchUrl: string, pushUrl?: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = addRemote(repo, name, fetchUrl, pushUrl);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const editGitRemote = useCallback((repoId: string, oldName: string, newName: string, fetchUrl: string, pushUrl?: string): { success: boolean; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, error: 'Repository not found.' };

    const res = editRemote(repo, oldName, newName, fetchUrl, pushUrl);
    if (res.error) return { success: false, error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true };
  }, [data.gitRepositories]);

  const removeGitRemote = useCallback((repoId: string, name: string) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      if (!repo) return prev;
      const updated = removeRemote(repo, name);
      return {
        ...prev,
        gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? updated : r)),
      };
    });
  }, []);

  const fetchGitRemote = useCallback((repoId: string, remoteName = 'origin'): string => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return 'Repository not found';

    const res = fetchRemote(repo, remoteName);
    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return res.summary;
  }, [data.gitRepositories]);

  const pullGitRemote = useCallback((repoId: string, remoteName = 'origin'): { success: boolean; summary: string; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, summary: '', error: 'Repository not found.' };

    const res = pullRemote(repo, remoteName);
    if (res.error) return { success: false, summary: '', error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true, summary: res.summary };
  }, [data.gitRepositories]);

  const pushGitRemote = useCallback((repoId: string, remoteName = 'origin', authProvided = true): { success: boolean; summary: string; error?: string } => {
    const repo = (data.gitRepositories || []).find((r) => r.id === repoId);
    if (!repo) return { success: false, summary: '', error: 'Repository not found.' };

    const res = pushRemote(repo, remoteName, authProvided);
    if (res.error) return { success: false, summary: '', error: res.error };

    setData((prev) => ({
      ...prev,
      gitRepositories: (prev.gitRepositories || []).map((r) => (r.id === repoId ? res.repo : r)),
    }));
    return { success: true, summary: res.summary };
  }, [data.gitRepositories]);

  const linkProjectToGitRepo = useCallback((projectId: string, repoId: string | null) => {
    setData((prev) => {
      const repo = (prev.gitRepositories || []).find((r) => r.id === repoId);
      return {
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              gitRepositoryId: repoId || undefined,
              gitBranch: repo ? repo.currentBranch : undefined,
              gitRepoUrl: repo?.remotes[0]?.fetchUrl || undefined,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        }),
      };
    });
  }, []);

  // Phase 5: Essential Developer Integrations (SSH, Logs, EnvFiles)
  const sshProfiles = useMemo(() => data.sshProfiles || [], [data.sshProfiles]);
  const logEntries = useMemo(() => data.logEntries || [], [data.logEntries]);
  const envFiles = useMemo(() => data.envFiles || [], [data.envFiles]);

  const addSSHProfile = useCallback((profile: Omit<SSHProfile, 'id' | 'createdAt'>): SSHProfile => {
    const newProfile: SSHProfile = {
      ...profile,
      id: `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      sshProfiles: [...(prev.sshProfiles || []), newProfile],
    }));
    return newProfile;
  }, []);

  const updateSSHProfile = useCallback((id: string, updates: Partial<SSHProfile>) => {
    setData((prev) => ({
      ...prev,
      sshProfiles: (prev.sshProfiles || []).map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteSSHProfile = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      sshProfiles: (prev.sshProfiles || []).filter((p) => p.id !== id),
    }));
  }, []);

  const duplicateSSHProfile = useCallback((id: string): SSHProfile | null => {
    const existing = (data.sshProfiles || []).find((p) => p.id === id);
    if (!existing) return null;
    const duplicated: SSHProfile = {
      ...existing,
      id: `ssh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${existing.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      sshProfiles: [...(prev.sshProfiles || []), duplicated],
    }));
    return duplicated;
  }, [data.sshProfiles]);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setData((prev) => ({
      ...prev,
      logEntries: trimLogsToRetention([...(prev.logEntries || []), newEntry], 1000),
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setData((prev) => ({
      ...prev,
      logEntries: [],
    }));
  }, []);

  const saveEnvFile = useCallback((name: string, content: string) => {
    const parsed = parseEnvFile(content);
    setData((prev) => {
      const existing = (prev.envFiles || []).find((f) => f.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return {
          ...prev,
          envFiles: (prev.envFiles || []).map((f) =>
            f.id === existing.id ? { ...f, content, variables: parsed, updatedAt: new Date().toISOString() } : f
          ),
        };
      }
      const newFile: EnvFileRecord = {
        id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        content,
        variables: parsed,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        envFiles: [...(prev.envFiles || []), newFile],
      };
    });
  }, []);

  const deleteEnvFile = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      envFiles: (prev.envFiles || []).filter((f) => f.id !== id),
    }));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        activeView,
        selectedToolId,
        selectedProjectId,
        isSidebarCollapsed,
        isCommandPaletteOpen,
        isShortcutsOpen,
        isPrivacyModalOpen,
        scratchpadSaveStatus,
        setActiveView,
        canGoBack: canGoBackVal,
        canGoForward: canGoForwardVal,
        goBack,
        goForward,
        setIsSidebarCollapsed,
        setIsCommandPaletteOpen,
        setIsShortcutsOpen,
        setIsPrivacyModalOpen,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        duplicateSnippet,
        toggleFavoriteSnippet,
        addProject,
        updateProject,
        deleteProject,
        toggleFavoriteProject,
        updateScratchpad,
        clearScratchpad,
        isToolFavorite,
        toggleFavoriteTool,
        removeFavorite,
        recordHistory,
        clearHistory,
        updateSettings,
        setWorkspaceData,
        resetToDefaults,

        // Phase 2
        apiTabs,
        activeTabId,
        activeTab,
        activeEnvironment,
        setActiveEnvironmentId,
        setActiveTabId,
        openRequestInTab,
        createNewTab,
        closeTab,
        updateTabRequest,
        updateTabResponse,
        setTabLoading,

        addCollection,
        updateCollection,
        deleteCollection,
        addApiRequest,
        updateApiRequest,
        deleteApiRequest,
        duplicateApiRequest,

        addEnvironment,
        updateEnvironment,
        deleteEnvironment,
        duplicateEnvironment,

        addApiHistoryItem,
        clearApiHistory,
        deleteApiHistoryItem,

        addWebhookEvent,
        clearWebhookEvents,
        createWebhookSession,

        // Phase 3
        mockEndpoints,
        mockLogs,
        addMockEndpoint,
        updateMockEndpoint,
        deleteMockEndpoint,
        duplicateMockEndpoint,
        addMockLog,
        clearMockLogs,

        graphqlQueries,
        addGraphQLRequest,
        updateGraphQLRequest,
        deleteGraphQLRequest,

        webSocketConnections,
        addWebSocketConnection,
        updateWebSocketConnection,
        deleteWebSocketConnection,

        sseConnections,
        addSseConnection,
        updateSseConnection,
        deleteSseConnection,

        openApiDocuments,
        addOpenApiDocument,
        deleteOpenApiDocument,

        // Phase 4: Git & Version Control
        gitRepositories,
        activeGitRepoId,
        activeGitRepo,
        gitSettings,
        updateGitSettings,
        setActiveGitRepoId,
        addGitRepository,
        updateGitRepository,
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

        // Phase 5: Essential Developer Integrations (SSH, Logs, EnvFiles)
        sshProfiles,
        addSSHProfile,
        updateSSHProfile,
        deleteSSHProfile,
        duplicateSSHProfile,

        logs: logEntries,
        logEntries,
        addLogEntry,
        clearLogs,

        envFiles,
        saveEnvFile,
        deleteEnvFile,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

