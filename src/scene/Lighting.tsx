import { useEffect, useMemo } from 'react';
import { DirectionalLight } from 'three';
import { useThree } from '@react-three/fiber';
import { COLORS, LIGHTING } from './materials';

/** Warm ambient fill plus a headlight that follows the camera, as in the original viewer. */
export function Lighting() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const headlight = useMemo(() => {
    const light = new DirectionalLight(0xffffff, LIGHTING.headlightIntensity);
    light.position.set(0, 0, 1);
    light.target.position.set(0, 0, 0);
    return light;
  }, []);

  useEffect(() => {
    // the camera has to be in the scene graph for its children (the light) to render
    scene.add(camera);
    camera.add(headlight, headlight.target);
    return () => {
      camera.remove(headlight, headlight.target);
      scene.remove(camera);
    };
  }, [camera, scene, headlight]);

  return <ambientLight color={COLORS.ambient} intensity={LIGHTING.ambientIntensity} />;
}
