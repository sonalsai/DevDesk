import React, { useEffect, Suspense, lazy } from 'react';
import { useWorkspace } from '@/hooks';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { ShortcutsModal } from '../views/ShortcutsModal';
import { PrivacyModal } from '../views/PrivacyModal';
import { ErrorBoundary, LoadingFallback } from '../common';

// Instant critical path views
import { HomeDashboard } from '../views/HomeDashboard';
import { ScratchpadView } from '../views/ScratchpadView';
import { TasksView } from '../views/TasksView';

// Code-split extended workspace views for fast first-paint
const ProjectsView = lazy(() => import('../views/ProjectsView').then((m) => ({ default: m.ProjectsView })));
const SnippetsView = lazy(() => import('../views/SnippetsView').then((m) => ({ default: m.SnippetsView })));
const AllToolsView = lazy(() => import('../views/AllToolsView').then((m) => ({ default: m.AllToolsView })));
const FavoritesView = lazy(() => import('../views/FavoritesView').then((m) => ({ default: m.FavoritesView })));
const RecentView = lazy(() => import('../views/RecentView').then((m) => ({ default: m.RecentView })));
const SettingsView = lazy(() => import('../views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ApiClientView = lazy(() => import('../views/api/ApiClientView').then((m) => ({ default: m.ApiClientView })));
const CollectionsManagerView = lazy(() => import('../views/api/CollectionsManagerView').then((m) => ({ default: m.CollectionsManagerView })));
const EnvironmentsView = lazy(() => import('../views/api/EnvironmentsView').then((m) => ({ default: m.EnvironmentsView })));
const WebhookInspectorView = lazy(() => import('../views/api/WebhookInspectorView').then((m) => ({ default: m.WebhookInspectorView })));
const HttpInspectorView = lazy(() => import('../views/api/HttpInspectorView').then((m) => ({ default: m.HttpInspectorView })));

import { getToolById } from '../../registry/toolsRegistry';

export const AppShell: React.FC = () => {
  const {
    activeView,
    selectedToolId,
    setActiveView,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  } = useWorkspace();

  // Listen for navigation fallback events from ErrorBoundary
  useEffect(() => {
    const handleNavigateHome = () => setActiveView('dashboard');
    window.addEventListener('devdesk:navigate-home', handleNavigateHome);
    return () => window.removeEventListener('devdesk:navigate-home', handleNavigateHome);
  }, [setActiveView]);

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K -> Open command palette
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // History navigation: Alt + ArrowLeft or Cmd/Ctrl + [ -> Back
      if ((e.altKey && e.key === 'ArrowLeft') || (cmdOrCtrl && e.key === '[')) {
        if (!isInput && canGoBack) {
          e.preventDefault();
          goBack();
          return;
        }
      }

      // History navigation: Alt + ArrowRight or Cmd/Ctrl + ] -> Forward
      if ((e.altKey && e.key === 'ArrowRight') || (cmdOrCtrl && e.key === ']')) {
        if (!isInput && canGoForward) {
          e.preventDefault();
          goForward();
          return;
        }
      }

      // Esc -> Close palette / modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isPrivacyModalOpen) setIsPrivacyModalOpen(false);
        return;
      }

      // If user is currently typing in an input/editor, suppress letter shortcuts
      if (isInput) return;

      // 'N' -> Quick create task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setActiveView('tasks');
        setTimeout(() => {
          document.getElementById('quick-task-input')?.focus();
        }, 80);
        return;
      }

      // 'S' -> Open scratchpad
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setActiveView('scratchpad');
        return;
      }

      // '/' -> Global search palette
      if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    isShortcutsOpen,
    isPrivacyModalOpen,
    setIsCommandPaletteOpen,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
    setActiveView,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  ]);

  // Render workspace content based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <HomeDashboard />;
      case 'scratchpad':
        return <ScratchpadView />;
      case 'tasks':
        return <TasksView />;
      case 'projects':
      case 'project-detail':
        return <ProjectsView />;
      case 'snippets':
        return <SnippetsView />;
      case 'all-tools':
        return <AllToolsView />;
      case 'tool': {
        const tool = selectedToolId ? getToolById(selectedToolId) : null;
        if (!tool) return <AllToolsView />;
        const ToolComponent = tool.component;
        return (
          <ErrorBoundary componentName={tool.name} onReset={() => setActiveView('all-tools')}>
            <Suspense fallback={<LoadingFallback label={`Loading ${tool.name}...`} />}>
              <ToolComponent />
            </Suspense>
          </ErrorBoundary>
        );
      }
      case 'favorites':
        return <FavoritesView />;
      case 'recent':
        return <RecentView />;
      case 'settings':
        return <SettingsView />;
      case 'api-client':
        return <ApiClientView />;
      case 'collections':
        return <CollectionsManagerView />;
      case 'environments':
        return <EnvironmentsView />;
      case 'webhooks':
        return <WebhookInspectorView />;
      case 'http-inspector':
        return <HttpInspectorView />;
      default:
        return <HomeDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Floating sidebar island */}
      <Sidebar />

      {/* Content column: glass top bar + workspace */}
      <div className="app-column">
        <TopBar />

        <main className="main-workspace" id="main-content">
          <ErrorBoundary onReset={() => setActiveView('dashboard')}>
            <Suspense fallback={<LoadingFallback label="Loading view..." />}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Palette Overlay */}
      <CommandPalette />

      {/* Keyboard Shortcuts Reference Dialog */}
      <ShortcutsModal />

      {/* Privacy Guarantee Dialog */}
      <PrivacyModal />
    </div>
  );
};
