import { toothName } from '../data/fdi';
import type { JawModel } from '../data/model';
import { isEdited, type Adjustments } from './adjustments';
import { summarizeChange } from './analysis';

/** Below these, a component is reported as no change. */
const MIN_DEG = 0.1, MIN_MM = 0.05;

export interface ReportLine {
  /** Clinical term, e.g. "Lingual crown torque". */
  term: string;
  /** Formatted magnitude, e.g. "12.9°". */
  value: string;
  /** The same thing in plain words. */
  plain: string;
}

export interface ToothReport {
  fdi: number;
  /** Quadrant shorthand, e.g. "UR2". */
  code: string;
  name: string;
  lines: ReportLine[];
}

export interface OrthodontistReport {
  createdAt: Date;
  finalStage: number;
  teeth: ToothReport[];
}

const QUADRANT_CODE: Record<number, string> = { 1: 'UR', 2: 'UL', 3: 'LL', 4: 'LR' };
const toothCode = (fdi: number) => `${QUADRANT_CODE[Math.floor(fdi / 10)]}${fdi % 10}`;
const isAnterior = (fdi: number) => fdi % 10 <= 3;
const edgeName = (fdi: number) => (fdi % 10 <= 2 ? 'Incisal edge' : fdi % 10 === 3 ? 'Cusp tip' : 'Occlusal surface');
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const deg = (v: number) => `${Math.abs(v).toFixed(1)}°`;
const mm = (v: number) => `${Math.abs(v).toFixed(2)} mm`;

/** Turn every adjusted tooth into clinically worded lines, ordered by FDI number. */
export function buildReport(model: JawModel, adjustments: Adjustments): OrthodontistReport {
  const teeth = model.teeth
    .filter((t) => isEdited(adjustments[t.fdi]))
    .sort((a, b) => a.fdi - b.fdi)
    .map((t): ToothReport => {
      const s = summarizeChange(model, t, adjustments[t.fdi]);
      const { torqueDeg, tipDeg, rotationDeg } = s.clinical;
      const facial = isAnterior(t.fdi) ? 'labial' : 'buccal';
      const lines: ReportLine[] = [];

      if (Math.abs(torqueDeg) >= MIN_DEG)
        lines.push({ term: `${capitalize(torqueDeg > 0 ? facial : 'lingual')} crown torque`, value: deg(torqueDeg), plain: s.torque.direction });
      if (Math.abs(tipDeg) >= MIN_DEG)
        lines.push({ term: `${tipDeg > 0 ? 'Mesial' : 'Distal'} crown tip`, value: deg(tipDeg), plain: s.tip.direction });
      if (Math.abs(rotationDeg) >= MIN_DEG)
        lines.push({ term: `Mesial-${rotationDeg > 0 ? 'out' : 'in'} rotation`, value: deg(rotationDeg), plain: s.turn.direction });
      if (Math.abs(s.outMm) >= MIN_MM)
        lines.push({
          term: `${capitalize(s.outMm > 0 ? facial : 'lingual')} translation`,
          value: mm(s.outMm),
          plain: s.outMm > 0 ? 'whole tooth moves out toward the lips / cheek' : 'whole tooth moves in toward the tongue',
        });
      if (Math.abs(s.alongArchMm) >= MIN_MM)
        lines.push({
          term: `${s.alongArchMm > 0 ? 'Mesial' : 'Distal'} translation`,
          value: mm(s.alongArchMm),
          plain: s.alongArchMm > 0 ? 'whole tooth moves along the arch toward the middle' : 'whole tooth moves along the arch toward the back',
        });
      if (Math.abs(s.verticalMm) >= MIN_MM)
        lines.push({
          term: s.verticalMm > 0 ? 'Extrusion' : 'Intrusion',
          value: mm(s.verticalMm),
          plain: s.verticalMm > 0 ? 'tooth comes further out of the gum' : 'tooth is pushed further into the gum',
        });
      if (s.edgeMm >= MIN_MM)
        lines.push({
          term: `${edgeName(t.fdi)} displacement`,
          value: mm(s.edgeMm),
          plain: 'how far the biting end of the tooth ends up from the planned position',
        });

      return { fdi: t.fdi, code: toothCode(t.fdi), name: toothName(t.fdi), lines };
    });

  return { createdAt: new Date(), finalStage: model.stageCount - 1, teeth };
}

export const REPORT_NOTES = [
  'All changes are relative to the final stage of the current treatment plan.',
  'Values are measured on the 3D tooth models from the plan viewer. Directions (labial/lingual, mesial/distal) are estimated from the arch form, so values under about 0.2 mm or 1° are approximate.',
  'This is a patient request for discussion, not a prescription.',
];

/** Plain-text version for copying into an email or message. */
export function reportToText(r: OrthodontistReport): string {
  const out: string[] = [
    'Requested tooth position changes — summary for orthodontist',
    `Final stage: ${r.finalStage} · prepared ${r.createdAt.toLocaleDateString()}`,
    '',
  ];
  if (!r.teeth.length) out.push('No changes requested.');
  for (const t of r.teeth) {
    out.push(`${t.code} (FDI ${t.fdi}) — ${t.name}`);
    if (!t.lines.length) out.push('  • Negligible change');
    for (const l of t.lines) out.push(`  • ${l.term}: ${l.value}  (${l.plain})`);
    out.push('');
  }
  out.push('Notes:', ...REPORT_NOTES.map((n) => `- ${n}`));
  return out.join('\n');
}
