import { useMemo, useEffect, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createGalaxyMaterial } from "./shaders/createGalaxyMaterial";

const MANNEQUIN_MESHES = new Set([
  "Head",
  "Neck",
  "Left_Hand",
  "Left_Forearm",
  "Left_Bicep",
  "Right_Hand",
  "Right_Forearm",
  "Right_Bicep",
  "Chest",
  "Left_Foot",
  "Left_Calf",
  "Left_Thigh",
  "Right_Foot",
  "Right_Calf",
  "Right_Thigh",
  "Waist",
]);

export default function Dancer() {
  const group = useRef();

    const chestRef = useRef();

  const { scene, animations } =
    useGLTF("/models/dance.glb");

  const { actions } =
    useAnimations(animations, group);

  const galaxyMaterial = useMemo(() => {
    return createGalaxyMaterial();
  }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (
        child.isMesh &&
        MANNEQUIN_MESHES.has(child.name)
      ) {
        child.material = galaxyMaterial;
      }

      if (child.name === "Chest") {
        chestRef.current = child;
      }
    });


    
    return () => {
      galaxyMaterial.dispose();
    };
  }, [scene, galaxyMaterial]);

  useEffect(() => {
    const activeActions =
      Object.values(actions).filter(Boolean);

    activeActions.forEach((action) => {
      action.reset().play();
    });

    return () => {
      activeActions.forEach((action) => {
        action.stop();
      });
    };
  }, [actions]);

  useFrame((state) => {
    galaxyMaterial.uniforms.time.value =
      state.clock.getElapsedTime();

    if (chestRef.current) {
      chestRef.current.getWorldPosition(
        galaxyMaterial.uniforms
          .mannequinOrigin.value
      );
    }
  });

return (
  <group
    ref={group}
    position={[0, -3, -15]}
    scale={0.8}
  >
    <primitive object={scene} />
  </group>
);
}