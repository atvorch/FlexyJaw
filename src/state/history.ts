import { isEdited, type Adjustments, type ToothAdjustment } from '../domain/adjustments';

/** One point on the undo / redo timeline. */
export interface HistoryEntry {
  adjustments: Adjustments;
  label: string;
  at: number;
}

/** Oldest steps are dropped beyond this. */
export const HISTORY_LIMIT = 200;
/** A burst of changes (gizmo drag, slider scrub, typing) settles into one step after this pause. */
export const HISTORY_SETTLE_MS = 400;

const same = (a: ToothAdjustment | undefined, b: ToothAdjustment | undefined) =>
  isEdited(a) === isEdited(b) &&
  (!isEdited(a) ||
    (a.rotation.every((v, i) => Math.abs(v - b!.rotation[i]) < 1e-9) && a.move.every((v, i) => Math.abs(v - b!.move[i]) < 1e-9)));

export function changedTeeth(prev: Adjustments, next: Adjustments): number[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)].map(Number));
  return [...keys].filter((fdi) => !same(prev[fdi], next[fdi])).sort((a, b) => a - b);
}

/** Short human label for the step from `prev` to `next`. */
export function describeStep(prev: Adjustments, next: Adjustments): string {
  const teeth = changedTeeth(prev, next);
  if (!teeth.length) return 'No change';
  if (!Object.keys(next).length) return 'Reset all teeth';
  if (teeth.length === 1) {
    const fdi = teeth[0];
    return isEdited(next[fdi]) ? `Adjusted tooth ${fdi}` : `Reset tooth ${fdi}`;
  }
  return `Changed teeth ${teeth.join(', ')}`;
}
