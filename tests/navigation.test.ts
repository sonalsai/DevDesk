import { describe, it, expect } from 'vitest';
import type { ViewType } from '../src/types';

describe('Navigation History Stack Logic', () => {
  interface NavItem {
    view: ViewType;
    toolId?: string;
    projectId?: string;
  }

  interface NavState {
    history: NavItem[];
    currentIndex: number;
  }

  function pushNavigation(
    state: NavState,
    nextItem: NavItem
  ): NavState {
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
    const newHistory = [...sliced, nextItem].slice(-50);
    return {
      history: newHistory,
      currentIndex: newHistory.length - 1,
    };
  }

  function goBack(state: NavState): NavState {
    if (state.currentIndex <= 0) return state;
    return {
      ...state,
      currentIndex: state.currentIndex - 1,
    };
  }

  function goForward(state: NavState): NavState {
    if (state.currentIndex >= state.history.length - 1) return state;
    return {
      ...state,
      currentIndex: state.currentIndex + 1,
    };
  }

  it('starts at initial dashboard state with no back or forward history', () => {
    const state: NavState = {
      history: [{ view: 'dashboard' }],
      currentIndex: 0,
    };

    const canGoBack = state.currentIndex > 0;
    const canGoForward = state.currentIndex < state.history.length - 1;

    expect(canGoBack).toBe(false);
    expect(canGoForward).toBe(false);
  });

  it('records navigation transitions and enables canGoBack', () => {
    let state: NavState = {
      history: [{ view: 'dashboard' }],
      currentIndex: 0,
    };

    // Navigate to scratchpad
    state = pushNavigation(state, { view: 'scratchpad' });
    expect(state.currentIndex).toBe(1);
    expect(state.history.length).toBe(2);
    expect(state.currentIndex > 0).toBe(true);
    expect(state.currentIndex < state.history.length - 1).toBe(false);

    // Navigate to tasks
    state = pushNavigation(state, { view: 'tasks' });
    expect(state.currentIndex).toBe(2);
    expect(state.history[2].view).toBe('tasks');

    // Go back once
    state = goBack(state);
    expect(state.currentIndex).toBe(1);
    expect(state.history[state.currentIndex].view).toBe('scratchpad');
    expect(state.currentIndex > 0).toBe(true); // canGoBack
    expect(state.currentIndex < state.history.length - 1).toBe(true); // canGoForward

    // Go back to start
    state = goBack(state);
    expect(state.currentIndex).toBe(0);
    expect(state.history[state.currentIndex].view).toBe('dashboard');
    expect(state.currentIndex > 0).toBe(false); // cannot go back further

    // Go forward
    state = goForward(state);
    expect(state.currentIndex).toBe(1);
    expect(state.history[state.currentIndex].view).toBe('scratchpad');
  });

  it('clears forward history when navigating to a new view from the middle of the stack', () => {
    let state: NavState = {
      history: [{ view: 'dashboard' }],
      currentIndex: 0,
    };

    state = pushNavigation(state, { view: 'scratchpad' });
    state = pushNavigation(state, { view: 'tasks' });
    state = pushNavigation(state, { view: 'all-tools' });

    // Back to scratchpad
    state = goBack(state); // at tasks
    state = goBack(state); // at scratchpad
    expect(state.currentIndex).toBe(1);

    // Branch to api-client from scratchpad
    state = pushNavigation(state, { view: 'api-client' });
    expect(state.currentIndex).toBe(2);
    expect(state.history.length).toBe(3);
    expect(state.history.map((h) => h.view)).toEqual(['dashboard', 'scratchpad', 'api-client']);
  });

  it('ignores consecutive identical navigations', () => {
    let state: NavState = {
      history: [{ view: 'dashboard' }],
      currentIndex: 0,
    };

    state = pushNavigation(state, { view: 'scratchpad' });
    const prevLen = state.history.length;
    state = pushNavigation(state, { view: 'scratchpad' });
    expect(state.history.length).toBe(prevLen);
    expect(state.currentIndex).toBe(1);
  });
});
