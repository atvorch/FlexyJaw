import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AmbientLight,
  DirectionalLight,
  LinearSRGBColorSpace,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  WebGLRenderer,
} from 'three';
import type { JawModel, ToothModel } from '../../data/model';
import { adjustedMatrix } from '../../domain/adjustments';
import { COLORS, LIGHTING, createToothMaterial } from '../../scene/materials';
import { useJawStore } from '../../state/store';
import { archNeighbours, presetFrame, resetOrbit, type ComparePreset, type CompareOrbit } from './compareView';

interface Props {
  model: JawModel;
  tooth: ToothModel;
  preset: ComparePreset;
  /** 0..1: original is drawn left of the divider, adjusted right of it. */
  split: number;
  onSplit(split: number): void;
  orbit: CompareOrbit;
  /** The user started rotating away from the preset view. */
  onOrbitStart(): void;
  /** The user reset the view (double-click) back to the preset. */
  onResetView(): void;
  expanded: boolean;
  onToggleExpand(): void;
}

const DIVIDER_GRAB_PX = 14;
const ORBIT_SPEED = 0.012;
const ZOOM_MIN = 0.3, ZOOM_MAX = 3;

/*
 * One renderer for every comparison, kept for the life of the page. Browsers allow only a handful of WebGL
 * contexts at once and free disposed ones lazily, so a new renderer per opened tooth soon made the browser drop
 * the oldest context: the main 3D view.
 */
let sharedRenderer: WebGLRenderer | null = null;
function compareRenderer() {
  if (!sharedRenderer || sharedRenderer.getContext().isContextLost()) {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.setScissorTest(true);
    renderer.setClearColor(COLORS.background, 1);
    sharedRenderer = renderer;
  }
  return sharedRenderer;
}

const smoothstep = (x: number) => {
  x = Math.min(1, Math.max(0, x));
  return x * x * (3 - 2 * x);
};

