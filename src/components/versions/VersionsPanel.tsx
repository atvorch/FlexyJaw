import { useEffect, useState } from 'react';
import { selectUnsaved, useJawStore } from '../../state/store';
import { OriginalCard } from './OriginalCard';
import { SaveBar } from './SaveBar';
import { VersionActions } from './VersionActions';
import { VersionList } from './VersionList';

const OPEN_KEY = 'jaw-editor-versions-panel-open';

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
};

/**
 * Left-hand panel listing saved versions, with export / import / reset and Save pinned at the bottom; collapses
 * to a slim strip.
 */
export function VersionsPanel() {
  const count = useJawStore((s) => s.versions.length);
  const unsaved = useJawStore(selectUnsaved);
  const [open, setOpen] = useState(readOpen);

  // a per-viewer layout preference, so plain browser storage is enough
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, String(open));
    } catch {
      // storage blocked: the panel just opens expanded next time
    }
  }, [open]);

  if (!open) {
    return (
      <aside className="versions-panel collapsed">
        <button className="versions-strip" title="Show saved versions" aria-expanded="false" onClick={() => setOpen(true)}>
          <span aria-hidden="true">»</span>
          <span className="versions-strip-label">Versions</span>
          <span className="versions-count">{count}</span>
          {/* Save lives in the panel, so say so while it's tucked away */}
          {unsaved && (
            <span className="versions-unsaved" title="Unsaved changes: open the panel to save (or Ctrl+S)">
              ●
            </span>
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside className="versions-panel">
      <div className="versions-main">
        <header className="versions-header">
          <h2>Versions</h2>
          <button className="close" title="Collapse" aria-expanded="true" onClick={() => setOpen(false)}>
            «
          </button>
        </header>
        <div className="versions-scroll">
          <section className="versions-section">
            <h3>Original</h3>
            <OriginalCard />
          </section>
          <section className="versions-section">
            <h3>
              Saved versions <span className="versions-count">{count}</span>
            </h3>
            <VersionList />
          </section>
        </div>
        {/* pinned below the list: the open version's file actions and Save */}
        <div className="versions-footer">
          <VersionActions />
          <SaveBar />
        </div>
      </div>
    </aside>
  );
}
