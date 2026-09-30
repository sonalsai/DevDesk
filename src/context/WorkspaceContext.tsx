import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  WorkspaceData,
  UserSettings,
  Task,
  Snippet,
  Project,
  ScratchpadData,
  FavoriteItem,
  HistoryItem,
  ViewType
} from '../types';
import {
  loadWorkspaceData,
  saveWorkspaceData,
  clearWorkspaceStorage,
  INITIAL_WORKSPACE
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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

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

  // Sync to localStorage
  useEffect(() => {
    saveWorkspaceData(data);
  }, [data]);

  // Sync theme (index.html sets the first value before paint, so there's no flash)
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const theme = data.settings.theme;
      const next = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      const current = root.getAttribute('data-theme');
      if (current === next) return;
      if (!current || !('startViewTransition' in document)) {
        root.setAttribute('data-theme', next);
        return;
      }
      // Circular reveal, see ::view-transition-new(root) in index.css
      document.startViewTransition(() => root.setAttribute('data-theme', next));
    };

    apply();
    if (data.settings.theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.settings.theme]);

  const setActiveView = useCallback(
    (view: ViewType, options?: { toolId?: string; projectId?: string }) => {
      setActiveViewState(view);
      if (options?.toolId !== undefined) {
        setSelectedToolId(options.toolId);
      }
      if (options?.projectId !== undefined) {
        setSelectedProjectId(options.projectId);
      }
      // Scroll to top
      window.scrollTo(0, 0);
    },
    []
  );

  // History tracking (no sensitive input data!)
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
        // Keep up to 50 recent items
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
      // Remove project reference from tasks and snippets
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
      const updated: ScratchpadData = {
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
    }, 400);
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
