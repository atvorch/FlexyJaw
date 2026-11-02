import { useEffect, useRef } from 'react';
import type { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import type { JawModel } from '../data/model';
import { originalJawOffsetZ } from '../domain/layout';
import { interpolateStageMatrix } from '../domain/stage';
import { selectStackOriginal, useJawStore } from '../state/store';
import { gumMaterial, originalToothMaterial, realGumMaterial, realOriginalToothMaterial, setToothShine } from './materials';
import { noRaycast } from './registry';

/** The unadjusted plan, stacked above the editable jaw for side-by-side comparison. Not interactive. */
export function OriginalJaw({ model }: { model: JawModel }) {
  const show = useJawStore(selectStackOriginal);
  const gap = useJawStore((s) => s.originalGapMm);
  const visibility = useJawStore((s) => s.visibility);
  const realistic = useJawStore((s) => s.realistic);
  const shine = useJawStore((s) => s.toothShine);
  const teeth = useRef<(Mesh | null)[]>([]);

  useEffect(() => {
    setToothShine(originalToothMaterial, shine);
    setToothShine(realOriginalToothMaterial, shine);
  }, [shine]);

  useFrame(() => {
    if (!show) return;
    const stage = useJawStore.getState().stage;
    model.teeth.forEach((t, i) => {
      const mesh = teeth.current[i];
      if (!mesh) return;
      interpolateStageMatrix(t.stageMatrices, stage, mesh.matrix);
      mesh.matrixWorldNeedsUpdate = true;
    });
  });

  return (
    <group position={[0, 0, originalJawOffsetZ(model.bounds, gap)]} visible={show}>
      {model.teeth.map((t, i) => (
        <mesh
          key={t.fdi}
          ref={(m) => void (teeth.current[i] = m)}
          geometry={t.geometry}
          material={realistic ? realOriginalToothMaterial : originalToothMaterial}
          matrixAutoUpdate={false}
          visible={t.upper ? visibility.upper : visibility.lower}
          raycast={noRaycast}
        />
      ))}
      {model.gums.map((g, i) => (
        <mesh
          key={i}
          geometry={g.geometry}
          material={realistic ? realGumMaterial : gumMaterial}
          visible={visibility.gums && (g.upper ? visibility.upper : visibility.lower)}
          raycast={noRaycast}
        />
      ))}
    </group>
  );
}
