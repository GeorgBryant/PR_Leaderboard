import { useEffect } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";

export default function BenchPress() {
  const { scene, animations } = useGLTF("/models/bench-press.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    actions["ArmatureAction"]?.play();
    actions["BarbelAction"]?.play();

    return () => {
      actions["ArmatureAction"]?.stop();
      actions["BarbelAction"]?.stop();
    };
  }, [actions]);

  return <primitive object={scene} />;
}