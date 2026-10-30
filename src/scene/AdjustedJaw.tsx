import type { ThreeEvent } from '@react-three/fiber';
import type { JawModel } from '../data/model';
import { useJawStore } from '../state/store';
import { GumDeformer } from './GumDeformer';
import { gumMaterial } from './materials';
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
