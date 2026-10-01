import type { ViewType } from '../types';

export interface NavigationItem {
  view: ViewType;
  toolId?: string;
  projectId?: string;
}

export interface NavigationState {
  history: NavigationItem[];
  currentIndex: number;
}

export const MAX_NAVIGATION_HISTORY = 50;

/**
 * Creates the initial navigation state pointing to the dashboard.
 */
export function createInitialNavigationState(initialView: ViewType = 'dashboard'): NavigationState {
  return {
    history: [{ view: initialView }],
    currentIndex: 0,
  };
}

/**
 * Pushes a new navigation item onto the history stack.
 * If navigating to the same location, the current state is preserved.
 * Drops any forward history if navigated from mid-stack.
 */
export function pushNavigation(
  state: NavigationState,
  nextItem: NavigationItem
): NavigationState {
  const current = state.history[state.currentIndex];
  if (
    current &&
    current.view === nextItem.view &&
    current.toolId === nextItem.toolId &&
    current.projectId === nextItem.projectId
  ) {
    return state;
  }

  const sliced = state.history.slice(0, state.currentIndex + 1);
  const newHistory = [...sliced, nextItem].slice(-MAX_NAVIGATION_HISTORY);

  return {
    history: newHistory,
    currentIndex: newHistory.length - 1,
  };
}

/**
 * Moves backward in the navigation stack by one step.
 */
export function goBackNavigation(state: NavigationState): {
  nextState: NavigationState;
  targetItem: NavigationItem | null;
} {
  if (state.currentIndex <= 0) {
    return { nextState: state, targetItem: null };
  }

  const prevIndex = state.currentIndex - 1;
  const targetItem = state.history[prevIndex] || null;

  return {
    nextState: {
      ...state,
      currentIndex: prevIndex,
    },
    targetItem,
  };
}

/**
 * Moves forward in the navigation stack by one step.
 */
export function goForwardNavigation(state: NavigationState): {
  nextState: NavigationState;
  targetItem: NavigationItem | null;
} {
  if (state.currentIndex >= state.history.length - 1) {
    return { nextState: state, targetItem: null };
  }

  const nextIndex = state.currentIndex + 1;
  const targetItem = state.history[nextIndex] || null;

  return {
    nextState: {
      ...state,
      currentIndex: nextIndex,
    },
    targetItem,
  };
}

export function canGoBack(state: NavigationState): boolean {
  return state.currentIndex > 0;
}

export function canGoForward(state: NavigationState): boolean {
  return state.currentIndex < state.history.length - 1;
}
