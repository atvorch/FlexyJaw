import {
  AmbientLight,
  DirectionalLight,
  LinearSRGBColorSpace,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { JawModel, ToothModel } from '../../data/model';
import { adjustedMatrix, type ToothAdjustment } from '../../domain/adjustments';
import { COLORS, LIGHTING, createToothMaterial } from '../../scene/materials';
import { presetFrame } from './compareView';

/**
 * One hidden renderer draws every card picture and hands back an image URL. Browsers cap the number of live
 * WebGL contexts, so a canvas per card isn't an option.
 */
let shared: {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  light: DirectionalLight;
  adjusted: Mesh;
  planned: Mesh;
} | null = null;

function setup() {
  if (shared) return shared;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const light = new DirectionalLight(0xffffff, LIGHTING.headlightIntensity);
  scene.add(new AmbientLight(COLORS.ambient, LIGHTING.ambientIntensity), light, light.target);
  const camera = new PerspectiveCamera(30, 1, 0.5, 500);

  const adjusted = new Mesh(undefined, createToothMaterial());
  // where the plan had the tooth: a faint blue outline behind the adjusted one
  const planned = new Mesh(
    undefined,
    new MeshPhongMaterial({ color: 0x3f7fe8, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  planned.renderOrder = 1;
  for (const m of [adjusted, planned]) m.matrixAutoUpdate = false;
  scene.add(adjusted, planned);

  shared = { renderer, scene, camera, light, adjusted, planned };
  return shared;
}

/** Front view of one adjusted tooth over its planned position, as a PNG data URL `size` CSS pixels square. */
export function renderToothThumbnail(model: JawModel, tooth: ToothModel, adjustment: ToothAdjustment, size: number): string {
  const t = setup();
  const px = Math.round(size * Math.min(devicePixelRatio || 1, 2));
  t.renderer.setSize(px, px, false);

  const plan = tooth.stageMatrices[model.stageCount - 1];
  t.adjusted.geometry = tooth.geometry;
  t.planned.geometry = tooth.geometry;
  t.adjusted.matrix.copy(adjustedMatrix(tooth, adjustment, plan));
  t.planned.matrix.copy(plan);

  const { center, D, U } = presetFrame(model, tooth, 'front');
  // frames the tooth at roughly 85% of the square's height
  const distance = Math.max(tooth.size.x, tooth.size.y, tooth.size.z) * 2.4;
  t.camera.position.copy(center).addScaledVector(D, distance);
  t.camera.up.copy(U);
  t.camera.lookAt(center);
  t.camera.updateProjectionMatrix();
  t.light.position.copy(t.camera.position);
  t.light.target.position.copy(center);

  t.renderer.render(t.scene, t.camera);
  return t.renderer.domElement.toDataURL('image/png');
}
