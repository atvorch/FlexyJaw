import { useEffect, useRef } from 'react';
import { TOOTH_SHINE_MAX, TOOTH_SHINE_MIN, useJawStore } from '../../state/store';

const STEP = 0.05;

/**
 * Vertical slider at the right of the 3D view for how much the teeth reflect light: down to matte, up to extra
 * glossy. The teeth keep their colour; only highlights and reflections change. The mouse wheel over it steps
 * the value; click the percentage for 100%.
 */
export function ShineSlider() {
  const shine = useJawStore((s) => s.toothShine);
  const setShine = useJawStore((s) => s.setToothShine);
  const percent = Math.round(shine * 100);
  const panel = useRef<HTMLDivElement>(null);

  // a native listener, since React's wheel handlers are passive and couldn't stop the page from also using it
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!e.deltaY) return;
      const { toothShine, setToothShine } = useJawStore.getState();
      // wheel up = shinier, one step per notch; rounded so repeated steps don't drift off the 5% grid
      setToothShine(Math.round((toothShine + (e.deltaY < 0 ? STEP : -STEP)) / STEP) * STEP);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={panel} className="shine-slider" title="Tooth reflections: lower it to reduce the glare on the teeth (scroll to adjust)">
      {/* a glint: the reflection being controlled */}
      <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5z" />
        <path d="M15.5 13.5v3M14 15h3" />
      </svg>
      <input
        type="range"
        aria-label="Tooth reflections"
        min={TOOTH_SHINE_MIN}
        max={TOOTH_SHINE_MAX}
        step={STEP}
        value={shine}
        onChange={(e) => setShine(+e.target.value)}
      />
      <button
        className="shine-value"
        title={percent === 100 ? 'Tooth reflections' : 'Back to 100%'}
        disabled={percent === 100}
        onClick={() => setShine(1)}
      >
        {percent}%
      </button>
    </div>
  );
}
