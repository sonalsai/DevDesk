import type {
  WorkspaceData,
  UserSettings,
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

const EMPTY_SCRATCHPAD: ScratchpadData = {
  content: '',
  isPinned: false,
  lastSaved: new Date().toISOString(),
};

// Workspaces saved before v3 were seeded with sample records. These are their ids
// (generated ids always carry a timestamp, so user data can't collide with them).
const SAMPLE_IDS = new Set([
  'task-1', 'task-2', 'task-3', 'task-4',
  'proj-1', 'proj-2', 'proj-3',
  'snip-1', 'snip-2', 'snip-3',
  'fav-tool-1', 'fav-tool-2', 'fav-tool-3', 'fav-snip-1', 'fav-proj-1',
  'hist-1', 'hist-2', 'hist-3', 'hist-4',
]);
// The sample scratchpad started with this heading and was exactly this long; edited notes are kept
const SAMPLE_SCRATCHPAD = { prefix: "# Today's Work", length: 419 };

function removeSampleData(data: WorkspaceData): WorkspaceData {
  const isSample = (id?: string) => !!id && SAMPLE_IDS.has(id);
  const pointsAtSample = (item: FavoriteItem | HistoryItem) =>
    item.type !== 'tool' && isSample(item.targetId);
  const { content } = data.scratchpad;
  const isSampleScratchpad =
    content.length === SAMPLE_SCRATCHPAD.length && content.startsWith(SAMPLE_SCRATCHPAD.prefix);

  return {
    ...data,
    tasks: data.tasks
      .filter((t) => !isSample(t.id))
      .map((t) => (isSample(t.projectId) ? { ...t, projectId: undefined } : t)),
    snippets: data.snippets
      .filter((s) => !isSample(s.id))
      .map((s) => (isSample(s.projectId) ? { ...s, projectId: undefined } : s)),
    projects: data.projects.filter((p) => !isSample(p.id)),
    favorites: data.favorites.filter((f) => !isSample(f.id) && !pointsAtSample(f)),
    history: data.history.filter((h) => !isSample(h.id) && !pointsAtSample(h)),
    scratchpad: isSampleScratchpad ? { ...data.scratchpad, content: '' } : data.scratchpad,
  };
}

export const INITIAL_WORKSPACE: WorkspaceData = {
  tasks: [],
  snippets: [],
  projects: [],
  scratchpad: EMPTY_SCRATCHPAD,
  favorites: [],
  history: [],
  settings: DEFAULT_SETTINGS,
  version: 3,
};

export function loadWorkspaceData(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceData(INITIAL_WORKSPACE);
      return INITIAL_WORKSPACE;
    }
    const parsed = JSON.parse(raw);
    const version = parsed.version || 1;
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
    // v2 made light the default theme: switch v1 workspaces over once
    if (version < 2) settings.theme = 'light';
    const data: WorkspaceData = {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      snippets: Array.isArray(parsed.snippets) ? parsed.snippets : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      scratchpad: parsed.scratchpad && typeof parsed.scratchpad.content === 'string'
        ? parsed.scratchpad
        : EMPTY_SCRATCHPAD,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      settings,
      version: 3,
    };
    // v3 removed the sample workspace: strip the old sample records once
    return version < 3 ? removeSampleData(data) : data;
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
  const data: WorkspaceData = {
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
    version: 3,
  };
  return (parsed.version || 1) < 3 ? removeSampleData(data) : data;
}

export function clearWorkspaceStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
