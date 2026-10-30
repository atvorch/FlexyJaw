import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { JawModel } from '../data/model';
import { cameraPose } from '../domain/layout';
import { useJawStore } from '../state/store';

const TWEEN_MS = 450;

interface Tween {
  start: number;
  fromTarget: Vector3;
  fromPosition: Vector3;
  toTarget: Vector3;
  toPosition: Vector3;
}

const poseFromStore = (model: JawModel) => {
  const s = useJawStore.getState();
  return cameraPose(s.cameraView, model.bounds, s.showOriginal, s.originalGapMm);
};

/** Frames the jaw on load and glides to a preset view (front, sides, top, bottom) whenever one is requested. */
export function CameraRig({ model }: { model: JawModel }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const request = useJawStore((s) => s.viewRequest);
  const tween = useRef<Tween | null>(null);
  const framed = useRef(false);

  // initial framing, as soon as the orbit controls exist
  useEffect(() => {
    if (!controls || framed.current) return;
    framed.current = true;
    const pose = poseFromStore(model);
    controls.target.copy(pose.target);
    camera.position.copy(pose.position);
    controls.update();
  }, [controls, camera, model]);

  // any user orbit / zoom cancels a running glide and un-lights the preset button
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      tween.current = null;
      useJawStore.getState().leaveView();
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);

  useEffect(() => {
    if (!controls || request === 0) return;
    // flush leftover orbit momentum so it doesn't fight the glide
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    const pose = poseFromStore(model);
    tween.current = {
      start: performance.now(),
      fromTarget: controls.target.clone(),
      fromPosition: camera.position.clone(),
      toTarget: pose.target,
      toPosition: pose.position,
    };
  }, [request, controls, camera, model]);

  useFrame(() => {
    const t = tween.current;
    if (!t || !controls) return;
    const k = Math.min(1, (performance.now() - t.start) / TWEEN_MS);
    const e = 1 - Math.pow(1 - k, 3);
    controls.target.lerpVectors(t.fromTarget, t.toTarget, e);
    // glide around the target rather than straight through it, so front ↔ top doesn't dive into the jaw
    const from = t.fromPosition.clone().sub(t.fromTarget), to = t.toPosition.clone().sub(t.toTarget);
    const radius = from.length() + (to.length() - from.length()) * e;
    const dir = from.normalize().lerp(to.normalize(), e);
    if (dir.lengthSq() < 1e-8) dir.copy(to); // exactly opposite views: just jump direction
    camera.position.copy(controls.target).addScaledVector(dir.normalize(), radius);
    if (k === 1) tween.current = null;
  });

  return null;
}
