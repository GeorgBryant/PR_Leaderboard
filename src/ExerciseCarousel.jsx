import {
  useMemo,
  useRef,
} from "react";

import {
  useFrame,
} from "@react-three/fiber";

import * as THREE from "three";

import Exercise from "./Exercise";


const exercises = [
  {
    id: "bench",
    name: "BENCH PRESS",
    url: "/models/bench-press.glb",
    scale: 0.5,
    y: -.1,
    rotationX:
      Math.PI / 0.475,
    rotationY: 0,
    rotationZ: 0,

    // SHADOW
    shadowX: 0,
    shadowY: -1.8,
    shadowZ: 0,
    shadowWidth: 4,
    shadowDepth: 2,
  },

  {
    id: "squat",
    name: "SQUAT",
    url: "/models/squat.glb",
    scale: 0.5,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,

    // SHADOW
    shadowX: 0,
    shadowY: -2,
    shadowZ: 0,
    shadowWidth: 3,
    shadowDepth: 1.5,
  },

  {
    id: "deadlift",
    name: "DEADLIFT",
    url: "/models/deadlift.glb",
    scale: 1.5,
    y: -.85,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,

    // SHADOW
    shadowX: 0,
    shadowY: 0.02,
    shadowZ: 0,
    shadowWidth: 3.5,
    shadowDepth: 1.5,
  },

  {
    id: "press",
    name: "OVERHEAD PRESS",
    url: "/models/overhead-press.glb",
    scale: 1.25,
    y: 0,
    rotationX: 0,
    rotationY:
      -Math.PI / 2,
    rotationZ: 0,

    // SHADOW
    shadowX: 0,
    shadowY: -0.75,
    shadowZ: 0,
    shadowWidth: 3,
    shadowDepth: 1.5,
  },
];


// --------------------------------------------
// SOFT GROUND SHADOW
// --------------------------------------------

function GroundShadow({
  exercise,
}) {
  const texture =
    useMemo(() => {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = 256;
      canvas.height = 256;

      const ctx =
        canvas.getContext("2d");

      const gradient =
        ctx.createRadialGradient(
          128,
          128,
          0,
          128,
          128,
          128
        );

      gradient.addColorStop(
        0,
        "rgba(0, 0, 0, 0.5)"
      );

      gradient.addColorStop(
        0.4,
        "rgba(0, 0, 0, 0.3)"
      );

      gradient.addColorStop(
        0.75,
        "rgba(0, 0, 0, 0.1)"
      );

      gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.fillStyle =
        gradient;

      ctx.fillRect(
        0,
        0,
        256,
        256
      );

      const shadowTexture =
        new THREE.CanvasTexture(
          canvas
        );

      shadowTexture.needsUpdate =
        true;

      return shadowTexture;
    }, []);

  return (
    <mesh
      position={[
        exercise.shadowX,
        exercise.shadowY,
        exercise.shadowZ,
      ]}
      rotation={[
        -Math.PI / 2,
        0,
        0,
      ]}
      scale={[
        exercise.shadowWidth,
        exercise.shadowDepth,
        1,
      ]}
    >
      <planeGeometry
        args={[1, 1]}
      />

      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.7}
        depthWrite={false}
        side={
          THREE.DoubleSide
        }
      />
    </mesh>
  );
}


// --------------------------------------------
// INDIVIDUAL EXERCISE
// --------------------------------------------

function CarouselExercise({
  exercise,
  xPosition,
  zPosition,
  positionScale,
}) {
  const group =
    useRef();

  const targetScale =
    exercise.scale *
    positionScale;

  useFrame((_, delta) => {
    if (!group.current) {
      return;
    }

    group.current.position.x =
      THREE.MathUtils.damp(
        group.current.position.x,
        xPosition,
        7,
        delta
      );

    group.current.position.z =
      THREE.MathUtils.damp(
        group.current.position.z,
        zPosition,
        7,
        delta
      );

    const newScale =
      THREE.MathUtils.damp(
        group.current.scale.x,
        targetScale,
        7,
        delta
      );

    group.current.scale.setScalar(
      newScale
    );
  });

  return (
    <group
      ref={group}
      position={[
        0,
        exercise.y,
        0,
      ]}
      scale={
        exercise.scale
      }
      rotation={[
        exercise.rotationX ??
          0,
        exercise.rotationY ??
          0,
        exercise.rotationZ ??
          0,
      ]}
    >
      <Exercise
        url={exercise.url}
      />

      <GroundShadow
        exercise={exercise}
      />
    </group>
  );
}


// --------------------------------------------
// CAROUSEL
// --------------------------------------------

export default function ExerciseCarousel({
  activeIndex,
}) {
  return (
    <group
      position={[
        0,
        -5.2,
        70,
      ]}
      rotation={[
        0,
        Math.PI,
        0,
      ]}
    >
      <object3D
        name="CarouselPortalEntrance"
        position={[
          0,
          5.2,
          0,
        ]}
      />

      {exercises.map(
        (
          exercise,
          index
        ) => {
          let offset =
            index -
            activeIndex;

          const half =
            exercises.length /
            2;

          if (
            offset > half
          ) {
            offset -=
              exercises.length;
          }

          if (
            offset < -half
          ) {
            offset +=
              exercises.length;
          }

          const isActive =
            offset === 0;

          const isNeighbour =
            Math.abs(
              offset
            ) === 1;

          const isOpposite =
            Math.abs(
              offset
            ) === 2;

          const xPosition =
            isOpposite
              ? 0
              : offset *
                3.2;

          const zPosition =
            isActive
              ? 0
              : isNeighbour
                ? -0.75
                : -2;

          const positionScale =
            isActive
              ? 1
              : isNeighbour
                ? 0.65
                : 0.4;

          return (
            <CarouselExercise
              key={
                exercise.id
              }
              exercise={
                exercise
              }
              xPosition={
                xPosition
              }
              zPosition={
                zPosition
              }
              positionScale={
                positionScale
              }
            />
          );
        }
      )}
    </group>
  );
}

export { exercises };