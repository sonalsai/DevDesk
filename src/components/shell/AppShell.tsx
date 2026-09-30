import React, { useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { ShortcutsModal } from '../views/ShortcutsModal';
import { PrivacyModal } from '../views/PrivacyModal';

import { HomeDashboard } from '../views/HomeDashboard';
import { ScratchpadView } from '../views/ScratchpadView';
import { TasksView } from '../views/TasksView';
import { ProjectsView } from '../views/ProjectsView';
import { SnippetsView } from '../views/SnippetsView';
import { AllToolsView } from '../views/AllToolsView';
import { FavoritesView } from '../views/FavoritesView';
import { RecentView } from '../views/RecentView';
import { SettingsView } from '../views/SettingsView';

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
  } = useWorkspace();

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
        return <ToolComponent />;
      }
      case 'favorites':
        return <FavoritesView />;
      case 'recent':
        return <RecentView />;
      case 'settings':
        return <SettingsView />;
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
          {renderContent()}
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
