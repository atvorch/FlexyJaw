import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { JawScene } from '../../scene/JawScene';
import { scene } from '../../scene/registry';
import { useJawStore } from '../../state/store';
import { ChangesBar } from '../compare/ChangesBar';
import { CompareDrawer } from '../compare/CompareDrawer';
import { ViewToolbar } from './ViewToolbar';
import { HistoryBar } from './HistoryBar';
import { ShortcutHint } from './ShortcutHint';
import { ToothTooltip } from './ToothTooltip';

const CLICK_SLOP_PX = 4;

/** The 3D view plus everything overlaid on it. */
export function Viewport({ error }: { error: string | null }) {
  const model = useJawStore((s) => s.model);
  const compareOpen = useJawStore((s) => s.compared != null);
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
      className={`viewport${compareOpen ? ' compare-open' : ''}`}
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
      <ViewToolbar />
      <ShortcutHint />
      <ToothTooltip container={container} />
      {model && (
        <div className="bottom-dock">
          <ChangesBar />
          <HistoryBar />
        </div>
      )}
      <CompareDrawer />
    </main>
  );
}
