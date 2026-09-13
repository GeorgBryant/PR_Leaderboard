import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { createEnvironmentMaterial } from "./shaders/createEnvironmentMaterial";

export default function Backdrop() {
  const material = useMemo(() => {
    return createEnvironmentMaterial();
  }, []);

  useFrame((state) => {
    material.uniforms.time.value =
      state.clock.getElapsedTime();
  });

  return (
    <mesh>
      <sphereGeometry
        args={[100, 64, 64]}
      />

      <primitive
        object={material}
        attach="material"
      />
    </mesh>
  );
}