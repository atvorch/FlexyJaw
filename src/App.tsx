import { useEffect, useState } from 'react';
import { CompareDrawer } from './components/compare/CompareDrawer';
import { ReportModal } from './components/report/ReportModal';
import { RestoreDraftDialog } from './components/saves/RestoreDraftDialog';
import { SaveDialog } from './components/saves/SaveDialog';
import { VersionsPanel } from './components/versions/VersionsPanel';
import { Viewport } from './components/viewport/Viewport';
import { loadJawModel } from './data/loadJaw';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useToggleQueryParams } from './hooks/useToggleQueryParams';
import { useUnsavedChangesWarning } from './hooks/useUnsavedChangesWarning';
import { useJawStore } from './state/store';

export function App() {
  const [error, setError] = useState<string | null>(null);
  const viewOnly = useJawStore((s) => s.viewOnly);

  useEffect(() => {
    if (useJawStore.getState().model) return;
    loadJawModel()
      .then((model) => useJawStore.getState().setModel(model))
      .catch((e: Error) => setError(e.message));
  }, []);

  useKeyboardShortcuts();
  useUnsavedChangesWarning();
  useToggleQueryParams();

  return (
    <div className="app">
      {/* a shared view has no saves of its own */}
      {!viewOnly && <VersionsPanel />}
      <Viewport error={error} />
      {/* a column of its own: opening it narrows the 3D view instead of covering it */}
      <CompareDrawer />
      <ReportModal />
      {!viewOnly && <SaveDialog />}
      {!viewOnly && <RestoreDraftDialog />}
    </div>
  );
}
