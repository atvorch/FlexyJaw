import { Html } from '@react-three/drei';
import { Vector3, type Camera, type Object3D } from 'three';
import type { JawModel } from '../data/model';
import { originalJawOffsetZ } from '../domain/layout';
import { useJawStore } from '../state/store';

/** Rough label width; labels are right-aligned to their anchor so this keeps them from leaving the view. */
const LABEL_W = 90;
const _p = new Vector3();

/** Project the anchor to the screen but never let the label leave the view. */
function clampToView(el: Object3D, camera: Camera, size: { width: number; height: number }): number[] {
  _p.setFromMatrixPosition(el.matrixWorld).project(camera);
  const x = ((_p.x + 1) / 2) * size.width;
  const y = ((1 - _p.y) / 2) * size.height;
  return [Math.min(size.width - 8, Math.max(LABEL_W + 8, x)), Math.min(size.height - 20, Math.max(20, y))];
}

/** "Adjusted" / "Original" tags beside each jaw, outside the patient's right end (viewer's left from the front). */
export function JawLabels({ model }: { model: JawModel }) {
  const showOriginal = useJawStore((s) => s.showOriginal);
  const gap = useJawStore((s) => s.originalGapMm);
  const b = model.bounds;
  const x = b.max.x + 4, y = (b.min.y + b.max.y) / 2, z = (b.min.z + b.max.z) / 2;

  return (
    <>
      <Html position={[x, y, z]} calculatePosition={clampToView} zIndexRange={[4, 0]} pointerEvents="none">
        <div className="jaw-label">Adjusted</div>
      </Html>
      {showOriginal && (
        <Html
          position={[x, y, z + originalJawOffsetZ(b, gap)]}
          calculatePosition={clampToView}
          zIndexRange={[4, 0]}
          pointerEvents="none"
        >
          <div className="jaw-label">Original</div>
        </Html>
      )}
    </>
  );
}
