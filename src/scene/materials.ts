import { Color, DoubleSide, MeshPhongMaterial, MeshPhysicalMaterial, type Material } from 'three';

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

const PHONG_TOOTH_SPECULAR = 0x3a / 0xff;

export const createToothMaterial = () =>
  new MeshPhongMaterial({
    color: COLORS.tooth.clone(),
    specular: new Color().setScalar(PHONG_TOOTH_SPECULAR),
    shininess: 45,
    emissive: 0x000000,
  });

export const createGumMaterial = () =>
  new MeshPhongMaterial({ color: COLORS.gum, specular: 0x333333, shininess: 30, side: DoubleSide });

export const gumMaterial = createGumMaterial();

/* ------------------------------------------------------------------ realistic look ------------------------------ */

/** Colours and lighting for the realistic look; tuned by eye against the treatment-plan viewer. */
export const REAL = {
  tooth: new Color(0.9, 0.89, 0.87),
  gum: new Color(0.84, 0.33, 0.31),
  ambientIntensity: 0.3 * Math.PI,
  headlightIntensity: 0.5 * Math.PI,
  keyIntensity: 0.45 * Math.PI,
  envIntensity: 0.3,
};

const REAL_TOOTH_CLEARCOAT = 0.7;
const REAL_TOOTH_SHEEN = 0.5;

export const createRealToothMaterial = () =>
  new MeshPhysicalMaterial({
    color: REAL.tooth.clone(),
    roughness: 0.45,
    // wet enamel: a sharp gloss layer over a softer base
    clearcoat: REAL_TOOTH_CLEARCOAT,
    clearcoatRoughness: 0.16,
    // a cool sheen at grazing angles stands in for the translucent edges of real teeth
    sheen: REAL_TOOTH_SHEEN,
    sheenColor: new Color(0.7, 0.78, 0.92),
    sheenRoughness: 0.45,
    envMapIntensity: REAL.envIntensity,
    emissive: 0x000000,
  });

/**
 * Set how much a tooth material reflects light, for the shine slider (1 = as designed, 0 = matte). Only the
 * highlights, gloss and reflections change; the colour of the tooth itself stays exactly as it is.
 */
export function setToothShine(material: MeshPhongMaterial | MeshPhysicalMaterial, shine: number) {
  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = Math.min(1, REAL_TOOTH_CLEARCOAT * shine);
    material.sheen = Math.min(1, REAL_TOOTH_SHEEN * shine);
    material.specularIntensity = shine;
    material.envMapIntensity = REAL.envIntensity * shine;
  } else {
    material.specular.setScalar(PHONG_TOOTH_SPECULAR * shine);
  }
}

/*
 * Gum surface detail without UVs: value noise of the object-space position, turned into a bump through
 * screen-space derivatives. Gives the fine stippled texture of real gum tissue, plus a faint colour mottling.
 */
const GUM_GLSL = /* glsl */ `
varying vec3 vGumPos;
float gumHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float gumNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(gumHash(i), gumHash(i + vec3(1, 0, 0)), f.x), mix(gumHash(i + vec3(0, 1, 0)), gumHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(gumHash(i + vec3(0, 0, 1)), gumHash(i + vec3(1, 0, 1)), f.x), mix(gumHash(i + vec3(0, 1, 1)), gumHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
vec3 gumBump(vec3 surfPos, vec3 surfNorm, float h) {
  vec3 sx = dFdx(surfPos);
  vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;
/** Stipple size (features per mm) and depth (mm). */
const GUM_STIPPLE_FREQ = '2.6';
const GUM_STIPPLE_DEPTH = '0.045';

export function createRealGumMaterial() {
  const material = new MeshPhysicalMaterial({
    color: REAL.gum.clone(),
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    // warm grazing glow, as light scatters inside the tissue
    sheen: 0.25,
    sheenColor: new Color(0.95, 0.4, 0.38),
    sheenRoughness: 0.5,
    envMapIntensity: REAL.envIntensity,
    side: DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGumPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGumPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GUM_GLSL}`)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= 0.94 + 0.12 * gumNoise(vGumPos * 0.45);',
      )
      // the clear coat keeps the smooth normal, so the wet gloss stays smooth over the stippled tissue
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        float gumH = ${GUM_STIPPLE_DEPTH} * (gumNoise(vGumPos * ${GUM_STIPPLE_FREQ}) + 0.5 * gumNoise(vGumPos * ${GUM_STIPPLE_FREQ} * 2.3));
        normal = gumBump(-vViewPosition, normal, gumH);`,
      );
  };
  material.customProgramCacheKey = () => 'realistic-gum';
  return material;
}

export const realGumMaterial = createRealGumMaterial();
/** Realistic counterpart of `originalToothMaterial`. */
export const realOriginalToothMaterial = createRealToothMaterial();

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
