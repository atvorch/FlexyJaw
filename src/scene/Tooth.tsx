import { useEffect, useMemo, useRef } from 'react';
import { Color, type Group } from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { ToothModel } from '../data/model';
import { applyToPivot, isEdited } from '../domain/adjustments';
import { adjustmentWeight, interpolateStageMatrix } from '../domain/stage';
import { selectFadeUpperJaw, useJawStore } from '../state/store';
import { COLORS, FADED_OPACITY, REAL, createRealToothMaterial, createToothMaterial, setToothShine, stepFade } from './materials';
import { raycastWhenVisible, scene } from './registry';

/** A movement past this many pixels between press and release is an orbit drag, not a click. */
const CLICK_SLOP_PX = 4;
/** How quickly a highlight fades in or out (per second; about a fifth of a second to settle). */
const HIGHLIGHT_FADE_RATE = 14;

/**
 * One editable tooth: stage transform → pivot (user adjustment around the tooth centre) → mesh.
 * Transforms are driven every frame from the store, so playback doesn't re-render React.
 */
export function Tooth({ tooth }: { tooth: ToothModel }) {
  const stageGroup = useRef<Group>(null!);
  const pivot = useRef<Group>(null!);
  const realistic = useJawStore((s) => s.realistic);
  const shine = useJawStore((s) => s.toothShine);
  const material = useMemo(() => (realistic ? createRealToothMaterial() : createToothMaterial()), [realistic]);
  const meshOffset = useMemo(() => tooth.center.clone().negate(), [tooth]);

  const lit = useJawStore(
    (s) =>
      s.selected === tooth.fdi ||
      s.compared === tooth.fdi ||
      (s.highlightAdjusted && isEdited(s.adjustments[tooth.fdi])),
  );
  const hovered = useJawStore((s) => s.hovered === tooth.fdi);

  // where the highlight is heading; the colours ease towards it frame by frame (see useFrame below)
  const target = useMemo(() => ({ color: new Color(), emissive: new Color() }), []);
  useEffect(() => {
    target.color.copy(lit ? COLORS.toothLit : realistic ? REAL.tooth : COLORS.tooth);
    target.emissive.copy(lit ? COLORS.emissiveLit : hovered ? COLORS.emissiveHover : COLORS.none);
  }, [target, realistic, lit, hovered]);
  useEffect(() => setToothShine(material, shine), [material, shine]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    scene.pivots.set(tooth.fdi, pivot.current);
    return () => void scene.pivots.delete(tooth.fdi);
  }, [tooth.fdi]);

  useFrame((_, dt) => {
    const s = useJawStore.getState();
    interpolateStageMatrix(tooth.stageMatrices, s.stage, stageGroup.current.matrix);
    stageGroup.current.matrixWorldNeedsUpdate = true;
    const weight = adjustmentWeight(s.stage, tooth.stageMatrices.length, s.applyAdjustments);
    applyToPivot(pivot.current, tooth, s.adjustments[tooth.fdi], weight);
    // upper teeth step aside (fade) while a lower tooth is in focus
    if (tooth.upper) stepFade(material, selectFadeUpperJaw(s) ? FADED_OPACITY : 1, dt);
    // highlights (hover, selection, "highlight adjusted") fade in and out instead of switching
    const k = 1 - Math.exp(-dt * HIGHLIGHT_FADE_RATE);
    material.color.lerp(target.color, k);
    material.emissive.lerp(target.emissive, k);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_SLOP_PX || scene.gizmo?.axis) return;
    e.stopPropagation();
    useJawStore.getState().select(tooth.fdi);
  };
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useJawStore.getState().hover(tooth.fdi);
  };
  const onPointerOut = () => {
    if (useJawStore.getState().hovered === tooth.fdi) useJawStore.getState().hover(null);
  };

  return (
    <group ref={stageGroup} matrixAutoUpdate={false}>
      <group ref={pivot}>
        <mesh
          geometry={tooth.geometry}
          material={material}
          position={meshOffset}
          raycast={raycastWhenVisible}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        />
      </group>
    </group>
  );
}
