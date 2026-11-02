import type { Axis } from '../../data/model';
import { ZERO_ADJUSTMENT, type ToothAdjustment, type Vec3 } from '../../domain/adjustments';
import { selectCanEdit, useJawStore } from '../../state/store';
import { SliderRow } from './SliderRow';

const DEG = 180 / Math.PI;
const AXES: Axis[] = ['x', 'y', 'z'];

const withComponent = (v: Vec3, i: number, value: number): Vec3 => v.map((c, j) => (j === i ? value : c)) as Vec3;

/**
 * Gizmo mode, rotate / move sliders and reset for the selected tooth, in the tooth panel. Locked away from the
 * final stage.
 */
export function ToothEditor() {
  const model = useJawStore((s) => s.model);
  const selected = useJawStore((s) => s.selected);
  const adjustment = useJawStore((s) => (s.selected != null ? s.adjustments[s.selected] : undefined)) ?? ZERO_ADJUSTMENT;
  const canEdit = useJawStore(selectCanEdit);
  const applyOn = useJawStore((s) => s.applyAdjustments);
  const mode = useJawStore((s) => s.gizmoMode);
  const viewOnly = useJawStore((s) => s.viewOnly);
  const viewingOriginal = useJawStore((s) => s.viewingOriginal);
  const s = useJawStore.getState();

  const tooth = model?.teeth.find((t) => t.fdi === selected);
  if (!tooth) return null;

  const update = (patch: Partial<ToothAdjustment>) => s.setAdjustment(tooth.fdi, { ...adjustment, ...patch });

  return (
    <div className="tooth-editor">
      {viewOnly ? (
        <p className="muted">This is a view-only link, so teeth can't be changed here.</p>
      ) : !canEdit ? (
        <div>
          <p className="muted">
            {applyOn
              ? 'Teeth can only be adjusted at the final stage.'
              : 'Adjustments are hidden. Turn on "Apply adjustments" to edit.'}
          </p>
          {applyOn && <button onClick={() => s.editTooth(tooth.fdi)}>Go to final stage</button>}
        </div>
      ) : (
        <>
          <div className="btns" style={{ marginBottom: 8 }}>
            <button className={mode === 'rotate' ? 'on' : undefined} onClick={() => s.setGizmoMode('rotate')}>
              Rotate gizmo
            </button>
            <button className={mode === 'translate' ? 'on' : undefined} onClick={() => s.setGizmoMode('translate')}>
              Move gizmo
            </button>
          </div>

          {AXES.map((a, i) => (
            <SliderRow
              key={`r${a}`}
              label={`Rotate ${a.toUpperCase()}${a === tooth.longAxis ? ' ⟳' : ''}`}
              value={adjustment.rotation[i] * DEG}
              min={-45}
              max={45}
              step={0.5}
              onChange={(deg) => update({ rotation: withComponent(adjustment.rotation, i, deg / DEG) })}
            />
          ))}
          <p className="muted">⟳ marks the axis running along the tooth (spin around the long axis).</p>
          {AXES.map((a, i) => (
            <SliderRow
              key={`m${a}`}
              label={`Move ${a.toUpperCase()} mm`}
              value={adjustment.move[i]}
              min={-5}
              max={5}
              step={0.1}
              onChange={(mm) => update({ move: withComponent(adjustment.move, i, mm) })}
            />
          ))}

          <div className="btns" style={{ marginTop: 8 }}>
            <button onClick={() => s.resetTooth(tooth.fdi)}>Reset this tooth</button>
          </div>
          <p className="muted">
            Adjustments apply to the final stage only, in the tooth's own frame. Playback blends them in over the last step.
            {viewingOriginal && ' You are on the original plan: your first change starts a new saved version and the original stays as it is.'}
          </p>
        </>
      )}
    </div>
  );
}
