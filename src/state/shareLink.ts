import { isEdited, type Adjustments, type ToothAdjustment, type Vec3 } from '../domain/adjustments';

/**
 * Share links: `?mode=view&gums=1&upper=1&lower=1&highlight=0&original=0&realistic=0&shine=100&adj=…`
 *
 * `adj` carries the tooth adjustments themselves, because saved versions live only in the sharer's browser;
 * without it a recipient would see the plain plan. It is compact JSON rows
 * `[fdi, rotX°, rotY°, rotZ°, moveX, moveY, moveZ]`, base64url-encoded.
 */
export interface ShareSettings {
  gums: boolean;
  upper: boolean;
  lower: boolean;
  highlightAdjusted: boolean;
  showOriginal: boolean;
  realistic: boolean;
  /** Tooth reflection level; written as a whole percentage (`shine=60`). */
  toothShine: number;
}

export interface ShareLink extends Partial<ShareSettings> {
  viewOnly: boolean;
  /** null when the link carries no `adj` parameter. */
  adjustments: Adjustments | null;
}

const DEG = 180 / Math.PI;

const toBase64Url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

export function encodeAdjustments(adjustments: Adjustments): string | null {
  const rows = Object.entries(adjustments)
    .filter(([, a]) => isEdited(a))
    .map(([fdi, a]) => [Number(fdi), ...a.rotation.map((r) => +(r * DEG).toFixed(2)), ...a.move.map((m) => +m.toFixed(3))]);
  return rows.length ? toBase64Url(JSON.stringify(rows)) : null;
}

export function decodeAdjustments(encoded: string): Adjustments {
  const out: Record<number, ToothAdjustment> = {};
  try {
    const rows: unknown = JSON.parse(fromBase64Url(encoded));
    if (!Array.isArray(rows)) return out;
    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== 7 || !row.every((v) => typeof v === 'number' && isFinite(v))) continue;
      const [fdi, rx, ry, rz, mx, my, mz] = row as number[];
      const unit = fdi % 10, quadrant = Math.floor(fdi / 10);
      if (!Number.isInteger(fdi) || quadrant < 1 || quadrant > 4 || unit < 1 || unit > 8) continue;
      const a: ToothAdjustment = { rotation: [rx / DEG, ry / DEG, rz / DEG] as Vec3, move: [mx, my, mz] };
      if (isEdited(a)) out[fdi] = a;
    }
  } catch {
    // a mangled link just shows the plan without adjustments
  }
  return out;
}

const flag = (on: boolean) => (on ? '1' : '0');

function setToggleParams(p: URLSearchParams, settings: ShareSettings) {
  p.set('gums', flag(settings.gums));
  p.set('upper', flag(settings.upper));
  p.set('lower', flag(settings.lower));
  p.set('highlight', flag(settings.highlightAdjusted));
  p.set('original', flag(settings.showOriginal));
  p.set('realistic', flag(settings.realistic));
  p.set('shine', String(Math.round(settings.toothShine * 100)));
}

/**
 * Mirror the toggles into the address bar, leaving every other parameter (mode, adj) alone.
 * Replaces the history entry instead of pushing one, so Back doesn't step through toggle clicks.
 */
export function writeToggleParams(settings: ShareSettings) {
  const url = new URL(location.href);
  url.searchParams.delete('bright'); // replaced by `shine`
  setToggleParams(url.searchParams, settings);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

/** A view-only link to this page reproducing the given toggles and adjustments. */
export function buildShareUrl(settings: ShareSettings, adjustments: Adjustments, base = location.href): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  const p = url.searchParams;
  p.set('mode', 'view');
  setToggleParams(p, settings);
  const adj = encodeAdjustments(adjustments);
  if (adj) p.set('adj', adj);
  return url.toString();
}

/** Read whatever a link specifies; anything missing is left undefined so the app's defaults apply. */
export function readShareLink(search = location.search): ShareLink {
  const p = new URLSearchParams(search);
  const bool = (key: string) => (p.has(key) ? ['1', 'true', 'yes', 'on'].includes((p.get(key) ?? '').toLowerCase()) : undefined);
  const adj = p.get('adj');
  return {
    viewOnly: p.get('mode') === 'view',
    gums: bool('gums'),
    upper: bool('upper'),
    lower: bool('lower'),
    highlightAdjusted: bool('highlight'),
    showOriginal: bool('original'),
    realistic: bool('realistic'),
    toothShine: p.has('shine') && isFinite(Number(p.get('shine'))) ? Number(p.get('shine')) / 100 : undefined,
    adjustments: adj ? decodeAdjustments(adj) : null,
  };
}
