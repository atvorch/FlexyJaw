import { Color, DoubleSide, MeshPhongMaterial, type Material } from 'three';

export const COLORS = {
  tooth: new Color(0.96, 0.935, 0.905),
  /** One highlight look for selected, compared and "highlight adjusted" teeth. */
  toothLit: new Color(0.66, 0.8, 1.0),
  emissiveLit: new Color(0x061a3a),
  emissiveHover: new Color(0x222833),
  none: new Color(0),
  gum: new Color(0xec8780),
  ambient: new Color(0.624, 0.604, 0.604),
  background: 0xf7f7f9,
};

// three divides diffuse light by π, so the original viewer's 0.62 ambient / 0.39 headlight are scaled up
// (and nudged for a little more shape than the original's SSAO pass gave it)
export const LIGHTING = {
  ambientIntensity: 0.82 * Math.PI,
  headlightIntensity: 0.5 * Math.PI,
};

export const createToothMaterial = () =>
  new MeshPhongMaterial({ color: COLORS.tooth.clone(), specular: 0x3a3a3a, shininess: 45, emissive: 0x000000 });

export const createGumMaterial = () =>
  new MeshPhongMaterial({ color: COLORS.gum, specular: 0x333333, shininess: 30, side: DoubleSide });

export const gumMaterial = createGumMaterial();

/** Opacity of the upper jaw while it is faded out of the way of a lower tooth. */
export const FADED_OPACITY = 0.18;
const FADE_PER_SECOND = 10;

/**
 * Ease a material toward a target opacity, one frame at a time. Switches transparency on only while it is
 * needed, so a fully opaque jaw renders (and sorts) exactly as before.
 */
export function stepFade(material: Material, target: number, dt: number) {
  if (material.opacity === target) return;
  const next = material.opacity + (target - material.opacity) * Math.min(1, dt * FADE_PER_SECOND);
  material.opacity = Math.abs(next - target) < 0.01 ? target : next;
  const transparent = material.opacity < 1;
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    // depth writing stays on: the lower jaw is opaque and drawn first, so it still shows through, and the
    // upper teeth and gum keep their proper front/back order instead of the gum flashing over the teeth
    material.needsUpdate = true;
  }
}

/** Plain tooth material shared by every tooth of the original (unadjusted) jaw. */
export const originalToothMaterial = createToothMaterial();
