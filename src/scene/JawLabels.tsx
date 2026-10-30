import { Html } from '@react-three/drei';
import { Box3, Vector3, type Camera } from 'three';
import type { JawModel } from '../data/model';
import { originalJawOffsetZ } from '../domain/layout';
import { useJawStore } from '../state/store';

/** Rough label width; labels are right-aligned to their anchor so this keeps them from leaving the view. */
const LABEL_W = 90;
const GAP_PX = 10;
const _p = new Vector3();

/**
 * Place a label just left of the jaw as it appears on screen, from any camera angle: project the jaw's
 * bounding-box corners and anchor to the leftmost one, vertically centred. Never let it leave the view.
 */
function leftOfBox(box: Box3) {
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) => new Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z),
  );
  return (_el: unknown, camera: Camera, size: { width: number; height: number }): number[] => {
    let minX = Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of corners) {
      _p.copy(c).project(camera);
      const x = ((_p.x + 1) / 2) * size.width, y = ((1 - _p.y) / 2) * size.height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const x = minX - GAP_PX, y = (minY + maxY) / 2;
    return [Math.min(size.width - 8, Math.max(LABEL_W + 8, x)), Math.min(size.height - 20, Math.max(20, y))];
  };
}

/** "Adjusted" / "Original" tags beside each jaw. */
export function JawLabels({ model }: { model: JawModel }) {
  const showOriginal = useJawStore((s) => s.showOriginal);
  const gap = useJawStore((s) => s.originalGapMm);
  const adjustedBox = model.bounds;
  const originalBox = adjustedBox.clone().translate(new Vector3(0, 0, originalJawOffsetZ(adjustedBox, gap)));
  const center = adjustedBox.getCenter(new Vector3());

  return (
    <>
      <Html position={center} calculatePosition={leftOfBox(adjustedBox)} zIndexRange={[4, 0]} pointerEvents="none">
        <div className="jaw-label">Adjusted</div>
      </Html>
      {showOriginal && (
        <Html
          position={originalBox.getCenter(new Vector3())}
          calculatePosition={leftOfBox(originalBox)}
          zIndexRange={[4, 0]}
          pointerEvents="none"
        >
          <div className="jaw-label">Original</div>
        </Html>
      )}
    </>
  );
}
