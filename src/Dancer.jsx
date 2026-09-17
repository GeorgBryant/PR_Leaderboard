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
  useThree,
} from "@react-three/fiber";

import * as THREE from "three";

import {
  createGalaxyMaterial,
} from "./shaders/createGalaxyMaterial";

const MANNEQUIN_MESHES =
  new Set([
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

const HOME_POSITION =
  new THREE.Vector3(
    0,
    -2.9,
    23
  );

const HOME_SCALE = 0.8;

const PORTAL_SCALE = 0.005;

// Match the carousel -> portal
// section of CameraRig.
const RETURN_DANCER_DELAY = 1.15;

export default function Dancer({
  mode = "home",
}) {
  const group =
    useRef();

  const chestRef =
    useRef();

  const previousMode =
    useRef(mode);

  const returnTime =
    useRef(0);

  const {
    scene: threeScene,
  } = useThree();

  const {
    scene,
    animations,
  } = useGLTF(
    "/models/dance.glb"
  );

  const { actions } =
    useAnimations(
      animations,
      group
    );

  const mirrorPosition =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const galaxyMaterial =
    useMemo(() => {
      return createGalaxyMaterial();
    }, []);

  // --------------------------------------------
  // MANNEQUIN MATERIAL
  // --------------------------------------------

  useEffect(() => {
    scene.traverse((child) => {
      if (
        child.isMesh &&
        MANNEQUIN_MESHES.has(
          child.name
        )
      ) {
        child.material =
          galaxyMaterial;
      }

      if (
        child.name === "Chest"
      ) {
        chestRef.current =
          child;
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
  // DANCE ANIMATION
  // --------------------------------------------

  useEffect(() => {
    const activeActions =
      Object.values(
        actions
      ).filter(Boolean);

    activeActions.forEach(
      (action) => {
        action.reset().play();
      }
    );

    return () => {
      activeActions.forEach(
        (action) => {
          action.stop();
        }
      );
    };
  }, [actions]);

  // --------------------------------------------
  // FRAME UPDATE
  // --------------------------------------------

  useFrame((state, delta) => {
    galaxyMaterial.uniforms
      .time.value =
      state.clock.getElapsedTime();

    // ------------------------------------------
    // GALAXY SHADER ORIGIN
    // ------------------------------------------

    if (chestRef.current) {
      chestRef.current
        .getWorldPosition(
          galaxyMaterial
            .uniforms
            .mannequinOrigin
            .value
        );
    }

    if (!group.current) {
      return;
    }

    // ------------------------------------------
    // MODE CHANGE
    // ------------------------------------------

    if (
      previousMode.current !==
      mode
    ) {
      // Prepare the dancer at the exact
      // centre of the mirror as soon as
      // the return begins.
      //
      // He stays hidden and tiny until
      // the camera has crossed back.

      if (mode === "exiting") {
        returnTime.current = 0;

        const mirror =
          threeScene.getObjectByName(
            "Mirror"
          );

        if (mirror) {
          mirror.updateWorldMatrix(
            true,
            false
          );

          mirror.getWorldPosition(
            mirrorPosition
          );

          group.current.position.set(
            mirrorPosition.x,
            mirrorPosition.y,
            mirrorPosition.z
          );
        }

        group.current.scale.setScalar(
          PORTAL_SCALE
        );

        group.current.visible =
          false;
      }

      previousMode.current =
        mode;
    }

    // ------------------------------------------
    // DANCER INTO PORTAL
    // ------------------------------------------

    if (mode === "entering") {
      const mirror =
        threeScene.getObjectByName(
          "Mirror"
        );

      if (mirror) {
        mirror.updateWorldMatrix(
          true,
          false
        );

        mirror.getWorldPosition(
          mirrorPosition
        );

        // Move backward toward the
        // actual centre of the mirror.

        group.current.position.x =
          THREE.MathUtils.damp(
            group.current.position.x,
            mirrorPosition.x,
            3,
            delta
          );

        // As the dancer shrinks,
        // gradually bend his trajectory
        // downward.

        const shrinkProgress =
          THREE.MathUtils.clamp(
            1 -
              group.current.scale.x /
                HOME_SCALE,
            0,
            1
          );

        const delayedProgress =
          THREE.MathUtils.clamp(
            (shrinkProgress - 0.2) /
              0.8,
            0,
            1
          );

        const downwardCurve =
          delayedProgress *
          delayedProgress;

        const targetY =
          mirrorPosition.y -
          downwardCurve * 1.5;

        group.current.position.y =
          THREE.MathUtils.damp(
            group.current.position.y,
            targetY,
            3,
            delta
          );

        group.current.position.z =
          THREE.MathUtils.damp(
            group.current.position.z,
            mirrorPosition.z,
            3,
            delta
          );
      }

      // Shrink as the dancer travels
      // into the portal.

      const scale =
        THREE.MathUtils.damp(
          group.current.scale.x,
          PORTAL_SCALE,
          7,
          delta
        );

      group.current.scale.setScalar(
        scale
      );

      if (scale < 0.015) {
        group.current.visible =
          false;
      }
    }

    // ------------------------------------------
    // DANCER OUT OF PORTAL
    // ------------------------------------------

    if (mode === "exiting") {
      returnTime.current +=
        delta;

      // Wait for CameraRig to complete
      // its carousel -> portal movement.

      if (
        returnTime.current <
        RETURN_DANCER_DELAY
      ) {
        return;
      }

      const mirror =
        threeScene.getObjectByName(
          "Mirror"
        );

      if (mirror) {
        mirror.updateWorldMatrix(
          true,
          false
        );

        mirror.getWorldPosition(
          mirrorPosition
        );

        group.current.visible =
          true;

        // --------------------------------------
        // SCALE BACK UP — SLOWER
        // --------------------------------------

        const scale =
          THREE.MathUtils.damp(
            group.current.scale.x,
            HOME_SCALE,
            2.5,
            delta
          );

        group.current.scale.setScalar(
          scale
        );

        // --------------------------------------
        // EMERGE FROM MIRROR
        // --------------------------------------

        const growProgress =
          THREE.MathUtils.clamp(
            (
              scale -
              PORTAL_SCALE
            ) /
              (
                HOME_SCALE -
                PORTAL_SCALE
              ),
            0,
            1
          );

        // Start at the exact centre of
        // the mirror and gradually settle
        // down toward the normal dancer Y.

        const targetY =
          THREE.MathUtils.lerp(
            mirrorPosition.y,
            HOME_POSITION.y,
            growProgress
          );

        // Move slowly out from the
        // centre of the mirror.

        group.current.position.x =
          THREE.MathUtils.damp(
            group.current.position.x,
            HOME_POSITION.x,
            1.8,
            delta
          );

        group.current.position.y =
          THREE.MathUtils.damp(
            group.current.position.y,
            targetY,
            1.8,
            delta
          );

        // Physically travel forward
        // out of the mirror while growing.

        group.current.position.z =
          THREE.MathUtils.damp(
            group.current.position.z,
            HOME_POSITION.z,
            1.8,
            delta
          );
      }
    }

    // ------------------------------------------
    // RESET WHEN HOME
    // ------------------------------------------

    if (mode === "home") {
      group.current.position.copy(
        HOME_POSITION
      );

      group.current.scale.setScalar(
        HOME_SCALE
      );

      group.current.visible =
        true;
    }

    // ------------------------------------------
    // HIDE IN CAROUSEL
    // ------------------------------------------

    if (mode === "carousel") {
      group.current.visible =
        false;
    }
  });

  // --------------------------------------------
  // DANCER
  // --------------------------------------------

  return (
    <group
      ref={group}
      position={[
        HOME_POSITION.x,
        HOME_POSITION.y,
        HOME_POSITION.z,
      ]}
      scale={
        HOME_SCALE
      }
    >
      <primitive
        object={scene}
      />
    </group>
  );
}