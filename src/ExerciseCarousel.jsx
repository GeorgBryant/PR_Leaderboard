import {
  useMemo,
  useRef,
  useLayoutEffect,
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



// Lightweight instanced low-poly smoke. Particles stay behind as the rocket rises.
function LaunchSmoke({ flight, scaleRef, verticalOffset = -0.9 }) {
  const mesh = useRef();
  const clock = useRef(0);
  const cursor = useRef(0);
  const particles = useRef(Array.from({ length: 180 }, () => ({ age: 99, life: 1, x: 0, y: 0, z: 0, vx: 0, vz: 0, size: 1 })));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, delta) => {
    if (!mesh.current || !flight.current) return;
    clock.current += delta;
    // Continuous emission; fewer particles as the mannequin reaches altitude.
    const height = flight.current.position.y * (scaleRef.current?.scale.x ?? 1);
    const count = height < 35 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const item = particles.current[cursor.current++ % particles.current.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 1.8;
      item.age = 0;
      item.life = 0.9 + Math.random() * 1.4;
      item.x = (Math.random() - 0.5) * 0.45;
      item.y = flight.current.position.y + verticalOffset;
      item.z = (Math.random() - 0.5) * 0.45;
      item.vx = Math.cos(angle) * speed;
      item.vz = Math.sin(angle) * speed;
      item.size = 0.22 + Math.random() * 0.5;
    }
    particles.current.forEach((item, index) => {
      item.age += delta;
      if (item.age < item.life) {
        item.x += item.vx * delta;
        item.z += item.vz * delta;
        item.y -= 0.7 * delta;
        const fade = Math.max(0.001, 1 - item.age / item.life);
        dummy.position.set(item.x, item.y, item.z);
        dummy.scale.setScalar(item.size * (1 + item.age * 1.7) * fade);
      } else {
        dummy.position.set(0, -10000, 0);
        dummy.scale.setScalar(0.001);
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[null, null, 180]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#e3c6df" transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
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
  isActive,
  launching,
}) {
  const group = useRef();
  const flight = useRef();
  const launchClock = useRef(0);

  const targetScale =
    exercise.scale *
    positionScale;

  // Reset the launched model synchronously when returning to the carousel.
  // The smoke component unmounts on the same render.
  useLayoutEffect(() => {
    if (!launching) {
      launchClock.current = 0;
      if (flight.current) flight.current.position.y = 0;
    }
  }, [launching]);


  useFrame((_, delta) => {
    if (!group.current) {
      return;
    }

    group.current.position.x = launching ? 0 :
      THREE.MathUtils.damp(
        group.current.position.x,
        xPosition,
        7,
        delta
      );

    group.current.position.z = launching ? 0 :
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

    group.current.scale.setScalar(launching ? exercise.scale : newScale);

    if (flight.current) {
      if (launching) launchClock.current += delta;
      else launchClock.current = 0;
      const t = THREE.MathUtils.clamp(launchClock.current / 4.2, 0, 1);
      // Gentle lift, then rocket acceleration.
      const rise = 65 * t * t * t;
      flight.current.position.y = rise / Math.max(group.current.scale.x, 0.01);
    }
  });

  return (
    <group
      ref={group}
      position={[xPosition, exercise.y, zPosition]}
      scale={targetScale}
    >
      <group ref={flight}>
        {/* Target offset is in WORLD units, not multiplied by model scale.
            Camera never follows an animated bone or model pivot. */}
        <object3D name={launching ? "LaunchCameraTarget" : undefined}
          position={[0, 1.8 / exercise.scale, 0]} />
        <group rotation={[exercise.rotationX ?? 0, exercise.rotationY ?? 0, exercise.rotationZ ?? 0]}>
      <object3D
        name={
          isActive
            ? "ActiveExerciseTarget"
            : undefined
        }
        position={[0, 0, 0]}
      />

      <Exercise
        url={exercise.url}
      />

        </group>
      </group>
      {!launching && <GroundShadow exercise={exercise} />}
      {launching && <LaunchSmoke flight={flight} scaleRef={group} 
      verticalOffset={
        exercise.id === "deadlift" ? -0.3 : -0.9 } />}
    </group>
  );
}


// --------------------------------------------
// CAROUSEL
// --------------------------------------------

export default function ExerciseCarousel({
  activeIndex,
  mode = "home",
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

          const launching = isActive &&
            (mode === "enteringLeaderboard" || mode === "leaderboard");

          return (
            <CarouselExercise
              key={`${exercise.id}-${launching ? "flight" : "rest"}`}
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
              isActive={
                isActive
              }
              launching={launching}
            />
          );
        }
      )}
    </group>
  );
}

export { exercises };