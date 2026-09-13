import { useFrame } from "@react-three/fiber";

export default function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const angle =
      Math.sin(t * 0.18) * 0.07;

    const radius = 8.5;

    state.camera.position.x =
      Math.sin(angle) * radius;

    state.camera.position.z =
      Math.cos(angle) * radius;

    state.camera.position.y = 6.4;

    state.camera.lookAt(0, 1.0, -3);
  });

  return null;
}