import { Fragment } from 'react';
import { CHART_ROWS, toothName } from '../../data/fdi';
import { isEdited } from '../../domain/adjustments';
import { hoverHandlers, useJawStore } from '../../state/store';

/**
 * Every tooth by number, in a panel above the adjusted teeth: click one to select it. The tooth in focus
 * (selected, or opened from its adjusted-tooth card) is filled; adjusted ones get a dot. Hovering a number
 * lights that tooth on the jaw.
 */
export function ToothChart() {
  const selected = useJawStore((s) => s.selected);
  // a tooth opened from the adjusted-teeth cards is in focus too, as it is on the jaw and on its card
  const compared = useJawStore((s) => s.compared);
  const adjustments = useJawStore((s) => s.adjustments);
  const select = useJawStore((s) => s.select);
  const followTooth = useJawStore((s) => s.followTooth);

  return (
    <section className="chart-bar" aria-label="All teeth">
      <h4 className="changes-title">
        Teeth <span className="chart-note">Patient's right is on the left · dot = adjusted</span>
      </h4>
      <div className="chart">
        {CHART_ROWS.map((row, r) => (
          <Fragment key={r}>
            {r > 0 && <div className="chart-gap" />}
            {row.map((fdi, i) => (
              <button
                key={fdi}
                title={toothName(fdi)}
                className={[
                  (fdi === selected || fdi === compared) && 'on',
                  isEdited(adjustments[fdi]) && 'edited',
                  i === 7 && 'midline',
                ]
                  .filter(Boolean)
                  .join(' ')}
                // the camera turns to face it, as for an adjusted-tooth card
                onClick={() => {
                  select(fdi);
                  followTooth(fdi);
                }}
                {...hoverHandlers(fdi)}
              >
                {fdi}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
