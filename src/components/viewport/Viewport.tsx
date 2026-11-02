import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { JawScene } from '../../scene/JawScene';
import { scene } from '../../scene/registry';
import { useJawStore } from '../../state/store';
import { ChangesBar } from '../compare/ChangesBar';
import { HistoryRail } from '../versions/HistoryBar';
import { ShineSlider } from './ShineSlider';
import { LookSwitch } from './LookSwitch';
import { ShareButton } from './ShareButton';
import { StageBar } from './StageBar';
import { SummaryButton } from './SummaryButton';
import { AdjustmentToolbar } from './AdjustmentToolbar';
import { ViewToolbar } from './ViewToolbar';
import { VisibilityToolbar } from './VisibilityToolbar';
import { ShortcutHint } from './ShortcutHint';
import { ToothChart } from './ToothChart';
import { ToothTooltip } from './ToothTooltip';

const CLICK_SLOP_PX = 4;

/** The 3D view plus everything overlaid on it. */
export function Viewport({ error }: { error: string | null }) {
  const model = useJawStore((s) => s.model);
  // a shared view can't change anything, and the original plan never changes: neither has a history
  const hasHistory = useJawStore((s) => !s.viewOnly && !s.viewingOriginal);
  const container = useRef<HTMLElement>(null);
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

  // a click on empty space deselects; an orbit drag that ends on empty space doesn't
  const onPointerMissed = (e: MouseEvent) => {
    const p = pressedAt.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > CLICK_SLOP_PX) return;
    if (scene.gizmo?.axis) return;
    useJawStore.getState().select(null);
  };

  return (
    <main
      ref={container}
      className="viewport"
      onPointerDown={(e) => (pressedAt.current = { x: e.clientX, y: e.clientY })}
    >
      {model ? (
        <Canvas
          camera={{ fov: 30, near: 1, far: 2000, up: [0, 0, -1], position: [0, -150, 0] }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          flat
          linear
          legacy
          onPointerMissed={onPointerMissed}
        >
          <JawScene model={model} />
        </Canvas>
      ) : (
        <div className="viewport-loading">{error ? `Failed to load: ${error}` : 'Loading model…'}</div>
      )}
      <div className="top-bar">
        <VisibilityToolbar />
        <ViewToolbar />
        <AdjustmentToolbar />
      </div>
      <ShortcutHint />
      {model && <ShineSlider />}
      {model && hasHistory && <HistoryRail />}
      <div className="viewport-actions">
        <LookSwitch />
        <SummaryButton />
        <ShareButton />
      </div>
      <ToothTooltip container={container} />
      {model && (
        <div className="bottom-dock">
          {/* one column, as wide as the widest panel, so the chart lines up with the cards below */}
          <div className="dock-stack">
            <ToothChart />
            <ChangesBar />
            <StageBar />
          </div>
        </div>
      )}
    </main>
  );
}
