import { useFrame } from '@react-three/fiber';
import { lastStage, useJawStore } from '../state/store';

const SECONDS_PER_STAGE = 0.6;

/** Advances the treatment stage while playback is on. */
export function StagePlayer() {
  useFrame((_, dt) => {
    const s = useJawStore.getState();
    if (!s.playing) return;
    const end = lastStage(s);
    const next = s.stage + dt / SECONDS_PER_STAGE;
    if (next >= end) {
      s.setStage(end);
      s.stopPlay();
    } else s.setStage(next);
  });
  return null;
}
