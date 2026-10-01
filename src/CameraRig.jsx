import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  useRef,
} from "react";

import * as THREE from "three";

const targetPosition =
  new THREE.Vector3();

const targetLookAt =
  new THREE.Vector3();

const currentLookAt =
  new THREE.Vector3(
    0,
    4,
    -100
  );

const mirrorWorldPosition =
  new THREE.Vector3();

const entranceWorldPosition =
  new THREE.Vector3();

const cameraOffset =
  new THREE.Vector3();

const transitionPosition =
  new THREE.Vector3();

const transitionLookAt =
  new THREE.Vector3();

const MIRROR_Z = 20;

const CAROUSEL_PORTAL_Z = 70;

const CAROUSEL_CAMERA_Z = 62;

const CAROUSEL_CAMERA_Y = -4.6;

const APPROACH_DURATION = 1.6;

const EXIT_DURATION = 1.15;

const RETURN_PORTAL_DURATION = 1.15;

const RETURN_HOME_DURATION = 1.6;

// Leaderboard prototype.
// Existing home / portal / carousel movement
// remains untouched.
const LEADERBOARD_LAUNCH_DURATION = 4.2;

// Cross back slightly early while the
// mannequin is filling the viewport.
const RETURN_CROSS_PROGRESS = 0.82;

// --------------------------------------------
// QUADRATIC BEZIER
// --------------------------------------------

function quadraticBezier(
  start,
  control,
  end,
  t,
  target
) {
  const inverse =
    1 - t;

  const a =
    inverse * inverse;

  const b =
    2 * inverse * t;

  const c =
    t * t;

  target.set(
    start.x * a +
      control.x * b +
      end.x * c,

    start.y * a +
      control.y * b +
      end.y * c,

    start.z * a +
      control.z * b +
      end.z * c
  );

  return target;
}

// --------------------------------------------
// SMOOTHSTEP
// --------------------------------------------

function smoothstep(t) {
  return (
    t *
    t *
    (3 - 2 * t)
  );
}

