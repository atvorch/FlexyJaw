import { Quaternion, Vector3 } from 'three';
import type { JawModel, ToothModel } from '../../data/model';
import { archFrame } from '../../domain/analysis';

export type ComparePreset = 'front' | 'side' | 'top';

export const PRESETS: { id: ComparePreset; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Biting edge' },
];

/** Free rotation (applied in the camera's own frame) and zoom on top of a preset. Mutated while dragging. */
export interface CompareOrbit {
  q: Quaternion;
  zoom: number;
}

export const createOrbit = (): CompareOrbit => ({ q: new Quaternion(), zoom: 1 });
export const resetOrbit = (o: CompareOrbit) => {
  o.q.identity();
  o.zoom = 1;
};

/** Preset frame: D = direction from tooth to camera, U = screen up, R = screen right. */
export function presetFrame(model: JawModel, tooth: ToothModel, preset: ComparePreset) {
  const f = archFrame(model, tooth);
  const D = (preset === 'front' ? f.buccal : preset === 'side' ? f.mesial : f.occlusal).clone();
  // looking along the tooth: keep the lips at the bottom of the picture
  const U = preset === 'top' ? f.buccal.clone().negate() : new Vector3(0, 0, -1);
  const R = new Vector3().crossVectors(D.clone().negate(), U).normalize();
  return { center: f.center, plan: f.plan, D, U, R };
}

/** Neighbouring teeth in the same arch, for context in the front view. */
export function archNeighbours(model: JawModel, tooth: ToothModel): ToothModel[] {
  return [model.teeth[tooth.index - 1], model.teeth[tooth.index + 1]].filter(
    (t): t is ToothModel => !!t && t.upper === tooth.upper,
  );
}
