import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Star, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useWorkspace } from '@/hooks';

interface ToolLayoutProps {
  toolId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  toolId,
  title,
  description,
  icon: Icon,
  actions,
  children,
}) => {
  const { isToolFavorite, toggleFavoriteTool, setIsPrivacyModalOpen, setActiveView, goBack, canGoBack } = useWorkspace();
  const isFav = isToolFavorite(toolId);

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      setActiveView('all-tools');
    }
  };

  return (
    <div className="tool-workspace">
      <div className="tool-header-card">
        <div className="tool-header-left">
          <button
            type="button"
            className="tool-back-nav-btn"
            onClick={handleBack}
            title="Back to all utilities"
            aria-label="Back to all utilities"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="tool-header-icon">
            <Icon size={20} />
          </div>
          <div>
            <div className="tool-title-row">
              <h1 className="tool-title">{title}</h1>
              <button
                className={`btn-icon pin-tool-btn ${isFav ? 'pinned' : ''}`}
                onClick={() => toggleFavoriteTool(toolId, title, description)}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                aria-label="Toggle favorite"
              >
                <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="tool-description">{description}</p>
          </div>
        </div>

        <div className="tool-header-right">
          <button
            className="privacy-badge"
            onClick={() => setIsPrivacyModalOpen(true)}
            title="DevDesk processes all tool inputs 100% locally in your browser"
          >
            <ShieldCheck size={14} />
            <span>Processed locally</span>
          </button>
        </div>
      </div>

      {actions && <div className="tool-toolbar">{actions}</div>}

      {children}
    </div>
  );
};
