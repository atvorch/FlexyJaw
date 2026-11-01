import { useJawStore } from '../../state/store';

/**
 * The untouched treatment plan: always present and never changed, renamed or deleted.
 * Editing while it is open starts a new saved version instead. Opening it never loses anything: unsaved edits
 * stay with the version they were made in.
 */
export function OriginalCard() {
  const viewing = useJawStore((s) => s.viewingOriginal);
  const viewOriginal = useJawStore((s) => s.viewOriginal);

  const open = () => {
    if (!viewing) viewOriginal();
  };

  return (
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
      <span className="original-icon" aria-hidden="true">
        {/* a molar outline */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
          <path d="M7.5 3.5c-2.6 0-4 2-4 4.6 0 2.3 1 3.6 1.6 5.6.6 2 .8 6.8 2.6 6.8 1.6 0 1.6-4.6 4.3-4.6s2.7 4.6 4.3 4.6c1.8 0 2-4.8 2.6-6.8.6-2 1.6-3.3 1.6-5.6 0-2.6-1.4-4.6-4-4.6-1.9 0-2.8 1-4.5 1s-2.6-1-4.5-1z" />
        </svg>
      </span>
      <div className="original-body">
        <div className="version-head">
          <span className="version-name">Original plan</span>
          {viewing && <span className="version-badge">viewing</span>}
        </div>
        <span className="muted">The treatment plan as it was made</span>
        <span className="read-only-tag" title="The original plan itself never changes">
          <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.3" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
          </svg>
          Read-only · edits start a new version
        </span>
      </div>
    </div>
  );
}
