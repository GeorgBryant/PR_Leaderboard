import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { sandMaterial } from "./SandMaterial";
import { skyMaterial } from "./SkyMaterial";
import { sunMaterial } from "./SunMaterial";
import { seaMaterial } from "./seaMaterial";

export default function BeachBackdrop() {
  const { scene } = useGLTF("/models/backdrop.glb");

  useFrame((state) => {
  seaMaterial.uniforms.uTime.value =
    state.clock.elapsedTime;
});

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name === "Sand") {
        child.material = sandMaterial;
        child.material.needsUpdate = true;
      }

      if (child.name === "Sea") {
        child.material = seaMaterial;
        child.material.needsUpdate = true;
      }

      if (child.name === "Sun") {
        child.material = sunMaterial;
        child.material.needsUpdate = true;
      }

      if (child.name === "SkyDome") {
        child.material = skyMaterial;
        child.material.needsUpdate = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[0, -6.4, 0]}
    />
  );
}

useGLTF.preload("/models/backdrop.glb");