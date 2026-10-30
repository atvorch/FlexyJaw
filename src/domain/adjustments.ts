import { Euler, Matrix4, type Object3D } from 'three';
import type { ToothModel } from '../data/model';

export type Vec3 = [number, number, number];

/** A user change to one tooth, in that tooth's local frame, pivoting on its centre. */
export interface ToothAdjustment {
  /** Euler XYZ, radians. */
  rotation: Vec3;
  /** Millimetres. */
  move: Vec3;
}

/** Keyed by FDI number. Teeth without a change have no entry. */
export type Adjustments = Readonly<Record<number, ToothAdjustment>>;

export const ZERO_ADJUSTMENT: ToothAdjustment = { rotation: [0, 0, 0], move: [0, 0, 0] };

const EPS_ROT = 1e-4, EPS_MOVE = 1e-4;

export function isEdited(a: ToothAdjustment | undefined): a is ToothAdjustment {
  if (!a) return false;
  const [rx, ry, rz] = a.rotation, [mx, my, mz] = a.move;
  return Math.abs(rx) + Math.abs(ry) + Math.abs(rz) > EPS_ROT || Math.hypot(mx, my, mz) > EPS_MOVE;
}

/**
 * Drive a tooth's pivot (a child of its stage transform, sitting at the tooth centre) from an adjustment.
 * `weight` scales the change, so 0 shows the plan unchanged.
 */
export function applyToPivot(pivot: Object3D, tooth: ToothModel, a: ToothAdjustment | undefined, weight: number) {
  const { rotation: r, move: m } = a ?? ZERO_ADJUSTMENT;
  pivot.rotation.set(r[0] * weight, r[1] * weight, r[2] * weight);
  pivot.position.set(tooth.center.x + m[0] * weight, tooth.center.y + m[1] * weight, tooth.center.z + m[2] * weight);
}

/** Read an adjustment back from a pivot (e.g. after the gizmo moved it). */
export function adjustmentFromPivot(pivot: Object3D, tooth: ToothModel): ToothAdjustment {
  return {
    rotation: [pivot.rotation.x, pivot.rotation.y, pivot.rotation.z],
    move: [pivot.position.x - tooth.center.x, pivot.position.y - tooth.center.y, pivot.position.z - tooth.center.z],
  };
}

/** Local-frame transform of an adjustment: T(centre + move) · R · T(-centre). */
export function adjustmentMatrix(tooth: ToothModel, a: ToothAdjustment | undefined): Matrix4 {
  const { rotation: r, move: m } = a ?? ZERO_ADJUSTMENT;
  const c = tooth.center;
  return new Matrix4()
    .makeTranslation(c.x + m[0], c.y + m[1], c.z + m[2])
    .multiply(new Matrix4().makeRotationFromEuler(new Euler(r[0], r[1], r[2])))
    .multiply(new Matrix4().makeTranslation(-c.x, -c.y, -c.z));
}

/** World transform of an adjusted tooth, given its planned world transform. */
export function adjustedMatrix(tooth: ToothModel, a: ToothAdjustment | undefined, plan: Matrix4): Matrix4 {
  return plan.clone().multiply(adjustmentMatrix(tooth, a));
}
