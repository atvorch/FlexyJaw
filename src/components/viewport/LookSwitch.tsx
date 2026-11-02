import { useJawStore } from '../../state/store';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/**
 * Rendering style: the plain look, or the realistic one (shading in the gaps, textured glossy gums).
 * The choice is mirrored into the address (`realistic=1`), so reloads and share links keep it.
 */
export function LookSwitch() {
  const realistic = useJawStore((s) => s.realistic);
  const setRealistic = useJawStore((s) => s.setRealistic);

  return (
    <div className="look-switch" role="radiogroup" aria-label="Rendering style">
      <button
        role="radio"
        aria-checked={!realistic}
        className={realistic ? undefined : 'on'}
        title="Plain look: flat, even lighting"
        onClick={() => setRealistic(false)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle {...stroke} cx="10" cy="10" r="6" />
        </svg>
        Plain
      </button>
      <button
        role="radio"
        aria-checked={realistic}
        className={realistic ? 'on' : undefined}
        title="Realistic look: shading in the gaps, textured glossy gums"
        onClick={() => setRealistic(true)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle {...stroke} cx="10" cy="10" r="6" />
          {/* a shaded sphere with a highlight */}
          <path d="M10 4a6 6 0 0 1 0 12 4.2 6 0 0 0 0-12z" fill="currentColor" opacity="0.45" />
          <circle cx="7.6" cy="7.6" r="1.3" fill="currentColor" />
        </svg>
        Realistic
      </button>
    </div>
  );
}
