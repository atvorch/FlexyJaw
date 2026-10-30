import type { AngularChange, ChangeSummary } from '../../domain/analysis';

const TINY_DEG = 0.05, TINY_MM = 0.02;

function Row({ label, value, description, tiny }: { label: string; value: string; description: string; tiny: boolean }) {
  return (
    <tr className={tiny ? 'none' : undefined}>
      <td>
        {label}
        <span className="desc">{tiny ? 'no change' : description}</span>
      </td>
      <td className="value">{tiny ? '—' : value}</td>
    </tr>
  );
}

const Angle = ({ label, change }: { label: string; change: AngularChange }) => (
  <Row label={label} value={`${change.deg.toFixed(1)}°`} description={change.direction} tiny={change.deg < TINY_DEG} />
);

const Distance = ({ label, mm, positive, negative }: { label: string; mm: number; positive: string; negative: string }) => (
  <Row label={label} value={`${Math.abs(mm).toFixed(2)} mm`} description={mm > 0 ? positive : negative} tiny={Math.abs(mm) < TINY_MM} />
);

/** The change to one tooth, in plain words. */
export function ChangeTable({ summary }: { summary: ChangeSummary }) {
  return (
    <table className="change-table">
      <tbody>
        <tr><th colSpan={2}>Tilt &amp; turn</th></tr>
        <Angle label="Tilt in / out" change={summary.torque} />
        <Angle label="Lean front / back" change={summary.tip} />
        <Angle label="Turn around its length" change={summary.turn} />

        <tr><th colSpan={2}>Movement of the whole tooth</th></tr>
        <Distance label="In / out" mm={summary.outMm} positive="moves out toward the lips" negative="moves in toward the tongue" />
        <Distance label="Along the arch" mm={summary.alongArchMm} positive="moves toward the middle" negative="moves toward the back" />
        <Distance label="Up / down" mm={summary.verticalMm} positive="comes out of the gum (toward the bite)" negative="pushed into the gum" />

        <tr><th colSpan={2}>Overall</th></tr>
        <Row label="Total rotation" value={`${summary.totalDeg.toFixed(1)}°`} description="all tilts and turns combined" tiny={summary.totalDeg < TINY_DEG} />
        <Row
          label="Biting edge moved"
          value={`${summary.edgeMm.toFixed(2)} mm`}
          description="how far the tip of the tooth ends up from the plan"
          tiny={summary.edgeMm < TINY_MM}
        />
      </tbody>
    </table>
  );
}