/** Before/after picture of one tooth: one camera, two scenes split by a draggable divider. */
export function CompareViewer(props: Props) {
  const { model, tooth, split, onSplit, orbit, onOrbitStart, onResetView, expanded, onToggleExpand } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;

  // the two scenes, rebuilt per tooth and rendered every animation frame with the shared renderer
  useEffect(() => {
    const renderer = compareRenderer();
    const canvas = renderer.domElement;
    canvasHost.current!.appendChild(canvas);

    const camera = new PerspectiveCamera(30, 1, 0.5, 500);
    const lights: DirectionalLight[] = [];
    const makeScene = () => {
      const s = new Scene();
      const light = new DirectionalLight(0xffffff, LIGHTING.headlightIntensity);
      s.add(new AmbientLight(COLORS.ambient, LIGHTING.ambientIntensity), light, light.target);
      lights.push(light);
      return s;
    };
    const original = makeScene(), adjusted = makeScene();

    const toothMat = createToothMaterial();
    const neighbourMat = new MeshPhongMaterial({ color: 0xf2eee8, transparent: true, opacity: 0.4, depthWrite: false });
    const fixed = (geometryOf: ToothModel, mat: MeshPhongMaterial) => {
      const m = new Mesh(geometryOf.geometry, mat);
      m.matrixAutoUpdate = false;
      return m;
    };
    const neighbours = archNeighbours(model, tooth);
    const origTooth = fixed(tooth, toothMat), adjTooth = fixed(tooth, toothMat);
    const origNeighbours = neighbours.map((n) => fixed(n, neighbourMat));
    const adjNeighbours = neighbours.map((n) => fixed(n, neighbourMat));
    original.add(origTooth, ...origNeighbours);
    adjusted.add(adjTooth, ...adjNeighbours);

    const last = model.stageCount - 1;
    origTooth.matrix.copy(tooth.stageMatrices[last]);
    neighbours.forEach((n, i) => origNeighbours[i].matrix.copy(n.stageMatrices[last]));

    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      const { preset, split, orbit } = live.current;
      const size = wrap.current?.clientWidth ?? 0;
      if (!size) return;
      if (canvas.width !== Math.round(size * renderer.getPixelRatio())) renderer.setSize(size, size, false);

      // adjustments can change while the drawer is open
      const adjustments = useJawStore.getState().adjustments;
      adjTooth.matrix.copy(adjustedMatrix(tooth, adjustments[tooth.fdi], tooth.stageMatrices[last]));
      neighbours.forEach((n, i) => adjNeighbours[i].matrix.copy(adjustedMatrix(n, adjustments[n.fdi], n.stageMatrices[last])));

      // neighbours only help from the front; from the side or along the tooth they block it
      const showNeighbours = preset === 'front';
      for (const m of [...origNeighbours, ...adjNeighbours]) m.visible = showNeighbours;

      const { center, D, U } = presetFrame(model, tooth, preset);
      const distance = Math.max(tooth.size.x, tooth.size.y, tooth.size.z) * 4.2 * orbit.zoom;
      camera.position.copy(center).add(D.applyQuaternion(orbit.q).multiplyScalar(distance));
      camera.up.copy(U).applyQuaternion(orbit.q);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      for (const l of lights) {
        l.position.copy(camera.position);
        l.target.position.copy(center);
      }

      const sx = Math.round(size * split);
      renderer.setViewport(0, 0, size, size);
      renderer.setScissor(0, 0, sx, size);
      renderer.render(original, camera);
      renderer.setScissor(sx, 0, size - sx, size);
      renderer.render(adjusted, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      toothMat.dispose();
      neighbourMat.dispose();
      // the renderer stays for the next comparison; only its canvas leaves this picture
      canvas.remove();
    };
  }, [model, tooth]);

  // wheel zoom needs a non-passive listener to keep the page from scrolling
  useEffect(() => {
    const el = wrap.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const o = live.current.orbit;
      o.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, o.zoom * Math.exp(e.deltaY * 0.0012)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // pointer: drag near the divider moves it, anywhere else orbits the tooth
  const drag = useRef<'split' | { x: number; y: number; moved: boolean } | null>(null);
  const qa = useRef(new Quaternion());
  const nearDivider = (e: ReactPointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return Math.abs(e.clientX - (r.left + r.width * live.current.split)) < DIVIDER_GRAB_PX;
  };
  const splitFrom = (e: ReactPointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    onSplit(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.compare-expand')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (nearDivider(e)) {
      drag.current = 'split';
      splitFrom(e);
    } else {
      drag.current = { x: e.clientX, y: e.clientY, moved: false };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) {
      e.currentTarget.style.cursor = nearDivider(e) ? 'ew-resize' : 'grab';
      return;
    }
    if (d === 'split') return splitFrom(e);
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!dx && !dy) return;
    if (!d.moved) onOrbitStart(); // first real movement: the view is no longer a preset
    drag.current = { x: e.clientX, y: e.clientY, moved: true };
    const { U, R } = presetFrame(model, tooth, live.current.preset);
    orbit.q
      .multiply(qa.current.setFromAxisAngle(U, -dx * ORBIT_SPEED))
      .multiply(qa.current.setFromAxisAngle(R, -dy * ORBIT_SPEED))
      .normalize();
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    e.currentTarget.style.cursor = 'grab';
  };

  // the label of whichever side fills more of the picture stands out; the other fades with it
  const tagStyle = (share: number, lead: number) =>
    ({ opacity: 0.15 + 0.85 * smoothstep(share * 2), '--k': smoothstep(lead / 0.35) }) as React.CSSProperties;

  return (
    <div
      ref={wrap}
      className={`compare-picture${expanded ? ' big' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('.compare-expand')) return;
        resetOrbit(orbit);
        onResetView();
      }}
    >
      <div ref={canvasHost} className="compare-canvas" />
      <div className="compare-divider" style={{ left: `${split * 100}%` }} />
      <span className="compare-tag left" style={tagStyle(split, split - 0.5)}>Original</span>
      <span className="compare-tag right" style={tagStyle(1 - split, 0.5 - split)}>Adjusted</span>
      <button className="compare-expand" title={expanded ? 'Back to sidebar' : 'Open larger'} onClick={onToggleExpand}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={expanded ? 'M14 6h-4V2M2 10h4v4M10 6l4.5-4.5M6 10l-4.5 4.5' : 'M10 2h4v4M6 14H2v-4M14 2 9.5 6.5M2 14l4.5-4.5'} />
        </svg>
      </button>
    </div>
  );
}
