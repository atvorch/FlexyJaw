import { useState } from 'react';
import { selectUnsaved, useJawStore } from '../../state/store';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * The untouched treatment plan: always present and never changed, renamed or deleted.
 * Editing while it is open starts a new saved version instead.
 */
export function OriginalCard() {
  const viewing = useJawStore((s) => s.viewingOriginal);
  const unsaved = useJawStore(selectUnsaved);
  const viewOriginal = useJawStore((s) => s.viewOriginal);
  const [confirming, setConfirming] = useState(false);

  const open = () => {
    if (viewing) return;
    if (unsaved) setConfirming(true);
    else viewOriginal();
  };

  return (
    <>
      <div
        className={`version-card original-card${viewing ? ' current' : ' switchable'}`}
        role="button"
        tabIndex={0}
        aria-current={viewing ? 'true' : undefined}
        aria-disabled={viewing || undefined}
        title={viewing ? 'You are viewing the original plan' : 'Open the original plan; editing it starts a new version'}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          open();
        }}
      >
        <div className="version-head">
          <span className="version-name">Original plan</span>
          {viewing && <span className="version-badge">viewing</span>}
        </div>
        <span className="muted">The treatment plan as it was made</span>
        <div className="version-foot">
          <span className="muted">No changes</span>
          <span className="read-only-tag" title="The original plan itself never changes">
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Edits make a new version
          </span>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          confirmLabel="Open original"
          danger
          onConfirm={() => {
            viewOriginal();
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        >
          <p>
            You have changes that aren't saved. Opening the original plan replaces them on screen; you can still get them back
            with Undo after switching back to a saved version.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
