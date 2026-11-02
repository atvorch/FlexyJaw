import type { ReactNode } from 'react';
import { useJawStore, type JawState } from '../../state/store';

type Part = keyof JawState['visibility'];

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const PARTS: { id: Part; label: string; icon: ReactNode }[] = [
  {
    id: 'gums',
    label: 'Gums',
    // the scalloped gum line around three crowns
    icon: (
      <g {...stroke}>
        <path d="M3 4.5h14" />
        <path d="M3 9c1.6 0 1.8 3 3.5 3S8.4 9 10 9s1.8 3 3.5 3S15.4 9 17 9" />
        <path d="M3 4.5V9M17 4.5V9" />
      </g>
    ),
  },
  {
    id: 'upper',
    label: 'Upper',
    // crowns hanging from the upper arch
    icon: (
      <g {...stroke}>
        <path d="M3 4.5h14" />
        <path d="M4 4.5v6.5a1.75 1.75 0 0 0 3.5 0V4.5M8.25 4.5v8a1.75 1.75 0 0 0 3.5 0v-8M12.5 4.5v6.5a1.75 1.75 0 0 0 3.5 0V4.5" />
      </g>
    ),
  },
  {
    id: 'lower',
    label: 'Lower',
    // crowns standing on the lower arch
    icon: (
      <g {...stroke}>
        <path d="M3 15.5h14" />
        <path d="M4 15.5V9a1.75 1.75 0 0 1 3.5 0v6.5M8.25 15.5v-8a1.75 1.75 0 0 1 3.5 0v8M12.5 15.5V9a1.75 1.75 0 0 1 3.5 0v6.5" />
      </g>
    ),
  },
];

/** Square on/off buttons for the gums and each arch, left of the camera toolbar. Lit = shown. */
export function VisibilityToolbar() {
  const visibility = useJawStore((s) => s.visibility);
  const setVisibility = useJawStore((s) => s.setVisibility);

  return (
    <div className="visibility-toolbar" role="toolbar" aria-label="Show or hide parts of the jaw">
      {PARTS.map((p) => {
        const on = visibility[p.id];
        return (
          <button
            key={p.id}
            className={on ? 'on' : undefined}
            aria-pressed={on}
            title={`${on ? 'Hide' : 'Show'} ${p.label.toLowerCase()}`}
            onClick={() => setVisibility({ [p.id]: !on })}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              {p.icon}
            </svg>
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
