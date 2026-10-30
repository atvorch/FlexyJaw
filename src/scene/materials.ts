import { Color, DoubleSide, MeshPhongMaterial } from 'three';

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

export const gumMaterial = new MeshPhongMaterial({ color: COLORS.gum, specular: 0x333333, shininess: 30, side: DoubleSide });

/** Plain tooth material shared by every tooth of the original (unadjusted) jaw. */
export const originalToothMaterial = createToothMaterial();
