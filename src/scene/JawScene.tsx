import { OrbitControls } from '@react-three/drei';
import type { JawModel } from '../data/model';
import { AdjustedJaw } from './AdjustedJaw';
import { CameraRig } from './CameraRig';
import { JawLabels } from './JawLabels';
import { Lighting } from './Lighting';
import { OriginalJaw } from './OriginalJaw';
import { StagePlayer } from './StagePlayer';
import { ToothGizmo } from './ToothGizmo';

/** Everything inside the main <Canvas>. */
export function JawScene({ model }: { model: JawModel }) {
  return (
    <>
      <Lighting />
      <OrbitControls makeDefault enableDamping />
      <CameraRig model={model} />
      <StagePlayer />
      <AdjustedJaw model={model} />
      <OriginalJaw model={model} />
      <ToothGizmo />
      <JawLabels model={model} />
    </>
  );
}
