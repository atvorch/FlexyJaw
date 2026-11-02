import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { useJawStore } from '../state/store';

/**
 * Screen-space ambient occlusion: soft shading in the gaps between teeth and where they meet the gum. Only
 * mounted for the realistic look, so the plain look renders exactly as before.
 */
export function RealisticEffects() {
  const realistic = useJawStore((s) => s.realistic);
  if (!realistic) return null;
  return (
    <EffectComposer multisampling={4}>
      {/* distances are in millimetres, the model's units */}
      <N8AO aoRadius={2.6} distanceFalloff={1} intensity={3.5} quality="high" />
    </EffectComposer>
  );
}
