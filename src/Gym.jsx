import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { useFrame } from "@react-three/fiber";
import { createWallMaterial } from "./shaders/createWallMaterial";

export default function Gym() {
  const { scene } = useGLTF("/models/gym.glb");

  const wallMaterial = useMemo(() => {
    return createWallMaterial();
  }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (
        child.name === "BackWall" ||
        child.name === "LeftWall" ||
        child.name === "RightWall"
      ) {
        child.material = wallMaterial;
      }
    });

    return () => {
      wallMaterial.dispose();
    };
  }, [scene, wallMaterial]);

  useFrame((state) => {
    wallMaterial.uniforms.time.value =
      state.clock.getElapsedTime();
  });

  const mirror = useMemo(() => {
    const placeholder =
      scene.getObjectByName("Mirror");

    if (!placeholder) return null;

    placeholder.visible = false;

    const geometry =
      new THREE.PlaneGeometry(
        8.1717,
        3.2687
      );

    const reflector =
      new Reflector(geometry, {
        clipBias: 0.003,
        textureWidth: 1024,
        textureHeight: 1024,
        color: 0x888888,
      });

    reflector.position.set(
      placeholder.position.x,
      placeholder.position.y,
      placeholder.position.z - 0.05
    );

    reflector.rotation.y = Math.PI;

    return reflector;
  }, [scene]);

  return (
    <group
      rotation={[0, Math.PI, 0]}
      position={[0, -4.5, -15]}
    >
      <primitive object={scene} />

      {mirror && (
        <primitive object={mirror} />
      )}
    </group>
  );
}