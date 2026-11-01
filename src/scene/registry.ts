import { Mesh, type Intersection, type Object3D, type Raycaster } from 'three';

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

/** For meshes that should never take pointer events (the original jaw). */
export const noRaycast = () => {};

/**
 * three.js picks hidden objects too (it only checks layers), so a hidden arch would still catch clicks.
 * Use as a mesh's `raycast` to make it pickable only while it and all its parents are visible, and while it
 * isn't faded out of the way (clicks then reach the teeth it was fading to reveal).
 */
export function raycastWhenVisible(this: Mesh, raycaster: Raycaster, intersects: Intersection[]) {
  for (let o: Object3D | null = this; o; o = o.parent) if (!o.visible) return;
  if (!Array.isArray(this.material) && this.material.opacity < 0.5) return;
  Mesh.prototype.raycast.call(this, raycaster, intersects);
}
