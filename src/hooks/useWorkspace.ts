import { useContext } from 'react';
import { WorkspaceContext, type WorkspaceContextType } from '../context/workspaceContextDef';

export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
