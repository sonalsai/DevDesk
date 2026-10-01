import { describe, it, expect } from 'vitest';
import {
  createInitialNavigationState,
  pushNavigation,
  goBackNavigation,
  goForwardNavigation,
  canGoBack,
  canGoForward,
  MAX_NAVIGATION_HISTORY,
} from '../src/services/navigation';

describe('Navigation History Stack Service', () => {
  it('starts at initial dashboard state with no back or forward history', () => {
    const state = createInitialNavigationState();

    expect(canGoBack(state)).toBe(false);
    expect(canGoForward(state)).toBe(false);
    expect(state.history).toEqual([{ view: 'dashboard' }]);
    expect(state.currentIndex).toBe(0);
  });

  it('records navigation transitions and updates back/forward capabilities', () => {
    let state = createInitialNavigationState();

    // Navigate to scratchpad
    state = pushNavigation(state, { view: 'scratchpad' });
    expect(state.currentIndex).toBe(1);
    expect(state.history.length).toBe(2);
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(false);

    // Navigate to tasks
    state = pushNavigation(state, { view: 'tasks' });
    expect(state.currentIndex).toBe(2);
    expect(state.history[2].view).toBe('tasks');

    // Go back once
    const back1 = goBackNavigation(state);
    state = back1.nextState;
    expect(back1.targetItem?.view).toBe('scratchpad');
    expect(state.currentIndex).toBe(1);
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(true);

    // Go back to start
    const back2 = goBackNavigation(state);
    state = back2.nextState;
    expect(back2.targetItem?.view).toBe('dashboard');
    expect(state.currentIndex).toBe(0);
    expect(canGoBack(state)).toBe(false);

    // Go forward
    const fwd1 = goForwardNavigation(state);
    state = fwd1.nextState;
    expect(fwd1.targetItem?.view).toBe('scratchpad');
    expect(state.currentIndex).toBe(1);
  });

  it('clears forward history when navigating to a new view from the middle of the stack', () => {
    let state = createInitialNavigationState();

    state = pushNavigation(state, { view: 'scratchpad' });
    state = pushNavigation(state, { view: 'tasks' });
    state = pushNavigation(state, { view: 'all-tools' });

    // Back to scratchpad
    state = goBackNavigation(state).nextState; // at tasks
    state = goBackNavigation(state).nextState; // at scratchpad
    expect(state.currentIndex).toBe(1);

    // Branch to api-client from scratchpad
    state = pushNavigation(state, { view: 'api-client' });
    expect(state.currentIndex).toBe(2);
    expect(state.history.length).toBe(3);
    expect(state.history.map((h) => h.view)).toEqual(['dashboard', 'scratchpad', 'api-client']);
  });

  it('ignores consecutive identical navigations', () => {
    let state = createInitialNavigationState();

    state = pushNavigation(state, { view: 'scratchpad' });
    const prevLen = state.history.length;
    state = pushNavigation(state, { view: 'scratchpad' });
    expect(state.history.length).toBe(prevLen);
    expect(state.currentIndex).toBe(1);
  });

  it('caps history stack to MAX_NAVIGATION_HISTORY', () => {
    let state = createInitialNavigationState();

    for (let i = 0; i < 70; i++) {
      state = pushNavigation(state, { view: 'tool', toolId: `tool-${i}` });
    }

    expect(state.history.length).toBe(MAX_NAVIGATION_HISTORY);
    expect(state.currentIndex).toBe(MAX_NAVIGATION_HISTORY - 1);
  });
});
