import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TOOLS_REGISTRY } from '../../registry/toolsRegistry';
import {
  Search,
  Sparkles,
  Plus,
  FileText,
  CheckSquare,
  FolderKanban,
  Code2,
  Settings,
  Star,
  Clock,
  Moon,
  Sun,
  Shield,
  Keyboard,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Recent' | 'Actions' | 'Tools' | 'Navigation';
  icon: React.ComponentType<{ size: number }>;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveView,
    data,
    updateSettings,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
    recordHistory,
  } = useWorkspace();
  const { showToast } = useToast();

  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open (the input focuses itself via autoFocus as it mounts, so no keystrokes are lost)
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Construct items
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. Actions
    items.push({
      id: 'action-task',
      title: 'Create new task',
      subtitle: 'Add to task manager',
      category: 'Actions',
      icon: Plus,
      shortcut: 'N',
      onSelect: () => {
        setActiveView('tasks');
        setIsCommandPaletteOpen(false);
        setTimeout(() => {
          document.getElementById('quick-task-input')?.focus();
        }, 100);
      },
    });

    items.push({
      id: 'action-snippet',
      title: 'New code snippet',
      subtitle: 'Add to library',
      category: 'Actions',
      icon: Code2,
      onSelect: () => {
        setActiveView('snippets');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'action-project',
      title: 'New project workspace',
      subtitle: 'Create project',
      category: 'Actions',
      icon: FolderKanban,
      onSelect: () => {
        setActiveView('projects');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'action-scratchpad',
      title: 'Open scratchpad',
      subtitle: 'Fast markdown notes',
      category: 'Actions',
      icon: FileText,
      shortcut: 'S',
      onSelect: () => {
        setActiveView('scratchpad');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'action-theme',
      title: 'Toggle color theme',
      subtitle: `Switch to ${data.settings.theme === 'dark' ? 'light' : 'dark'} mode`,
      category: 'Actions',
      icon: data.settings.theme === 'dark' ? Sun : Moon,
      onSelect: () => {
        const nextTheme = data.settings.theme === 'dark' ? 'light' : 'dark';
        updateSettings({ theme: nextTheme });
        showToast(`Theme switched to ${nextTheme}`, 'info', 1500);
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'action-shortcuts',
      title: 'View keyboard shortcuts',
      subtitle: 'Keybindings cheat sheet',
      category: 'Actions',
      icon: Keyboard,
      onSelect: () => {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(true);
      },
    });

    items.push({
      id: 'action-privacy',
      title: 'Privacy & local security',
      subtitle: 'View privacy guarantees',
      category: 'Actions',
      icon: Shield,
      onSelect: () => {
        setIsCommandPaletteOpen(false);
        setIsPrivacyModalOpen(true);
      },
    });

    // 2. Tools (all 15)
    TOOLS_REGISTRY.forEach((tool) => {
      items.push({
        id: `tool-${tool.id}`,
        title: tool.name,
        subtitle: tool.description,
        category: 'Tools',
        icon: tool.icon,
        onSelect: () => {
          recordHistory('tool', tool.id, tool.name, tool.description);
          setActiveView('tool', { toolId: tool.id });
          setIsCommandPaletteOpen(false);
        },
      });
    });

    // 3. Navigation
    items.push({
      id: 'nav-home',
      title: 'Home Dashboard',
      subtitle: 'Developer overview',
      category: 'Navigation',
      icon: Sparkles,
      onSelect: () => {
        setActiveView('dashboard');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-tasks',
      title: 'Tasks',
      subtitle: 'Manage today and upcoming items',
      category: 'Navigation',
      icon: CheckSquare,
      onSelect: () => {
        setActiveView('tasks');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-projects',
      title: 'Projects',
      subtitle: 'Workspaces and links',
      category: 'Navigation',
      icon: FolderKanban,
      onSelect: () => {
        setActiveView('projects');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-snippets',
      title: 'Snippets',
      subtitle: 'Code snippet library',
      category: 'Navigation',
      icon: Code2,
      onSelect: () => {
        setActiveView('snippets');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-favs',
      title: 'Favorites',
      subtitle: 'Pinned items and tools',
      category: 'Navigation',
      icon: Star,
      onSelect: () => {
        setActiveView('favorites');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-recent',
      title: 'Recent History',
      subtitle: 'Recently visited tools',
      category: 'Navigation',
      icon: Clock,
      onSelect: () => {
        setActiveView('recent');
        setIsCommandPaletteOpen(false);
      },
    });

    items.push({
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'Workspace preferences & data backups',
      category: 'Navigation',
      icon: Settings,
      onSelect: () => {
        setActiveView('settings');
        setIsCommandPaletteOpen(false);
      },
    });

    return items;
  }, [
    data.settings.theme,
    setActiveView,
    setIsCommandPaletteOpen,
    setIsShortcutsOpen,
    setIsPrivacyModalOpen,
    updateSettings,
    recordHistory,
    showToast,
  ]);

  // Fuzzy filter
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // If query is empty, show Actions first, then popular tools, then navigation
      return allItems;
    }
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      return matchTitle || matchSub || matchCategory;
    });
  }, [allItems, query]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCommandPaletteOpen(false);
      }}
    >
      <div className="palette-modal">
        {/* Search input bar */}
        <div className="palette-search-box">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            autoFocus
            className="palette-input"
            placeholder="Type a command, tool, or search (e.g. json, jwt, task)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="kbd-shortcut">Esc</span>
        </div>

        {/* Results List */}
        <div className="palette-results-list" ref={listRef}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <Icon size={15} />
                    <span className="palette-item-title">{item.title}</span>
                    {item.subtitle && (
                      <span className="palette-item-subtitle">{item.subtitle}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && <span className="kbd-shortcut">{item.shortcut}</span>}
                    {isSelected && <ArrowRight size={12} style={{ color: 'var(--accent)' }} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matches found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="palette-footer">
          <div style={{ display: 'flex', gap: 12 }}>
            <span>
              <kbd className="kbd-shortcut">↑</kbd> <kbd className="kbd-shortcut">↓</kbd> navigate
            </span>
            <span>
              <kbd className="kbd-shortcut">↵</kbd> select
            </span>
            <span>
              <kbd className="kbd-shortcut">esc</kbd> close
            </span>
          </div>

          <span>DevDesk Command Hub</span>
        </div>
      </div>
    </div>
  );
};
