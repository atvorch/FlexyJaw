import { Matrix4, Quaternion, Vector3 } from 'three';

const p0 = new Vector3(), p1 = new Vector3(), s = new Vector3();
const q0 = new Quaternion(), q1 = new Quaternion();

/** Blend between the two stages around a fractional stage index (position lerp, rotation slerp). */
export function interpolateStageMatrix(mats: Matrix4[], stage: number, out: Matrix4): Matrix4 {
  const a = Math.floor(stage), b = Math.min(mats.length - 1, a + 1), f = stage - a;
  mats[a].decompose(p0, q0, s);
  mats[b].decompose(p1, q1, s);
  p0.lerp(p1, f);
  q0.slerp(q1, f);
  return out.compose(p0, q0, s);
}

export function interpolateStagePositions(stages: Float32Array[], stage: number, out: Float32Array): Float32Array {
  const a = Math.floor(stage), b = Math.min(stages.length - 1, a + 1), f = stage - a;
  const pa = stages[a], pb = stages[b];
  for (let k = 0; k < out.length; k++) out[k] = pa[k] + (pb[k] - pa[k]) * f;
  return out;
}

/**
 * How much of the user's adjustment shows at a stage. Adjustments belong to the final stage and fade in
 * over the last step, so playback ends on the adjusted result.
 */
export function adjustmentWeight(stage: number, stageCount: number, apply: boolean): number {
  if (!apply) return 0;
  return Math.max(0, Math.min(1, stage - (stageCount - 2)));
}
