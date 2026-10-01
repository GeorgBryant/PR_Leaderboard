import { Suspense, useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getOrbitPose } from "./orbitFlight";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A fixed seed keeps the starfield stable across renders and remounts.
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Independent 3D environment: not part of the Blender GLB.
// This can later be replaced by a Blender-authored asteroid/planet scene.
function Starfield() {
  const stars = useRef();
  const geometry = useMemo(() => {
    const random = seededRandom(2400);
    const count = 2400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = ["#b4bfe8", "#e3b3e6", "#fff1d7", "#a2aee7"];
    for (let i = 0; i < count; i++) {
      const z = 2 * random() - 1;
      const a = random() * Math.PI * 2;
      const r = 75 + random() * 95;
      const h = Math.sqrt(1 - z * z);
      positions.set([r * h * Math.cos(a), r * z, r * h * Math.sin(a)], i * 3);
      const c = new THREE.Color(palette[Math.floor(random() * palette.length)]);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  useFrame((state) => {
    if (stars.current) stars.current.rotation.y = state.clock.elapsedTime * 0.002;
  });
  return (
    <points ref={stars} geometry={geometry}>
      <pointsMaterial size={0.26} vertexColors transparent opacity={0.9}
        sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Nebula() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec3 vDirection;
      uniform float uTime;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 p = normalize(vDirection);
        vec3 q = p * 3.8;
        q += vec3(uTime * 0.003, 0.0, 0.0);
        float n = noise(q) * 0.56 + noise(q * 2.2) * 0.30
                  + noise(q * 5.1) * 0.14;
        float band = exp(-pow((p.y + 0.11 * sin(p.x * 5.0)) * 2.1, 2.0));
        float nebula = smoothstep(0.32, 0.70, n) * band;
        vec3 deep = vec3(0.008, 0.012, 0.035);
        vec3 purple = vec3(0.20, 0.065, 0.31);
        vec3 blue = vec3(0.065, 0.13, 0.32);
        vec3 col = mix(deep, mix(purple, blue, smoothstep(-0.4, 0.6, p.x)),
                       nebula * 0.83);
        col += vec3(0.07, 0.045, 0.13) * pow(nebula, 3.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }), []);
  const materialRef = useRef(material);
  useFrame((state) => { materialRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return <mesh material={material} scale={180}>
    <sphereGeometry args={[1, 64, 40]} />
  </mesh>;
}

// The orbital flyer needs its OWN skinned scene instance. A GLTF scene
// cannot be attached to two canvases simultaneously: the monitor and
// orbital flyer were competing for the same cached Object3D.
function IndependentOrbitalExercise({ url }) {
  const { scene, animations } = useGLTF(url);
  const instance = useMemo(() => clone(scene), [scene]);
  const { actions } = useAnimations(animations, instance);

  useEffect(() => {
    const clips = Object.values(actions);
    clips.forEach((action) => action?.reset().play());
    return () => clips.forEach((action) => action?.stop());
  }, [actions]);

  return <primitive object={instance} />;
}

// The flyer is behind the DOM leaderboard because it lives in the space canvas.
// One extra animated model; no duplicate of the original launch mannequin.
function OrbitFlyer({ exercise, orbitStart }) {
  const rig = useRef();
  const model = useRef();
  const fitted = useRef(false);
  const plume = useRef();
  const boostAudio = useRef(null);
  const boostGain = useRef(0);
  useEffect(() => {
    const audio = new Audio("/audio/rocket-boost.wav");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    boostAudio.current = audio;
    // Start muted; movement and actual screen visibility govern the volume.
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.src = "";
      boostAudio.current = null;
    };
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef(Array.from({ length: 64 }, () => ({
    age: 99, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1
  })));
  const cursor = useRef(0);
  const emission = useRef(0);
  useFrame((state, delta) => {
    if (!rig.current || !plume.current) return;
    const dt = Math.min(delta, 0.05);
    // Exercise GLBs have different origins and scales. Fit the *actual loaded
    // geometry* once, rather than guessing a large multiplier per exercise.
    if (!fitted.current && model.current) {
      // Bounds measured in the model's neutral pose (before the orbital
      // translation/rotation), avoiding a moving world-space bounding box.
      const savedPosition = rig.current.position.clone();
      const savedQuaternion = rig.current.quaternion.clone();
      rig.current.position.set(0, 0, 0);
      rig.current.quaternion.identity();
      model.current.position.set(0, 0, 0);
      model.current.scale.setScalar(1);
      rig.current.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model.current);
      if (!bounds.isEmpty()) {
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const longest = Math.max(size.x, size.y, size.z);
        if (longest > 0.001 && Number.isFinite(longest)) {
          const fit = 5.8 / longest;
          model.current.scale.setScalar(fit);
          model.current.position.copy(center).multiplyScalar(-fit);
          fitted.current = true;
        }
      }
      rig.current.position.copy(savedPosition);
      rig.current.quaternion.copy(savedQuaternion);
    }
    const t = (Date.now() - orbitStart) / 1000;
    const p = getOrbitPose(t, 5);
    rig.current.position.set(p.x, p.y, p.z);
    // This is the background scene's camera, NOT the Mission Control feed.
    // Only audible when the flyer is actually inside the viewport.
    const audio = boostAudio.current;
    if (audio) {
      const visible = t >= 5 && state.camera.position.distanceTo(rig.current.position) > 0 &&
        new THREE.Frustum().setFromProjectionMatrix(
          new THREE.Matrix4().multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse)
        ).intersectsSphere(new THREE.Sphere(rig.current.position, 2.9));
      const distance = state.camera.position.distanceTo(rig.current.position);
      const target = visible ? 0.48 / (1 + (distance / 20) ** 2) : 0;
      boostGain.current = THREE.MathUtils.damp(boostGain.current, target, 3.5, delta);
      audio.volume = THREE.MathUtils.clamp(boostGain.current, 0, 1);
      if (audio.paused && audio.volume > 0.002) audio.play().catch(() => {});
    }
    // Aim the mannequin's local UP axis (headward) along its velocity.
    // This also flips it naturally when the flight path reverses.
    const direction = new THREE.Vector3(p.dx, p.dy, p.dz).normalize();
    const targetRotation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );
    rig.current.quaternion.slerp(targetRotation, 1 - Math.exp(-dt * 3.2));
    const speed = Math.hypot(p.dx, p.dy, p.dz);
    const trail = direction.clone().negate();
    emission.current += dt * (p.burst ? 16 : 7);
    while (emission.current >= 1) {
      emission.current--;
      const puff = particles.current[cursor.current++ % particles.current.length];
      puff.age = 0; puff.life = 1.4 + Math.random() * 1.0;
      // Emit behind the feet, relative to the actual direction of travel.
      puff.x = p.x + trail.x * 2.7;
      puff.y = p.y + trail.y * 2.7;
      puff.z = p.z + trail.z * 2.7;
      puff.vx = trail.x * (1.4 + speed * 0.12) + (Math.random()-.5)*0.4;
      puff.vy = trail.y * (1.4 + speed * 0.12) + (Math.random()-.5)*0.4;
      puff.vz = trail.z * (1.4 + speed * 0.12) + (Math.random()-.5)*0.4;
      puff.size = p.burst ? 0.58 : 0.38;
    }
    particles.current.forEach((puff, i) => {
      puff.age += dt;
      if (puff.age < puff.life) {
        puff.x += puff.vx*dt; puff.y += puff.vy*dt; puff.z += puff.vz*dt;
        dummy.position.set(puff.x,puff.y,puff.z);
        dummy.scale.setScalar(puff.size*(1+puff.age)*Math.max(0.01,1-puff.age/puff.life));
      } else { dummy.position.set(0,-10000,0); dummy.scale.setScalar(0.001); }
      dummy.updateMatrix();
      plume.current.setMatrixAt(i,dummy.matrix);
    });
    plume.current.instanceMatrix.needsUpdate = true;
  });
  return <>
    <group ref={rig}>
      <group ref={model}>
        <group scale={exercise.scale}
          rotation={[exercise.rotationX || 0, exercise.rotationY || 0, exercise.rotationZ || 0]}>
          <IndependentOrbitalExercise url={exercise.url} />
        </group>
      </group>
    </group>
    <instancedMesh ref={plume} args={[null,null,64]} frustumCulled={false}>
      <icosahedronGeometry args={[1,0]}/>
      <meshBasicMaterial color="#e3c6df" transparent opacity={0.7} depthWrite={false}/>
    </instancedMesh>
  </>;
}

export default function SpaceEnvironment({ exercise, orbitStart }) {
  return (
    <Canvas camera={{ position: [0, 0, 0], fov: 65, near: 0.1, far: 500 }}
      gl={{ alpha: false, antialias: true }} dpr={[1, 1.5]}>
      <Nebula />
      <Starfield />
      {exercise && orbitStart && <Suspense fallback={null}><OrbitFlyer exercise={exercise} orbitStart={orbitStart} /></Suspense>}
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 8, 10]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-30, 25, 20]} color="#d9b9ff" intensity={4.0} />
    </Canvas>
  );
}
