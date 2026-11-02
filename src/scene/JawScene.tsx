import { OrbitControls } from '@react-three/drei';
import { MOUSE } from 'three';
import type { JawModel } from '../data/model';
import { AdjustedJaw } from './AdjustedJaw';
import { CameraRig } from './CameraRig';
import { JawLabels } from './JawLabels';
import { Lighting } from './Lighting';
import { OriginalJaw } from './OriginalJaw';
import { RealisticEffects } from './RealisticEffects';
import { StagePlayer } from './StagePlayer';
import { ToothGizmo } from './ToothGizmo';

// left drag orbits; dragging with the wheel (or right button) held pans the view sideways / up and down
const MOUSE_BUTTONS = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN };

/** Everything inside the main <Canvas>. */
export function JawScene({ model }: { model: JawModel }) {
  return (
    <>
      <Lighting />
      <OrbitControls makeDefault enableDamping mouseButtons={MOUSE_BUTTONS} />
      <CameraRig model={model} />
      <StagePlayer />
      <AdjustedJaw model={model} />
      <OriginalJaw model={model} />
      <ToothGizmo />
      <JawLabels model={model} />
      <RealisticEffects />
    </>
  );
}