export default function CameraRig({
  mode = "home",
  onTransitionComplete,
}) {
  const { scene } =
    useThree();

  const previousMode =
    useRef("home");

  const transitionTime =
    useRef(0);

  const hasCrossed =
    useRef(false);

  const transitionComplete =
    useRef(false);

  // --------------------------------------------
  // FORWARD — PHASE 1
  // --------------------------------------------

  const approachStart =
    useRef(
      new THREE.Vector3()
    );

  const approachControl =
    useRef(
      new THREE.Vector3()
    );

  const approachEnd =
    useRef(
      new THREE.Vector3()
    );

  // --------------------------------------------
  // FORWARD — PHASE 2
  // --------------------------------------------

  const exitStart =
    useRef(
      new THREE.Vector3()
    );

  const exitControl =
    useRef(
      new THREE.Vector3()
    );

  const exitEnd =
    useRef(
      new THREE.Vector3(
        0,
        CAROUSEL_CAMERA_Y,
        CAROUSEL_CAMERA_Z
      )
    );

  // --------------------------------------------
  // RETURN — PHASE 1
  // CAROUSEL -> PORTAL
  // --------------------------------------------

  const returnPortalStart =
    useRef(
      new THREE.Vector3()
    );

  const returnPortalEnd =
    useRef(
      new THREE.Vector3()
    );

  // --------------------------------------------
  // RETURN — PHASE 2
  // MIRROR -> HOME
  // --------------------------------------------

  const returnHomeStart =
    useRef(
      new THREE.Vector3()
    );

  const returnHomeControl =
    useRef(
      new THREE.Vector3()
    );

  const returnHomeEnd =
    useRef(
      new THREE.Vector3()
    );

  // --------------------------------------------
  // LEADERBOARD PROTOTYPE
  // --------------------------------------------

  const leaderboardStart =
    useRef(
      new THREE.Vector3()
    );

  const leaderboardEnd =
    useRef(
      new THREE.Vector3()
    );

  const leaderboardStartRotation = useRef(new THREE.Quaternion());
  const leaderboardEndRotation = useRef(new THREE.Quaternion());

  useFrame((state, delta) => {
    const t =
      state.clock.elapsedTime;

    const camera =
      state.camera;

    // ------------------------------------------
    // MODE CHANGE
    // ------------------------------------------

    if (
      previousMode.current !==
      mode
    ) {
      // ----------------------------------------
      // BEGIN FORWARD TRANSITION
      // ----------------------------------------

      if (mode === "entering") {
        transitionTime.current =
          0;

        hasCrossed.current =
          false;

        transitionComplete.current =
          false;

        const sourcePortal =
          scene.getObjectByName(
            "Mirror"
          );

        if (sourcePortal) {
          sourcePortal.updateWorldMatrix(
            true,
            false
          );

          sourcePortal.getWorldPosition(
            mirrorWorldPosition
          );
        } else {
          mirrorWorldPosition.set(
            0,
            -2,
            MIRROR_Z
          );
        }

        approachStart.current.copy(
          camera.position
        );

        approachEnd.current.set(
          mirrorWorldPosition.x,
          mirrorWorldPosition.y,
          mirrorWorldPosition.z +
            0.15
        );

        approachControl.current.set(
          THREE.MathUtils.lerp(
            approachStart.current.x,
            approachEnd.current.x,
            0.5
          ),

          THREE.MathUtils.lerp(
            approachStart.current.y,
            approachEnd.current.y,
            0.5
          ) + 3.0,

          THREE.MathUtils.lerp(
            approachStart.current.z,
            approachEnd.current.z,
            0.5
          )
        );
      }

      // ----------------------------------------
      // BEGIN LEADERBOARD APPROACH
      // ----------------------------------------

      if (mode === "enteringLeaderboard") {
        transitionTime.current = 0;
        transitionComplete.current = false;
        leaderboardStart.current.copy(camera.position);
        leaderboardStartRotation.current.copy(camera.quaternion);
        currentLookAt.copy(camera.position).add(new THREE.Vector3(0, 0, 10));
      }

      // ----------------------------------------
      // BEGIN RETURN TRANSITION
      // ----------------------------------------

      if (mode === "exiting") {
        transitionTime.current =
          0;

        hasCrossed.current =
          false;

        transitionComplete.current =
          false;

        const sourcePortal =
          scene.getObjectByName(
            "Mirror"
          );

        const destinationPortal =
          scene.getObjectByName(
            "CarouselPortalEntrance"
          );

        if (sourcePortal) {
          sourcePortal.updateWorldMatrix(
            true,
            false
          );

          sourcePortal.getWorldPosition(
            mirrorWorldPosition
          );
        } else {
          mirrorWorldPosition.set(
            0,
            -2,
            MIRROR_Z
          );
        }

        if (destinationPortal) {
          destinationPortal.updateWorldMatrix(
            true,
            false
          );

          destinationPortal.getWorldPosition(
            entranceWorldPosition
          );
        } else {
          entranceWorldPosition.set(
            0,
            CAROUSEL_CAMERA_Y,
            CAROUSEL_PORTAL_Z
          );
        }

        returnPortalStart.current.copy(
          camera.position
        );

        returnPortalEnd.current.set(
          entranceWorldPosition.x,
          CAROUSEL_CAMERA_Y,
          entranceWorldPosition.z -
            0.15
        );
      }

      // Instant return from Mission Control: no descent or landing.
      if (mode === "carousel" &&
          (previousMode.current === "leaderboard" ||
           previousMode.current === "enteringLeaderboard")) {
        camera.position.set(0, CAROUSEL_CAMERA_Y, CAROUSEL_CAMERA_Z);
        camera.rotation.set(0, Math.PI, 0);
        targetPosition.copy(camera.position);
        currentLookAt.set(0, CAROUSEL_CAMERA_Y, CAROUSEL_PORTAL_Z);
        transitionTime.current = 0;
        transitionComplete.current = false;
      }

      if (mode === "home") {
        hasCrossed.current =
          false;

        transitionTime.current =
          0;

        transitionComplete.current =
          false;
      }

      previousMode.current =
        mode;
    }

    // ------------------------------------------
    // HOME
    // ------------------------------------------

    if (mode === "home") {
      const orbit =
        Math.sin(t * 0.15);

      targetPosition.set(
        orbit * 0.8,
        -2,
        52
      );

      targetLookAt.set(
        0,
        4,
        -100
      );

      camera.position.x =
        THREE.MathUtils.damp(
          camera.position.x,
          targetPosition.x,
          4,
          delta
        );

      camera.position.y =
        THREE.MathUtils.damp(
          camera.position.y,
          targetPosition.y,
          4,
          delta
        );

      camera.position.z =
        THREE.MathUtils.damp(
          camera.position.z,
          targetPosition.z,
          4,
          delta
        );

      currentLookAt.x =
        THREE.MathUtils.damp(
          currentLookAt.x,
          targetLookAt.x,
          4,
          delta
        );

      currentLookAt.y =
        THREE.MathUtils.damp(
          currentLookAt.y,
          targetLookAt.y,
          4,
          delta
        );

      currentLookAt.z =
        THREE.MathUtils.damp(
          currentLookAt.z,
          targetLookAt.z,
          4,
          delta
        );

      camera.lookAt(
        currentLookAt
      );

      return;
    }

    // ------------------------------------------
    // ENTERING
    // ------------------------------------------

    if (mode === "entering") {
      transitionTime.current +=
        delta;

      // ----------------------------------------
      // FORWARD PHASE 1
      // HOME -> MIRROR
      // ----------------------------------------

      if (!hasCrossed.current) {
        const rawProgress =
          THREE.MathUtils.clamp(
            transitionTime.current /
              APPROACH_DURATION,
            0,
            1
          );

const progress =
  rawProgress;

        quadraticBezier(
          approachStart.current,
          approachControl.current,
          approachEnd.current,
          progress,
          transitionPosition
        );

        camera.position.copy(
          transitionPosition
        );

// ----------------------------------------
// FINAL UPWARD TILT
// ----------------------------------------
//
// Keep looking at the mirror normally for
// most of the approach.
//
// During the final 25%, gradually rotate
// the camera upward before crossing.

const tiltProgress =
  THREE.MathUtils.smoothstep(
    rawProgress,
    0.92,
    1
  );

transitionLookAt.set(
  mirrorWorldPosition.x,

  mirrorWorldPosition.y +
    tiltProgress * 0.2,

  mirrorWorldPosition.z
);

currentLookAt.lerp(
  transitionLookAt,
  THREE.MathUtils.clamp(
    delta * 5,
    0,
    1
  )
);

camera.lookAt(
  currentLookAt
);

camera.lookAt(
  currentLookAt
);

        if (rawProgress >= 1) {
          const sourcePortal =
            scene.getObjectByName(
              "Mirror"
            );

          const destinationPortal =
            scene.getObjectByName(
              "CarouselPortalEntrance"
            );

          if (
            sourcePortal &&
            destinationPortal
          ) {
            sourcePortal.updateWorldMatrix(
              true,
              false
            );

            destinationPortal.updateWorldMatrix(
              true,
              false
            );

            sourcePortal.getWorldPosition(
              mirrorWorldPosition
            );

            destinationPortal.getWorldPosition(
              entranceWorldPosition
            );

            cameraOffset
              .copy(
                camera.position
              )
              .sub(
                mirrorWorldPosition
              );

            camera.position.set(
              entranceWorldPosition.x -
                cameraOffset.x,

              entranceWorldPosition.y +
                cameraOffset.y,

              entranceWorldPosition.z -
                cameraOffset.z
            );

            camera.position.z =
              64.5;

            camera.position.y =
              CAROUSEL_CAMERA_Y;
          } else {
            camera.position.set(
              0,
              CAROUSEL_CAMERA_Y,
              64.5
            );

            entranceWorldPosition.set(
              0,
              CAROUSEL_CAMERA_Y,
              CAROUSEL_PORTAL_Z
            );
          }

          exitStart.current.copy(
            camera.position
          );

          exitEnd.current.set(
            0,
            CAROUSEL_CAMERA_Y,
            CAROUSEL_CAMERA_Z
          );

          exitControl.current.set(
            THREE.MathUtils.lerp(
              exitStart.current.x,
              exitEnd.current.x,
              0.5
            ),

            THREE.MathUtils.lerp(
              exitStart.current.y,
              exitEnd.current.y,
              0.5
            ),

            THREE.MathUtils.lerp(
              exitStart.current.z,
              exitEnd.current.z,
              0.5
            )
          );

          transitionTime.current =
            0;

          hasCrossed.current =
            true;

          camera.rotation.set(
            0,
            Math.PI,
            0
          );
        }

        return;
      }

      // ----------------------------------------
      // FORWARD PHASE 2
      // PORTAL -> CAROUSEL
      // ----------------------------------------

      const rawProgress =
        THREE.MathUtils.clamp(
          transitionTime.current /
            EXIT_DURATION,
          0,
          1
        );

      const progress =
        smoothstep(
          rawProgress
        );

      quadraticBezier(
        exitStart.current,
        exitControl.current,
        exitEnd.current,
        progress,
        transitionPosition
      );

      camera.position.copy(
        transitionPosition
      );

      camera.rotation.set(
        0,
        Math.PI,
        0
      );

      if (
        rawProgress >= 1 &&
        !transitionComplete.current
      ) {
        transitionComplete.current =
          true;

        onTransitionComplete?.(
          "carousel"
        );
      }

      return;
    }

    // ------------------------------------------
    // CAROUSEL
    // ------------------------------------------

    if (mode === "carousel") {
      targetPosition.set(
        0,
        CAROUSEL_CAMERA_Y,
        CAROUSEL_CAMERA_Z
      );

      camera.position.x =
        THREE.MathUtils.damp(
          camera.position.x,
          targetPosition.x,
          4,
          delta
        );

      camera.position.y =
        THREE.MathUtils.damp(
          camera.position.y,
          targetPosition.y,
          4,
          delta
        );

      camera.position.z =
        THREE.MathUtils.damp(
          camera.position.z,
          targetPosition.z,
          4,
          delta
        );

      camera.rotation.set(
        0,
        Math.PI,
        0
      );

      return;
    }

    // ------------------------------------------
    // ROCKET LAUNCH — GROUNDED CAMERA, THEN PURSUIT
    // ------------------------------------------
    if (mode === "enteringLeaderboard") {
      transitionTime.current += delta;
      const elapsed = transitionTime.current;
      const progress = THREE.MathUtils.clamp(
        elapsed / LEADERBOARD_LAUNCH_DURATION, 0, 1
      );
      const target = scene.getObjectByName("LaunchCameraTarget");
      if (target) {
        target.updateWorldMatrix(true, false);
        target.getWorldPosition(leaderboardEnd.current);

        // Establish the launch from the existing carousel camera position.
        // Do not pitch or move during the first half-second.
        const chase = THREE.MathUtils.smoothstep(elapsed, 0.65, 1.5);
        targetPosition.copy(leaderboardEnd.current);
        targetPosition.add(new THREE.Vector3(0, -3.0, -12));
        // Keep lateral framing fixed across models with different pivots.
        targetPosition.x = 0;
        targetPosition.y = Math.max(targetPosition.y, CAROUSEL_CAMERA_Y);
        const followRate = 1 - Math.exp(-delta * 1.8 * chase);
        camera.position.lerp(targetPosition, followRate);

        // Begin the upward tilt only after the rocket clears the scene.
        targetLookAt.copy(leaderboardEnd.current).add(
          new THREE.Vector3(0, 1.2, 0)
        );
        targetLookAt.x = 0;
        const lookRate = 1 - Math.exp(-delta * 2.8 * chase);
        currentLookAt.lerp(targetLookAt, lookRate);
        if (chase > 0) {
          // Quaternion blend avoids an abrupt jump from carousel rotation.
          const lookMatrix = new THREE.Matrix4().lookAt(
            camera.position, currentLookAt, camera.up
          );
          leaderboardEndRotation.current.setFromRotationMatrix(lookMatrix);
          camera.quaternion.slerp(
            leaderboardEndRotation.current,
            1 - Math.exp(-delta * 4 * chase)
          );
        }
      }
      if (progress >= 1 && !transitionComplete.current) {
        transitionComplete.current = true;
        onTransitionComplete?.("leaderboard");
      }
      return;
    }

    // Hold the final pursuit composition for this first prototype.
    if (mode === "leaderboard") {
      const target = scene.getObjectByName("LaunchCameraTarget");
      if (target) {
        target.updateWorldMatrix(true, false);
        target.getWorldPosition(leaderboardEnd.current);
        camera.position.copy(leaderboardEnd.current).add(new THREE.Vector3(0, -2.1, -10));
        camera.position.x = 0;
        camera.position.y = Math.max(camera.position.y, -3.1);
        currentLookAt.copy(leaderboardEnd.current).add(new THREE.Vector3(0, 1.5, 0));
        currentLookAt.x = 0;
        camera.lookAt(currentLookAt);
      }
      return;
    }

    // ------------------------------------------
    // EXITING
    // ------------------------------------------

    if (mode === "exiting") {
      transitionTime.current +=
        delta;

      // ----------------------------------------
      // RETURN PHASE 1
      // CAROUSEL -> MANNEQUIN / PORTAL
      // ----------------------------------------

      if (!hasCrossed.current) {
        const rawProgress =
          THREE.MathUtils.clamp(
            transitionTime.current /
              RETURN_PORTAL_DURATION,
            0,
            1
          );

        const progress =
          smoothstep(
            rawProgress
          );

        transitionPosition.lerpVectors(
          returnPortalStart.current,
          returnPortalEnd.current,
          progress
        );

        camera.position.copy(
          transitionPosition
        );

        // Stay level while moving into
        // the mannequin.
        camera.rotation.set(
          0,
          Math.PI,
          0
        );

        // --------------------------------------
        // EARLY REVERSE CROSSING
        // --------------------------------------
        //
        // Remap before reaching the literal
        // portal plane, while the mannequin
        // still fills the viewport.
        //
        // This lets the mannequin act as a
        // natural visual wipe.

        if (
          progress >=
          RETURN_CROSS_PROGRESS
        ) {
          const sourcePortal =
            scene.getObjectByName(
              "Mirror"
            );

          const destinationPortal =
            scene.getObjectByName(
              "CarouselPortalEntrance"
            );

          if (
            sourcePortal &&
            destinationPortal
          ) {
            sourcePortal.updateWorldMatrix(
              true,
              false
            );

            destinationPortal.updateWorldMatrix(
              true,
              false
            );

            sourcePortal.getWorldPosition(
              mirrorWorldPosition
            );

            destinationPortal.getWorldPosition(
              entranceWorldPosition
            );

            // ----------------------------------
            // INVERSE PORTAL REMAP
            // ----------------------------------

            cameraOffset
              .copy(
                camera.position
              )
              .sub(
                entranceWorldPosition
              );

            camera.position.set(
              mirrorWorldPosition.x -
                cameraOffset.x,

              mirrorWorldPosition.y,

              mirrorWorldPosition.z -
                cameraOffset.z
            );
          } else {
            camera.position.set(
              0,
              -2,
              MIRROR_Z + 0.15
            );
          }

          // ------------------------------------
          // BUILD MIRROR -> HOME PATH
          // ------------------------------------

          returnHomeStart.current.copy(
            camera.position
          );

          returnHomeEnd.current.set(
            0,
            -2,
            52
          );

          returnHomeControl.current.set(
            THREE.MathUtils.lerp(
              returnHomeStart.current.x,
              returnHomeEnd.current.x,
              0.5
            ),

            THREE.MathUtils.lerp(
              returnHomeStart.current.y,
              returnHomeEnd.current.y,
              0.5
            ) + 3.0,

            THREE.MathUtils.lerp(
              returnHomeStart.current.z,
              returnHomeEnd.current.z,
              0.5
            )
          );

          transitionTime.current =
            0;

          hasCrossed.current =
            true;

          currentLookAt.set(
            mirrorWorldPosition.x,
            mirrorWorldPosition.y,
            mirrorWorldPosition.z
          );
        }

        return;
      }

      // ----------------------------------------
      // RETURN PHASE 2
      // MIRROR -> CREST -> HOME
      // ----------------------------------------

      const rawProgress =
        THREE.MathUtils.clamp(
          transitionTime.current /
            RETURN_HOME_DURATION,
          0,
          1
        );

      const progress =
        smoothstep(
          rawProgress
        );

      quadraticBezier(
        returnHomeStart.current,
        returnHomeControl.current,
        returnHomeEnd.current,
        progress,
        transitionPosition
      );

      camera.position.copy(
        transitionPosition
      );

      // Gradually restore the normal
      // home composition.

      transitionLookAt.set(
        0,
        4,
        -100
      );

      currentLookAt.lerp(
        transitionLookAt,
        THREE.MathUtils.clamp(
          delta * 4,
          0,
          1
        )
      );

      camera.lookAt(
        currentLookAt
      );

      if (
        rawProgress >= 1 &&
        !transitionComplete.current
      ) {
        transitionComplete.current =
          true;

        onTransitionComplete?.(
          "home"
        );
      }

      return;
    }
  });

  return null;
}