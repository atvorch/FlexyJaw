import { selectUnsaved, useJawStore } from '../../state/store';

/** Pinned to the bottom of the sidebar: save status and the Save button. */
export function SaveBar() {
  const unsaved = useJawStore(selectUnsaved);
  const current = useJawStore((s) => s.versions.find((v) => v.id === s.currentVersionId));
  const open = useJawStore((s) => s.setSaveDialogOpen);
  const viewingOriginal = useJawStore((s) => s.viewingOriginal);

  return (
    <footer className="save-bar">
      <div className="save-status">
        {viewingOriginal ? (
          <>
            <span className="save-state">Original plan</span>
            <span className="muted save-current">Changes start a new version</span>
          </>
        ) : (
          <>
            <span className={`save-state${unsaved ? ' unsaved' : ''}`}>{unsaved ? '● Unsaved changes' : 'All changes saved'}</span>
            {current && (
              <span className="muted save-current" title={current.name}>
                {current.name}
              </span>
            )}
          </>
        )}
      </div>
      <button
        className="on"
        disabled={!unsaved}
        title={
          viewingOriginal ? 'Nothing to save: changing the original plan saves a new version automatically' : unsaved ? 'Save changes (Ctrl+S)' : 'Nothing to save: no changes since the last save'
        }
        onClick={() => open(true)}
      >
        Save…
      </button>
    </footer>
  );
}
