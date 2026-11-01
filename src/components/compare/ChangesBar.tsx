import { useEffect, useMemo, useState } from 'react';
import { toothName } from '../../data/fdi';
import type { JawModel, ToothModel } from '../../data/model';
import { isEdited, type ToothAdjustment } from '../../domain/adjustments';
import { summarizeChange, type ChangeSummary } from '../../domain/analysis';
import { useJawStore } from '../../state/store';
import { renderToothThumbnail } from './toothThumbnail';

const THUMB_PX = 64;
/** Wait for a burst of changes (a gizmo drag) to pause before redrawing the picture. */
const REDRAW_DELAY_MS = 150;

/** Picture of the adjusted tooth, redrawn shortly after its adjustment stops changing. */
function ToothThumb({ model, tooth, adjustment }: { model: JawModel; tooth: ToothModel; adjustment: ToothAdjustment }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSrc(renderToothThumbnail(model, tooth, adjustment, THUMB_PX)), src ? REDRAW_DELAY_MS : 0);
    return () => clearTimeout(timer);
    // src only decides whether the first draw waits; it must not retrigger drawing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, tooth, adjustment]);
  return src ? (
    <img className="card-thumb" src={src} width={THUMB_PX} height={THUMB_PX} alt="" draggable={false} />
  ) : (
    <span className="card-thumb" />
  );
}

/** A card per changed tooth along the bottom of the view; clicking opens its comparison. */
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
      .map((t): { tooth: ToothModel; adjustment: ToothAdjustment; summary: ChangeSummary } => ({
        tooth: t,
        adjustment: adjustments[t.fdi],
        summary: summarizeChange(model, t, adjustments[t.fdi]),
      }));
  }, [model, adjustments]);

  if (!model || !changed.length) return null;
  return (
    <section className="changes-bar" aria-label="Adjusted teeth">
      <h4 className="changes-title">
        Adjusted teeth <span className="changes-count">{changed.length}</span>
      </h4>
      <div className="changes-cards">
        {changed.map(({ tooth, adjustment, summary }) => (
          <button
            key={tooth.fdi}
            // lit when the tooth is open in the comparison or selected on the jaw
            className={`tooth-card${tooth.fdi === compared || tooth.fdi === selected ? ' on' : ''}`}
            title={`${toothName(tooth.fdi)}: open the comparison`}
            // the camera follows on its own if the tooth isn't near the middle of the view
            onClick={() => (compared === tooth.fdi ? closeCompare() : openCompare(tooth.fdi))}
          >
            <ToothThumb model={model} tooth={tooth} adjustment={adjustment} />
            <span className="card-fdi">{tooth.fdi}</span>
            <span className="card-stats">
              {summary.totalDeg.toFixed(1)}°<span className="card-sep"> · </span>
              {summary.movedMm.toFixed(1)} mm
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
