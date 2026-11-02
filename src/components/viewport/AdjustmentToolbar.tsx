import type { ReactNode } from 'react';
import { useJawStore } from '../../state/store';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** A crown outline, shared by the icons below. */
const CROWN = 'M6.5 4.5c-1.6 0-2.5 1.3-2.5 3 0 1.5.6 2.4 1 3.7.4 1.4.5 4.3 1.7 4.3 1 0 1-2.9 2.8-2.9s1.8 2.9 2.8 2.9c1.2 0 1.3-2.9 1.7-4.3.4-1.3 1-2.2 1-3.7 0-1.7-.9-3-2.5-3-1.2 0-1.8.6-3 .6s-1.8-.6-3-.6z';

const ICONS: Record<'apply' | 'highlight' | 'original', ReactNode> = {
  // a tooth with a turn arrow: adjustments applied
  apply: (
    <g {...stroke}>
      <path d={CROWN} transform="translate(-1.5 0.5) scale(0.92)" />
      <path d="M15.5 3.5a4 4 0 0 1 2 3.5" />
      <path d="M17.6 4.6l-.1 2.4-2.3-.4" />
    </g>
  ),
  // a filled tooth: adjusted teeth highlighted
  highlight: (
    <g {...stroke}>
      <path d={CROWN} transform="translate(0.5 0.5) scale(0.92)" fill="currentColor" fillOpacity="0.35" />
    </g>
  ),
  // the original arch drawn dashed above the adjusted one
  original: (
    <g {...stroke}>
      <path d="M4 9.5V8a6 3.5 0 0 1 12 0v1.5" strokeDasharray="1.6 1.8" />
      <path d="M4 16.5V15a6 3.5 0 0 1 12 0v1.5" />
    </g>
  ),
};

/**
 * Square on/off buttons right of the camera toolbar: apply adjustments, highlight adjusted teeth and show the
 * original jaw above (with its distance slider underneath while on). Hidden on the original plan, which has no
 * adjustments to apply, highlight or compare.
 */
export function AdjustmentToolbar() {
  const viewingOriginal = useJawStore((s) => s.viewingOriginal);
  const apply = useJawStore((s) => s.applyAdjustments);
  const highlight = useJawStore((s) => s.highlightAdjusted);
  const showOriginal = useJawStore((s) => s.showOriginal);
  const gap = useJawStore((s) => s.originalGapMm);
  const s = useJawStore.getState();
  if (viewingOriginal) return null;

  const buttons = [
    { id: 'apply', label: 'Apply', on: apply, title: 'Apply adjustments (A)', toggle: () => s.setApplyAdjustments(!apply) },
    { id: 'highlight', label: 'Highlight', on: highlight, title: 'Highlight adjusted teeth (H)', toggle: () => s.setHighlightAdjusted(!highlight) },
    { id: 'original', label: 'Original', on: showOriginal, title: 'Show the original jaw above', toggle: () => s.setShowOriginal(!showOriginal) },
  ] as const;

  return (
    <div className="adjustment-toolbar-wrap">
      <div className="visibility-toolbar" role="toolbar" aria-label="Adjustment display">
        {buttons.map((b) => (
          <button key={b.id} className={b.on ? 'on' : undefined} aria-pressed={b.on} title={b.title} onClick={b.toggle}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              {ICONS[b.id]}
            </svg>
            <span>{b.label}</span>
          </button>
        ))}
      </div>
      {showOriginal && (
        <label className="gap-pop" title="Distance between the original jaw and the adjusted one">
          <span className="muted">Distance</span>
          <input type="range" min={-10} max={60} step={1} value={gap} onChange={(e) => s.setOriginalGap(+e.target.value)} />
          <span className="gap-value">{gap} mm</span>
        </label>
      )}
    </div>
  );
}
