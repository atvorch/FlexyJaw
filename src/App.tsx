import { useEffect, useState } from 'react';
import { ReportModal } from './components/report/ReportModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { Viewport } from './components/viewport/Viewport';
import { loadJawModel } from './data/loadJaw';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useJawStore } from './state/store';

export function App() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useJawStore.getState().model) return;
    loadJawModel()
      .then((model) => useJawStore.getState().setModel(model))
      .catch((e: Error) => setError(e.message));
  }, []);

  useKeyboardShortcuts();

  return (
    <div className="app">
      <Viewport error={error} />
      <Sidebar />
      <ReportModal />
    </div>
  );
}
