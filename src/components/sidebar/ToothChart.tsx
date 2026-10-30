import { Fragment } from 'react';
import { CHART_ROWS, toothName } from '../../data/fdi';
import { isEdited } from '../../domain/adjustments';
import { useJawStore } from '../../state/store';

/** Dental chart of buttons; the selected tooth is filled, adjusted ones get a dot. */
export function ToothChart() {
  const selected = useJawStore((s) => s.selected);
  const adjustments = useJawStore((s) => s.adjustments);
  const select = useJawStore((s) => s.select);

  return (
    <>
      <div className="chart">
        {CHART_ROWS.map((row, r) => (
          <Fragment key={r}>
            {r > 0 && <div className="chart-gap" />}
            {row.map((fdi, i) => (
              <button
                key={fdi}
                title={toothName(fdi)}
                className={[fdi === selected && 'on', isEdited(adjustments[fdi]) && 'edited', i === 7 && 'midline']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => select(fdi)}
              >
                {fdi}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
      <p className="muted">Patient's right is on the left. Dot = adjusted.</p>
    </>
  );
}
