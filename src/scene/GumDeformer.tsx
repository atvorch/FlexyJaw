import { useRef } from 'react';
import type { BufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';
import type { GumModel } from '../data/model';
import { interpolateStagePositions } from '../domain/stage';
import { useJawStore } from '../state/store';

/**
 * Reshapes the gum geometries to the current stage. The geometries are shared by the adjusted and the
 * original jaw, so one deformer serves both. Work only happens when the stage actually changes.
 */
export function GumDeformer({ gums }: { gums: GumModel[] }) {
  const lastStage = useRef<number>(NaN);
  useFrame(() => {
    const stage = useJawStore.getState().stage;
    if (stage === lastStage.current) return;
    lastStage.current = stage;
    for (const g of gums) {
      const attr = g.geometry.attributes.position as BufferAttribute;
      interpolateStagePositions(g.stagePositions, stage, attr.array as Float32Array);
      attr.needsUpdate = true;
      g.geometry.computeVertexNormals();
      // gums take clicks, so picking needs bounds that match the current shape
      g.geometry.computeBoundingSphere();
      g.geometry.computeBoundingBox();
    }
  });
  return null;
}
