import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import type { JawModel, ToothModel } from '../data/model';
import { adjustedMatrix, type ToothAdjustment } from './adjustments';

const DEG = 180 / Math.PI;

/** Directions around one tooth at the final stage, worked out from the curve of its arch. */
export interface ArchFrame {
  plan: Matrix4;
  /** Tooth centre in world space. */
  center: Vector3;
  /** Toward the biting surface. */
  occlusal: Vector3;
  /** Outward, toward lips / cheek. */
  buccal: Vector3;
  /** Along the arch, toward the midline. */
  mesial: Vector3;
}

export function archFrame(model: JawModel, tooth: ToothModel): ArchFrame {
  const last = model.stageCount - 1;
  const plan = tooth.stageMatrices[last];
  const center = tooth.center.clone().applyMatrix4(plan);

  const arch = model.teeth.filter((t) => t.upper === tooth.upper);
  const archCenter = new Vector3();
  for (const t of arch) archCenter.add(t.center.clone().applyMatrix4(t.stageMatrices[last]));
  archCenter.divideScalar(arch.length);

  const occlusal = new Vector3(0, 0, tooth.upper ? 1 : -1); // -z is up
  // the arch centroid sits toward the front; shifting it back keeps molar "outward" pointing to the cheek
  const buccal = new Vector3(center.x - archCenter.x, center.y - (archCenter.y + 8), 0).normalize();
  const mesial = new Vector3(-buccal.y, buccal.x, 0);
  if (mesial.x * (archCenter.x - center.x) < 0) mesial.negate();
  return { plan, center, occlusal, buccal, mesial };
}

export interface AngularChange {
  deg: number;
  direction: string;
}

export interface ChangeSummary {
  /** All tilts and turns combined. */
  totalDeg: number;
  /** Tilt in / out (about the along-the-arch axis). */
  torque: AngularChange;
  /** Lean front / back (about the in-out axis). */
  tip: AngularChange;
  /** Turn around the tooth's own length. */
  turn: AngularChange;
  /** Whole-tooth movement of the centre, mm; positive = outward / toward the middle / out of the gum. */
  outMm: number;
  alongArchMm: number;
  verticalMm: number;
  movedMm: number;
  /** How far the biting edge ends up from the plan. */
  edgeMm: number;
  /**
   * Signed angular components in degrees, for clinical wording:
   * torque + = labial/buccal crown torque, tip + = mesial crown tip, rotation + = mesial-out.
   */
  clinical: { torqueDeg: number; tipDeg: number; rotationDeg: number };
}

/** Describe an adjustment against the original plan at the final stage. */
export function summarizeChange(model: JawModel, tooth: ToothModel, adj: ToothAdjustment): ChangeSummary {
  const { plan, occlusal, buccal, mesial } = archFrame(model, tooth);
  const adjusted = adjustedMatrix(tooth, adj, plan);
  const planInv = plan.clone().invert();
  const delta = (local: Vector3) => local.clone().applyMatrix4(adjusted).sub(local.clone().applyMatrix4(plan));

  const reach = (Math.max(tooth.size.x, tooth.size.y, tooth.size.z) / 2) * 0.8;
  const edge = tooth.center.clone().add(occlusal.clone().transformDirection(planInv).multiplyScalar(reach));
  const side = tooth.center.clone().add(mesial.clone().transformDirection(planInv).multiplyScalar(3));
  const dCenter = delta(tooth.center), dEdge = delta(edge), dSide = delta(side);

  // rotation as axis-angle in world space, split into the three anatomical axes
  const q = new Quaternion().setFromEuler(new Euler(...adj.rotation));
  const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w))) * DEG;
  const s = Math.sqrt(Math.max(0, 1 - q.w * q.w)) * Math.sign(q.w || 1);
  const axis = s > 1e-9 ? new Vector3(q.x / s, q.y / s, q.z / s).transformDirection(plan) : new Vector3();

  const edgeRel = dEdge.clone().sub(dCenter), sideRel = dSide.clone().sub(dCenter);
  const torqueDeg = Math.abs(axis.dot(mesial) * angle) * (edgeRel.dot(buccal) > 0 ? 1 : -1);
  const tipDeg = Math.abs(axis.dot(buccal) * angle) * (edgeRel.dot(mesial) > 0 ? 1 : -1);
  const rotationDeg = Math.abs(axis.dot(occlusal) * angle) * (sideRel.dot(buccal) > 0 ? 1 : -1);
  return {
    clinical: { torqueDeg, tipDeg, rotationDeg },
    totalDeg: angle,
    torque: {
      deg: Math.abs(axis.dot(mesial) * angle),
      direction: edgeRel.dot(buccal) > 0 ? 'biting edge tilts out toward the lips' : 'biting edge tilts in toward the tongue',
    },
    tip: {
      deg: Math.abs(axis.dot(buccal) * angle),
      direction: edgeRel.dot(mesial) > 0 ? 'leans toward the front of the mouth' : 'leans toward the back of the mouth',
    },
    turn: {
      deg: Math.abs(axis.dot(occlusal) * angle),
      direction: sideRel.dot(buccal) > 0 ? 'side nearest the middle turns outward' : 'side nearest the middle turns inward',
    },
    outMm: dCenter.dot(buccal),
    alongArchMm: dCenter.dot(mesial),
    verticalMm: dCenter.dot(occlusal),
    movedMm: dCenter.length(),
    edgeMm: dEdge.length(),
  };
}
