import type { CSSProperties } from 'react';
import { useJawStore } from '../../state/store';

/**
 * The open version's history as a vertical slider at the bottom left of the 3D view, beside the Versions panel,
 * styled like the reflections slider: redo at the top, a scrubber with one tick per step (oldest at the bottom,
 * newest at the top), undo at the bottom. It grows upwards as steps are added, and only appears once there is a
 * change to step through.
 */
export function HistoryRail() {
  const history = useJawStore((s) => s.history);
  const index = useJawStore((s) => s.historyIndex);
  const { goToHistory, undo, redo } = useJawStore.getState();

  const last = history.length - 1;
  // nothing changed in this version yet: nothing to step through
  if (last === 0) return null;

  return (
    <div
      className="float-slider history-slider"
      role="group"
      aria-label="History of this version"
      // the scrubber's height follows the number of steps (see .history-slider)
      style={{ '--steps': last } as CSSProperties}
    >
      {/* a clock with a back arrow: the history */}
      <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6" />
        <path d="M3.5 3.5v3h3" />
        <path d="M10 6.5V10l2.5 1.5" />
      </svg>
      <button className="float-slider-button" title="Redo (Ctrl+Y)" disabled={index === last} onClick={redo}>
        ↷
      </button>
      <input
        type="range"
        min={0}
        max={last}
        step={1}
        value={index}
        list="history-ticks"
        aria-label="Change history"
        title={`Step ${index} of ${last}: ${history[index].label}`}
        onChange={(e) => goToHistory(+e.target.value)}
      />
      <datalist id="history-ticks">
        {history.map((_, i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
      <button className="float-slider-button" title="Undo (Ctrl+Z)" disabled={index === 0} onClick={undo}>
        ↶
      </button>
    </div>
  );
}
