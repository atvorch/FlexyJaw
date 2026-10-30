import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { JawModel } from '../data/model';
import { frontView } from '../domain/layout';
import { useJawStore } from '../state/store';

const TWEEN_MS = 450;

interface Tween {
  start: number;
  fromTarget: Vector3;
  fromPosition: Vector3;
  toTarget: Vector3;
  toPosition: Vector3;
}

/** Frames the jaw on load and glides back to the front view whenever one is requested. */
export function CameraRig({ model }: { model: JawModel }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const request = useJawStore((s) => s.frontViewRequest);
  const tween = useRef<Tween | null>(null);
  const framed = useRef(false);

  // initial framing, as soon as the orbit controls exist
  useEffect(() => {
    if (!controls || framed.current) return;
    framed.current = true;
    const s = useJawStore.getState();
    const pose = frontView(model.bounds, s.showOriginal, s.originalGapMm);
    controls.target.copy(pose.target);
    camera.position.copy(pose.position);
    controls.update();
  }, [controls, camera, model]);

  // any user orbit cancels a running glide
  useEffect(() => {
    if (!controls) return;
    const cancel = () => (tween.current = null);
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controls]);

  useEffect(() => {
    if (!controls || request === 0) return;
    // flush leftover orbit momentum so it doesn't fight the glide
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    const s = useJawStore.getState();
    const pose = frontView(model.bounds, s.showOriginal, s.originalGapMm);
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
    camera.position.lerpVectors(t.fromPosition, t.toPosition, e);
    if (k === 1) tween.current = null;
  });

  return null;
}
