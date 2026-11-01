import publishedPlan from '../data/publishedPlan.json';
import { isEdited, type Adjustments, type ToothAdjustment, type Vec3 } from '../domain/adjustments';

/** Named saves, newest last. */
const SAVES_KEY = 'jaw-editor-saves-v1';
/** Recovery copy of unsaved changes, in case the page closes without warning. Not a saved version. */
const DRAFT_KEY = 'jaw-editor-draft-v1';
/** The old always-on autosave. Read once to seed the first save; never written or deleted. */
const LEGACY_AUTOSAVE_KEY = 'jaw-editor-adjustments-v1';
/** Marks that the version published with the site has been added to this browser's saves. */
const PUBLISHED_SEEN_KEY = 'jaw-editor-published-seen-v1';
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

/** A named snapshot of every tooth adjustment, saved by the user. */
export interface SavedVersion {
  id: string;
  name: string;
  savedAt: number;
  adjustments: Adjustments;
}

interface StoredVersion {
  id: string;
  name: string;
  savedAt: number;
  teeth: StoredAdjustments;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function readStoredVersions(): StoredVersion[] | null {
  const raw = localStorage.getItem(SAVES_KEY);
  if (raw == null) return null;
  const list = JSON.parse(raw);
  return Array.isArray(list) ? list : [];
}

/**
 * The user's saved versions, oldest first. On the very first run, adjustments left by the old autosave
 * become the first saved version so nothing is lost.
 */
export function loadVersions(): SavedVersion[] {
  try {
    const stored = readStoredVersions();
    if (stored) {
      return withPublishedPlan(
        stored
          .filter((v) => v && typeof v.id === 'string' && typeof v.name === 'string')
          .map((v) => ({ id: v.id, name: v.name, savedAt: Number(v.savedAt) || 0, adjustments: deserialize(v.teeth) })),
      );
    }
    const legacy = localStorage.getItem(LEGACY_AUTOSAVE_KEY);
    const adjustments = legacy ? deserialize(JSON.parse(legacy)) : {};
    const seeded = Object.keys(adjustments).length
      ? [{ id: newId(), name: 'Changes before named saves', savedAt: Date.now(), adjustments }]
      : [];
    writeVersions(seeded);
    return withPublishedPlan(seeded);
  } catch {
    return [];
  }
}

const contentKey = (adjustments: Adjustments) => JSON.stringify(serialize(adjustments));

/**
 * Saves live in each browser, so the changes published with the site (src/data/publishedPlan.json) are added
 * as a saved version in every browser that opens it, once per published content. A newer publish replaces the
 * copy a browser got earlier unless the user has changed that copy, in which case it is added alongside.
 * Skipped where an identical version already exists.
 */
function withPublishedPlan(versions: SavedVersion[]): SavedVersion[] {
  const seenKey = `${PUBLISHED_SEEN_KEY}:${publishedPlan.id}`;
  const adjustments = deserialize(publishedPlan.teeth);
  const content = contentKey(adjustments);
  // what this browser was last given; '1' is the flag earlier builds stored, before the content was kept
  const seen = localStorage.getItem(seenKey);
  if (seen === content) return versions;
  localStorage.setItem(seenKey, content);

  const published: SavedVersion = { id: publishedPlan.id, name: publishedPlan.name, savedAt: publishedPlan.savedAt, adjustments };
  const earlier = versions.find((v) => v.id === publishedPlan.id);
  let next: SavedVersion[];
  if (earlier && seen != null && (seen === '1' || contentKey(earlier.adjustments) === seen)) {
    next = versions.map((v) => (v === earlier ? published : v));
  } else if (versions.some((v) => contentKey(v.adjustments) === content)) {
    return versions;
  } else {
    next = [...versions, earlier ? { ...published, id: `${published.id}-${published.savedAt}` } : published];
  }
  next.sort((a, b) => a.savedAt - b.savedAt);
  writeVersions(next);
  return next;
}

/** @returns false when storage is unavailable (private mode, blocked site data, quota). */
export function writeVersions(versions: SavedVersion[]): boolean {
  try {
    const stored: StoredVersion[] = versions.map((v) => ({ id: v.id, name: v.name, savedAt: v.savedAt, teeth: serialize(v.adjustments) }));
    localStorage.setItem(SAVES_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

/** Unsaved changes kept for recovery, with the version they were made on. */
export interface Draft {
  baseVersionId: string | null;
  adjustments: Adjustments;
  at: number;
}

export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { baseVersionId: typeof d.baseVersionId === 'string' ? d.baseVersionId : null, adjustments: deserialize(d.teeth), at: Number(d.at) || 0 };
  } catch {
    return null;
  }
}

/** Store or (with null) clear the recovery copy. Failing to store just means no recovery. */
export function writeDraft(draft: Draft | null) {
  try {
    if (!draft) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify({ baseVersionId: draft.baseVersionId, teeth: serialize(draft.adjustments), at: draft.at }));
  } catch {
    // storage unavailable
  }
}

export const createVersion = (name: string, adjustments: Adjustments): SavedVersion => ({
  id: newId(),
  name,
  savedAt: Date.now(),
  adjustments,
});

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
