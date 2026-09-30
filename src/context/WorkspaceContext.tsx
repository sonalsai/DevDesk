import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
} from '../types';
import {
  loadWorkspaceData,
  saveWorkspaceData,
  clearWorkspaceStorage,
  INITIAL_WORKSPACE,
  DEFAULT_API_REQUESTS,
} from '../services/storage';

interface WorkspaceContextType {
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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

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
  const [navState, setNavState] = useState<{
    history: Array<{ view: ViewType; toolId?: string; projectId?: string }>;
    currentIndex: number;
  }>({
    history: [{ view: 'dashboard' }],
    currentIndex: 0,
  });

  const canGoBack = navState.currentIndex > 0;
  const canGoForward = navState.currentIndex < navState.history.length - 1;

  const setActiveView = useCallback(
    (view: ViewType, options?: { toolId?: string; projectId?: string }) => {
      setActiveViewState(view);
      setSelectedToolId(options?.toolId ?? null);
      setSelectedProjectId(options?.projectId ?? null);

      setNavState((prev) => {
        const current = prev.history[prev.currentIndex];
        const nextItem = {
          view,
          toolId: options?.toolId,
          projectId: options?.projectId,
        };

        if (
          current &&
          current.view === nextItem.view &&
          current.toolId === nextItem.toolId &&
          current.projectId === nextItem.projectId
        ) {
          return prev;
        }

        const sliced = prev.history.slice(0, prev.currentIndex + 1);
        const newHistory = [...sliced, nextItem].slice(-50);
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1,
        };
      });

      window.scrollTo(0, 0);
    },
    []
  );

  const goBack = useCallback(() => {
    setNavState((prev) => {
      if (prev.currentIndex <= 0) return prev;
      const prevIndex = prev.currentIndex - 1;
      const target = prev.history[prevIndex];
      if (target) {
        setActiveViewState(target.view);
        setSelectedToolId(target.toolId ?? null);
        setSelectedProjectId(target.projectId ?? null);
        window.scrollTo(0, 0);
        return {
          ...prev,
          currentIndex: prevIndex,
        };
      }
      return prev;
    });
  }, []);

  const goForward = useCallback(() => {
    setNavState((prev) => {
      if (prev.currentIndex >= prev.history.length - 1) return prev;
      const nextIndex = prev.currentIndex + 1;
      const target = prev.history[nextIndex];
      if (target) {
        setActiveViewState(target.view);
        setSelectedToolId(target.toolId ?? null);
        setSelectedProjectId(target.projectId ?? null);
        window.scrollTo(0, 0);
        return {
          ...prev,
          currentIndex: nextIndex,
        };
      }
      return prev;
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
        canGoBack,
        canGoForward,
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
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
