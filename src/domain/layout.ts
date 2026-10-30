import { Vector3, type Box3 } from 'three';

/** Vertical offset of the original jaw, stacked above the adjusted one (-z is up). */
export function originalJawOffsetZ(bounds: Box3, gapMm: number): number {
  return -(bounds.max.z - bounds.min.z) - gapMm;
}

/** Preset camera views of the main jaw. Sides are the patient's right / left. */
export type JawView = 'front' | 'right' | 'left' | 'upper' | 'lower';

/** Toolbar order, top to bottom of the mouth with the sides around the front. */
export const JAW_VIEWS: { id: JawView; label: string; title: string }[] = [
  { id: 'upper', label: 'Top', title: 'Top: biting surface of the upper arch (hides the lower arch)' },
  { id: 'right', label: 'Right', title: "Right: the patient's right side" },
  { id: 'front', label: 'Front', title: 'Front view (F)' },
  { id: 'left', label: 'Left', title: "Left: the patient's left side" },
  { id: 'lower', label: 'Bottom', title: 'Bottom: biting surface of the lower arch (hides the upper arch)' },
];

/** Arch views look straight onto the biting surface, so the opposite arch must be hidden. */
export const isArchView = (v: JawView): v is 'upper' | 'lower' => v === 'upper' || v === 'lower';

export interface CameraPose {
  target: Vector3;
  position: Vector3;
}

/**
 * Arch views can't sit exactly on the vertical axis: the orbit controls keep -z as "up", which is
 * undefined when looking straight along it. Leaning this far (≈0.8° at 150 mm) toward the front makes
 * the front teeth land at the top of the picture.
 */
const ARCH_VIEW_LEAN_MM = 2;

/**
 * Camera framing for a preset. Front and side views include the original jaw when it is shown above;
 * arch views look along the vertical axis, so they frame the adjusted jaw only.
 */
export function cameraPose(view: JawView, bounds: Box3, showOriginal: boolean, gapMm: number): CameraPose {
  const target = bounds.getCenter(new Vector3());
  const stacked = showOriginal && !isArchView(view);
  if (stacked) target.z += originalJawOffsetZ(bounds, gapMm) / 2;
  const d = stacked ? 230 : 150;
  const { x, y, z } = target;

  switch (view) {
    case 'front': // the mouth faces -y; a little above centre (-z is up)
      return { target, position: new Vector3(x, y - d, z - 10) };
    case 'right': // patient's right is +x
      return { target, position: new Vector3(x + d, y - 10, z - 10) };
    case 'left':
      return { target, position: new Vector3(x - d, y - 10, z - 10) };
    case 'upper': // from below, looking up at the upper biting surface
      return { target, position: new Vector3(x, y - ARCH_VIEW_LEAN_MM, z + d) };
    case 'lower': // from above, looking down at the lower biting surface
      return { target, position: new Vector3(x, y + ARCH_VIEW_LEAN_MM, z - d) };
  }
}
