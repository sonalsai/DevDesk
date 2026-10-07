import React from 'react';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider } from './context/I18nContext';
import { useWorkspace } from './hooks';
import { AppShell } from './components/shell/AppShell';
import './App.css';

function I18nBridge({ children }: { children: React.ReactNode }) {
  const { data, updateSettings } = useWorkspace();
  return (
    <I18nProvider
      initialLocale={data.settings.locale || 'en'}
      onLocaleChange={(loc) => updateSettings({ locale: loc })}
    >
      {children}
    </I18nProvider>
  );
}

export function App() {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <I18nBridge>
          <AppShell />
        </I18nBridge>
      </WorkspaceProvider>
    </ToastProvider>
  );
}

export default App;
