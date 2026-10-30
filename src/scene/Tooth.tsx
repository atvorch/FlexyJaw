import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { ToothModel } from '../data/model';
import { applyToPivot, isEdited } from '../domain/adjustments';
import { adjustmentWeight, interpolateStageMatrix } from '../domain/stage';
import { useJawStore } from '../state/store';
import { COLORS, createToothMaterial } from './materials';
import { scene } from './registry';

/** A movement past this many pixels between press and release is an orbit drag, not a click. */
const CLICK_SLOP_PX = 4;

/**
 * One editable tooth: stage transform → pivot (user adjustment around the tooth centre) → mesh.
 * Transforms are driven every frame from the store, so playback doesn't re-render React.
 */
export function Tooth({ tooth }: { tooth: ToothModel }) {
  const stageGroup = useRef<Group>(null!);
  const pivot = useRef<Group>(null!);
  const material = useMemo(createToothMaterial, []);
  const meshOffset = useMemo(() => tooth.center.clone().negate(), [tooth]);

  const lit = useJawStore(
    (s) =>
      s.selected === tooth.fdi ||
      s.compared === tooth.fdi ||
      (s.highlightAdjusted && isEdited(s.adjustments[tooth.fdi])),
  );
  const hovered = useJawStore((s) => s.hovered === tooth.fdi);

  useEffect(() => {
    material.color.copy(lit ? COLORS.toothLit : COLORS.tooth);
    material.emissive.copy(lit ? COLORS.emissiveLit : hovered ? COLORS.emissiveHover : COLORS.none);
  }, [material, lit, hovered]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    scene.pivots.set(tooth.fdi, pivot.current);
    return () => void scene.pivots.delete(tooth.fdi);
  }, [tooth.fdi]);

  useFrame(() => {
    const s = useJawStore.getState();
    interpolateStageMatrix(tooth.stageMatrices, s.stage, stageGroup.current.matrix);
    stageGroup.current.matrixWorldNeedsUpdate = true;
    const weight = adjustmentWeight(s.stage, tooth.stageMatrices.length, s.applyAdjustments);
    applyToPivot(pivot.current, tooth, s.adjustments[tooth.fdi], weight);
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
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        />
      </group>
    </group>
  );
}
