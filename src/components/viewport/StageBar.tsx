import { useJawStore } from '../../state/store';
import { StageControls } from './StageControls';

/**
 * Treatment stages, at the bottom of the 3D view while the original plan is open. Adjustments are made and
 * shown at the final stage, so a version always opens there and needs no stage control.
 */
export function StageBar() {
  const viewingOriginal = useJawStore((s) => s.viewingOriginal);
  if (!viewingOriginal) return null;
  return (
    <section className="stage-bar" aria-label="Treatment stage">
      <h4 className="changes-title">Treatment stage</h4>
      <StageControls />
    </section>
  );
}
