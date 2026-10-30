import { useJawStore } from '../../state/store';

const timeOf = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Timeline of adjustment steps: undo / redo buttons around a scrubber, one tick per step. */
export function HistoryBar() {
  const history = useJawStore((s) => s.history);
  const index = useJawStore((s) => s.historyIndex);
  const { goToHistory, undo, redo } = useJawStore.getState();

  const last = history.length - 1;
  const entry = history[index];
  const empty = last === 0;

  return (
    <div className="history-bar">
      <button title="Undo (Ctrl+Z)" disabled={index === 0} onClick={undo}>
        ↶
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(1, last)}
        step={1}
        value={index}
        disabled={empty}
        list="history-ticks"
        aria-label="Change history"
        onChange={(e) => goToHistory(+e.target.value)}
      />
      <datalist id="history-ticks">
        {history.map((_, i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
      <button title="Redo (Ctrl+Y)" disabled={index === last} onClick={redo}>
        ↷
      </button>
      <div className="history-label" title={timeOf(entry.at)}>
        <span className="history-step">
          {empty ? 'No changes yet' : `Step ${index} / ${last}`}
        </span>
        {!empty && <span className="history-desc">{entry.label}</span>}
      </div>
    </div>
  );
}
