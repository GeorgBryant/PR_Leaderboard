import {
  useMemo,
  useEffect,
  useRef,
} from "react";

import {
  useAnimations,
  useGLTF,
} from "@react-three/drei";

import {
  useFrame,
} from "@react-three/fiber";

import {
  createGalaxyMaterial,
} from "./shaders/createGalaxyMaterial";

const MANNEQUIN_MESHES =
  new Set([
    "Head_1",
    "Neck_1",
    "Left_Hand",
    "Left_Forearm",
    "Left_Bicep",
    "Right_Hand",
    "Right_Forearm",
    "Right_Bicep",
    "Chest_1",
    "Left_Foot",
    "Left_Calf",
    "Left_Thigh",
    "Right_Foot",
    "Right_Calf",
    "Right_Thigh",
    "Waist",
  ]);

export default function Exercise({
  url,
}) {
  const group = useRef();

  const {
    scene,
    animations,
  } = useGLTF(url);

  const {
    actions,
    mixer,
  } = useAnimations(
    animations,
    group
  );

  const galaxyMaterial =
    useMemo(() => {
      return createGalaxyMaterial();
    }, []);


  // --------------------------------------------
  // MATERIALS + SHADOW CASTING
  // --------------------------------------------

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      // Allow every part of the exercise
      // model to contribute to ContactShadows.
      child.castShadow = true;

      // Galaxy shader only applies
      // to mannequin geometry.
      if (
        MANNEQUIN_MESHES.has(
          child.name
        )
      ) {
        child.material =
          galaxyMaterial;
      }
    });

    return () => {
      galaxyMaterial.dispose();
    };
  }, [
    scene,
    galaxyMaterial,
  ]);


  // --------------------------------------------
  // GALAXY SHADER
  // --------------------------------------------

  useFrame((state) => {
    galaxyMaterial.uniforms
      .time.value =
      state.clock.getElapsedTime();

    if (group.current) {
      group.current.getWorldPosition(
        galaxyMaterial.uniforms
          .mannequinOrigin
          .value
      );
    }
  });


  // --------------------------------------------
  // ANIMATION SETUP
  // --------------------------------------------

  useEffect(() => {
    const activeActions =
      Object.values(
        actions
      ).filter(Boolean);

    activeActions.forEach(
      (action) => {
        action.reset();
        action.paused = true;
        action.play();
      }
    );

    return () => {
      activeActions.forEach(
        (action) =>
          action.stop()
      );
    };
  }, [actions]);


  // --------------------------------------------
  // MANUAL ANIMATION SYNC
  // --------------------------------------------

  useFrame((state) => {
    const time =
      state.clock.getElapsedTime();

    Object.values(
      actions
    ).forEach((action) => {
      if (!action) {
        return;
      }

      const duration =
        action.getClip().duration;

      action.time =
        time % duration;
    });

    mixer.update(0);
  });


  // --------------------------------------------
  // MODEL
  // --------------------------------------------

  return (
    <group ref={group}>
      <primitive
        object={scene}
      />
    </group>
  );
}