import { Vector3, type Box3 } from 'three';

/** Vertical offset of the original jaw, stacked above the adjusted one (-z is up). */
export function originalJawOffsetZ(bounds: Box3, gapMm: number): number {
  return -(bounds.max.z - bounds.min.z) - gapMm;
}

export interface CameraPose {
  target: Vector3;
  position: Vector3;
}

/** Front-on camera framing the jaw, or both jaws when the original is shown above. */
export function frontView(bounds: Box3, showOriginal: boolean, gapMm: number): CameraPose {
  const target = bounds.getCenter(new Vector3());
  let distance = 150;
  if (showOriginal) {
    target.z += originalJawOffsetZ(bounds, gapMm) / 2;
    distance = 230;
  }
  return { target, position: new Vector3(target.x, target.y - distance, target.z - 10) };
}
