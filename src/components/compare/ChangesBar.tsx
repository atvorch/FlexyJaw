import { useMemo } from 'react';
import { toothName } from '../../data/fdi';
import { isEdited } from '../../domain/adjustments';
import { summarizeChange } from '../../domain/analysis';
import { useJawStore } from '../../state/store';

/** One chip per changed tooth along the bottom of the view; clicking opens its comparison. */
export function ChangesBar() {
  const model = useJawStore((s) => s.model);
  const adjustments = useJawStore((s) => s.adjustments);
  const compared = useJawStore((s) => s.compared);
  const selected = useJawStore((s) => s.selected);
  const openCompare = useJawStore((s) => s.openCompare);
  const closeCompare = useJawStore((s) => s.closeCompare);

  const changed = useMemo(() => {
    if (!model) return [];
    return model.teeth
      .filter((t) => isEdited(adjustments[t.fdi]))
      .map((t) => ({ fdi: t.fdi, summary: summarizeChange(model, t, adjustments[t.fdi]) }));
  }, [model, adjustments]);

  if (!changed.length) return null;
  return (
    <section className="changes-bar" aria-label="Adjusted teeth">
      <h4 className="changes-title">
        Adjusted teeth <span className="changes-count">{changed.length}</span>
        <button className="changes-summary" onClick={() => useJawStore.getState().setReportOpen(true)}>
          Summary for orthodontist →
        </button>
      </h4>
      <div className="changes-chips">
        {changed.map(({ fdi, summary }) => (
          <button
            key={fdi}
            // lit when the tooth is open in the comparison or selected on the jaw
            className={fdi === compared || fdi === selected ? 'on' : undefined}
            title={toothName(fdi)}
            onClick={() => (compared === fdi ? closeCompare() : openCompare(fdi))}
          >
            <span className="chip-fdi">{fdi}</span>
            <span className="chip-stats">
              {summary.totalDeg.toFixed(1)}° · {summary.movedMm.toFixed(1)} mm
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
