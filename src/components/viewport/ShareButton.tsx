import { useEffect, useRef, useState } from 'react';
import { buildShareUrl } from '../../state/shareLink';
import { selectUnsaved, useJawStore } from '../../state/store';

type Status = { kind: 'idle' } | { kind: 'copied'; unsaved: boolean } | { kind: 'manual'; url: string };

/** Copies a view-only link reproducing the current toggles and adjustments. */
export function ShareButton() {
  const viewOnly = useJawStore((s) => s.viewOnly);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const manualInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (status.kind === 'manual') manualInput.current?.select();
  }, [status]);

  const share = async () => {
    const s = useJawStore.getState();
    const url = buildShareUrl(
      {
        gums: s.visibility.gums,
        upper: s.visibility.upper,
        lower: s.visibility.lower,
        highlightAdjusted: s.highlightAdjusted,
        showOriginal: s.showOriginal,
        realistic: s.realistic,
        toothShine: s.toothShine,
      },
      s.adjustments,
    );
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: 'copied', unsaved: selectUnsaved(s) });
      timer.current = setTimeout(() => setStatus({ kind: 'idle' }), 2500);
    } catch {
      // clipboard blocked (permissions, insecure origin): let the user copy it themselves
      setStatus({ kind: 'manual', url });
    }
  };

  return (
    <div className="share">
      {viewOnly && <span className="view-only-badge">View only</span>}
      <button className="share-button" title="Copy a view-only link to this view" onClick={share}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1" />
          <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
        </svg>
        Share
      </button>

      {status.kind === 'copied' && (
        <div className="share-pop" role="status">
          <strong>Link copied</strong>
          <span className="muted">
            Opens view-only with the current toggles.{status.unsaved ? ' Includes your unsaved changes.' : ''}
          </span>
        </div>
      )}
      {status.kind === 'manual' && (
        <div className="share-pop">
          <strong>Copy this view-only link</strong>
          <input ref={manualInput} className="share-url" readOnly value={status.url} onFocus={(e) => e.target.select()} />
          <button onClick={() => setStatus({ kind: 'idle' })}>Done</button>
        </div>
      )}
    </div>
  );
}
