import type { JawModel } from '../data/model';
import { useJawStore } from '../state/store';
import { GumDeformer } from './GumDeformer';
import { gumMaterial } from './materials';
import { noRaycast } from './registry';
import { Tooth } from './Tooth';

/** The editable jaw: every tooth with its user adjustment, plus the gums. */
export function AdjustedJaw({ model }: { model: JawModel }) {
  const visibility = useJawStore((s) => s.visibility);
  return (
    <group>
      {model.teeth.map((t) => (
        <group key={t.fdi} visible={t.upper ? visibility.upper : visibility.lower}>
          <Tooth tooth={t} />
        </group>
      ))}
      {model.gums.map((g, i) => (
        <mesh
          key={i}
          geometry={g.geometry}
          material={gumMaterial}
          visible={visibility.gums && (g.upper ? visibility.upper : visibility.lower)}
          raycast={noRaycast}
        />
      ))}
      <GumDeformer gums={model.gums} />
    </group>
  );
}
