import type { ReactNode } from 'react';
import { JAW_VIEWS, type JawView } from '../../domain/layout';
import { useJawStore } from '../../state/store';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Small schematic glyph per view: arch outlines for top / bottom, a row of crowns for front, an arrow for the sides. */
const ICONS: Record<JawView, ReactNode> = {
  upper: <path {...stroke} d="M4 15V10a6 6 0 0 1 12 0v5" />,
  lower: <path {...stroke} d="M4 5v5a6 6 0 0 0 12 0V5" />,
  front: (
    <g {...stroke}>
      <rect x="3" y="5" width="4" height="10" rx="1.5" />
      <rect x="8" y="4" width="4" height="12" rx="1.5" />
      <rect x="13" y="5" width="4" height="10" rx="1.5" />
    </g>
  ),
  // drawn as seen from the front: the patient's right is the viewer's left
  right: <path {...stroke} d="M15 10H4m0 0 4-4m-4 4 4 4" />,
  left: <path {...stroke} d="M5 10h11m0 0-4-4m4 4-4 4" />,
};

/** Camera presets across the top of the 3D view; the lit one turns off once the user orbits away. */
export function ViewToolbar() {
  const active = useJawStore((s) => s.activeView);
  const requestView = useJawStore((s) => s.requestView);

  return (
    <div className="view-toolbar" role="toolbar" aria-label="Camera views">
      {JAW_VIEWS.map((v) => (
        <button key={v.id} className={active === v.id ? 'on' : undefined} title={v.title} onClick={() => requestView(v.id)}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            {ICONS[v.id]}
          </svg>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}
