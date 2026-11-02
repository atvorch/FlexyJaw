import { useEffect, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { JawModel } from '../data/model';
import { selectFadeUpperJaw, useJawStore } from '../state/store';
import { GumDeformer } from './GumDeformer';
import { FADED_OPACITY, createGumMaterial, createRealGumMaterial, gumMaterial, realGumMaterial, stepFade } from './materials';
import { raycastWhenVisible, scene } from './registry';
import { Tooth } from './Tooth';

const CLICK_SLOP_PX = 4;

/*
 * Gums take pointer events only to block them: without this, a click on the gum passes through to a tooth
 * hidden behind it (the far side of the arch, or a root), selecting something the user can't see.
 */
const blockHover = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  if (useJawStore.getState().hovered != null) useJawStore.getState().hover(null);
};
const gumClick = (e: ThreeEvent<MouseEvent>) => {
  e.stopPropagation();
  // a click on the gum counts as a click on empty space
  if (e.delta > CLICK_SLOP_PX || scene.gizmo?.axis) return;
  useJawStore.getState().select(null);
};

/** The editable jaw: every tooth with its user adjustment, plus the gums. */
export function AdjustedJaw({ model }: { model: JawModel }) {
  const visibility = useJawStore((s) => s.visibility);
  const realistic = useJawStore((s) => s.realistic);
  // its own material, so it can fade (with the upper teeth) without touching the lower or original gums
  const upperGumMaterial = useMemo(() => (realistic ? createRealGumMaterial() : createGumMaterial()), [realistic]);
  useEffect(() => () => upperGumMaterial.dispose(), [upperGumMaterial]);
  useFrame((_, dt) => stepFade(upperGumMaterial, selectFadeUpperJaw(useJawStore.getState()) ? FADED_OPACITY : 1, dt));

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
          material={g.upper ? upperGumMaterial : realistic ? realGumMaterial : gumMaterial}
          visible={visibility.gums && (g.upper ? visibility.upper : visibility.lower)}
          raycast={raycastWhenVisible}
          onClick={gumClick}
          onPointerOver={blockHover}
          onPointerMove={blockHover}
        />
      ))}
      <GumDeformer gums={model.gums} />
    </group>
  );
}
