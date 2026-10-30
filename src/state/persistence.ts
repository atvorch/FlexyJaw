import { isEdited, type Adjustments, type ToothAdjustment, type Vec3 } from '../domain/adjustments';

/** Same key and shape as the original single-page editor, so saved adjustments carry over. */
const STORAGE_KEY = 'jaw-editor-adjustments-v1';
const DEG = 180 / Math.PI;

interface StoredAdjustment {
  rotateDeg: Vec3;
  moveMm: Vec3;
}
type StoredAdjustments = Record<string, StoredAdjustment>;

const round = (v: number, digits: number) => +v.toFixed(digits);

export function serialize(adjustments: Adjustments): StoredAdjustments {
  const out: StoredAdjustments = {};
  for (const [fdi, a] of Object.entries(adjustments)) {
    if (!isEdited(a)) continue;
    out[fdi] = {
      rotateDeg: a.rotation.map((r) => round(r * DEG, 2)) as Vec3,
      moveMm: a.move.map((m) => round(m, 3)) as Vec3,
    };
  }
  return out;
}

const isVec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number' && isFinite(x));

export function deserialize(data: unknown): Adjustments {
  const out: Record<number, ToothAdjustment> = {};
  if (!data || typeof data !== 'object') return out;
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const fdi = Number(key);
    const v = value as Partial<StoredAdjustment> | null;
    if (!Number.isInteger(fdi) || !v || !isVec3(v.rotateDeg) || !isVec3(v.moveMm)) continue;
    const a: ToothAdjustment = { rotation: v.rotateDeg.map((d) => d / DEG) as Vec3, move: [...v.moveMm] };
    if (isEdited(a)) out[fdi] = a;
  }
  return out;
}

export function loadAdjustments(): Adjustments {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? deserialize(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveAdjustments(adjustments: Adjustments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(adjustments)));
  } catch {
    // storage unavailable (private mode, blocked site data): adjustments just won't survive a reload
  }
}

export function downloadAdjustments(adjustments: Adjustments) {
  const body = { format: 'jaw-editor-adjustments', version: 1, teeth: serialize(adjustments) };
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'tooth-adjustments.json' });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Accepts both the export wrapper and a bare `{ fdi: {...} }` map. */
export async function readAdjustmentsFile(file: File): Promise<Adjustments> {
  const json = JSON.parse(await file.text());
  return deserialize(json && typeof json === 'object' && 'teeth' in json ? json.teeth : json);
}
