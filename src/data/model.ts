import type { Box3, BufferGeometry, Matrix4, Vector3 } from 'three';

export type Axis = 'x' | 'y' | 'z';

/**
 * Scan space conventions: -z is up, the front of the mouth faces -y, the patient's right is +x.
 */
export interface ToothModel {
  /** Position in FDI_BY_MESH_ORDER. */
  index: number;
  fdi: number;
  upper: boolean;
  /** Geometry in the tooth's local frame. */
  geometry: BufferGeometry;
  /** Crown/bounding-box centre in the local frame; adjustments pivot around it. */
  center: Vector3;
  size: Vector3;
  /** Local axis running along the tooth (its longest extent). */
  longAxis: Axis;
  /** Local → world transform per treatment stage. */
  stageMatrices: Matrix4[];
}

export interface GumModel {
  /** Shared by the adjusted and original jaws; positions are rewritten per stage. */
  geometry: BufferGeometry;
  /** Welded vertex positions per stage (same topology for every stage). */
  stagePositions: Float32Array[];
  upper: boolean;
}

export interface JawModel {
  teeth: ToothModel[];
  gums: GumModel[];
  stageCount: number;
  /** World bounds of teeth and gums at stage 0. */
  bounds: Box3;
}
