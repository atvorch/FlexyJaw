import { useEffect, useMemo } from 'react';
import { DirectionalLight, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useThree } from '@react-three/fiber';
import { useJawStore } from '../state/store';
import { COLORS, LIGHTING, REAL } from './materials';

/**
 * Warm ambient fill plus a headlight that follows the camera, as in the original viewer. The realistic look
 * adds a soft studio environment for reflections and a key light from above the patient.
 */
export function Lighting() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const realistic = useJawStore((s) => s.realistic);
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

  useEffect(() => {
    headlight.intensity = realistic ? REAL.headlightIntensity : LIGHTING.headlightIntensity;
    if (!realistic) return;
    const pmrem = new PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [realistic, gl, scene, headlight]);

  return (
    <>
      <ambientLight
        color={COLORS.ambient}
        intensity={realistic ? REAL.ambientIntensity : LIGHTING.ambientIntensity}
      />
      {/* -z is up: a key light from above and in front, as from a ceiling lamp */}
      {realistic && <directionalLight position={[20, -80, -120]} intensity={REAL.keyIntensity} />}
    </>
  );
}
