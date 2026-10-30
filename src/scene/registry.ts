import type { Object3D } from 'three';

/**
 * Imperative handles shared between scene components that are not parent/child:
 * the gizmo needs the selected tooth's pivot, and tooth clicks need to know whether the gizmo was hit.
 */
export const scene = {
  /** Per-tooth pivot group (FDI → object), registered by <Tooth>. */
  pivots: new Map<number, Object3D>(),
  /** The active transform gizmo; `axis` is set while a handle is hovered or dragged. */
  gizmo: null as { axis: string | null } | null,
};

/** For meshes that should never take pointer events (gums, the original jaw). */
export const noRaycast = () => {};
