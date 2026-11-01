import type { ReactNode } from 'react';
import { useJawStore } from '../../state/store';

function Check({ checked, onChange, children }: { checked: boolean; onChange(v: boolean): void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {children}
    </label>
  );
}

/** Apply / highlight / stack-the-original: only meaningful when there are adjustments to look at. */
function AdjustmentToggles() {
  const apply = useJawStore((s) => s.applyAdjustments);
  const highlight = useJawStore((s) => s.highlightAdjusted);
  const showOriginal = useJawStore((s) => s.showOriginal);
  const gap = useJawStore((s) => s.originalGapMm);
  const s = useJawStore.getState();

  return (
    <div className="stack">
      <Check checked={apply} onChange={s.setApplyAdjustments}>
        Apply adjustments <span className="muted">(A)</span>
      </Check>
      <Check checked={highlight} onChange={s.setHighlightAdjusted}>
        Highlight adjusted teeth <span className="muted">(H)</span>
      </Check>
      <Check checked={showOriginal} onChange={s.setShowOriginal}>
        Show original jaw above <span className="muted">(unadjusted plan)</span>
      </Check>
      {showOriginal && (
        <div className="row">
          <span className="muted" style={{ width: 62 }}>Distance</span>
          <input type="range" min={-10} max={60} step={1} value={gap} onChange={(e) => s.setOriginalGap(+e.target.value)} />
          <span style={{ width: 48, textAlign: 'right' }}>{gap} mm</span>
        </div>
      )}
    </div>
  );
}

export function DisplayToggles() {
  const visibility = useJawStore((s) => s.visibility);
  const viewingOriginal = useJawStore((s) => s.viewingOriginal);
  const s = useJawStore.getState();

  return (
    <>
      <div className="row" style={{ gap: 14 }}>
        <Check checked={visibility.gums} onChange={(gums) => s.setVisibility({ gums })}>Gums</Check>
        <Check checked={visibility.upper} onChange={(upper) => s.setVisibility({ upper })}>Upper</Check>
        <Check checked={visibility.lower} onChange={(lower) => s.setVisibility({ lower })}>Lower</Check>
      </div>
      {viewingOriginal ? (
        // nothing is adjusted on the original plan, so there is nothing to apply, highlight or compare
        <p className="muted toggles-note">
          Showing the original plan only. Edit a tooth or open a saved version to compare adjustments.
        </p>
      ) : (
        <AdjustmentToggles />
      )}
    </>
  );
}
