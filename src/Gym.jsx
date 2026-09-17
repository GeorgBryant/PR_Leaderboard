import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  createWallMaterial,
} from "./shaders/createWallMaterial";

const MIRROR_WIDTH = 8.1717;
const MIRROR_HEIGHT = 3.2687;

export default function Gym() {
  const { scene } =
    useGLTF("/models/gym.glb");

  const {
    gl,
    scene: threeScene,
  } = useThree();

  const portal = useRef();

  const mirrorHaze =
    useRef();


  // --------------------------------------------
  // WALL MATERIAL
  // --------------------------------------------

  const wallMaterial =
    useMemo(() => {
      return createWallMaterial();
    }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (
        child.name === "BackWall" ||
        child.name === "LeftWall" ||
        child.name === "RightWall"
      ) {
        child.material =
          wallMaterial;
      }
    });

    return () => {
      wallMaterial.dispose();
    };
  }, [
    scene,
    wallMaterial,
  ]);


  // --------------------------------------------
  // MIRROR PLACEHOLDER
  // --------------------------------------------

  const mirrorPlaceholder =
    useMemo(() => {
      return scene.getObjectByName(
        "Mirror"
      );
    }, [scene]);

  useEffect(() => {
    if (mirrorPlaceholder) {
      mirrorPlaceholder.visible =
        false;
    }
  }, [mirrorPlaceholder]);


  // --------------------------------------------
  // PORTAL RENDER TARGET
  // --------------------------------------------

  const renderTarget =
    useMemo(() => {
      return new THREE.WebGLRenderTarget(
        1024,
        1024
      );
    }, []);

  useEffect(() => {
    return () => {
      renderTarget.dispose();
    };
  }, [renderTarget]);


  // --------------------------------------------
  // PORTAL CAMERA
  // --------------------------------------------

  const portalCamera =
    useMemo(() => {
      return new THREE.PerspectiveCamera(
        38,
        MIRROR_WIDTH /
          MIRROR_HEIGHT,
        0.1,
        5000
      );
    }, []);


  // --------------------------------------------
  // TEMPORARY VECTORS
  // --------------------------------------------

  const mirrorWorldPosition =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const entranceWorldPosition =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const cameraOffset =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const cameraDirection =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const portalLookTarget =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const portalBottomLeft =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const portalBottomRight =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const portalTopLeft =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const va =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const vb =
    useMemo(
      () => new THREE.Vector3(),
      []
    );

  const vc =
    useMemo(
      () => new THREE.Vector3(),
      []
    );


  // --------------------------------------------
  // FRAME UPDATE
  // --------------------------------------------

  useFrame((state) => {
    wallMaterial.uniforms.time.value =
      state.clock.getElapsedTime();

    if (
      !portal.current ||
      !mirrorPlaceholder
    ) {
      return;
    }

    const entrance =
      threeScene.getObjectByName(
        "CarouselPortalEntrance"
      );

    if (!entrance) {
      return;
    }

    const mainCamera =
      state.camera;


    // ------------------------------------------
    // UPDATE WORLD MATRICES
    // ------------------------------------------

    mirrorPlaceholder.updateWorldMatrix(
      true,
      false
    );

    entrance.updateWorldMatrix(
      true,
      false
    );

    mainCamera.updateMatrixWorld();


    // ------------------------------------------
    // GET PORTAL POSITIONS
    // ------------------------------------------

    mirrorPlaceholder.getWorldPosition(
      mirrorWorldPosition
    );

    entrance.getWorldPosition(
      entranceWorldPosition
    );


    // ------------------------------------------
    // MIRROR HAZE
    //
    // The mirror keeps its normal haze while
    // viewed from a distance, then gradually
    // becomes clear as the camera approaches.
    // It should be essentially clear by the
    // time CameraRig performs the crossing.
    // ------------------------------------------

    if (mirrorHaze.current) {
      const distanceToMirror =
        mainCamera.position.distanceTo(
          mirrorWorldPosition
        );

      const hazeProgress =
        THREE.MathUtils.smoothstep(
          distanceToMirror,
          0.5,
          10
        );

      mirrorHaze.current.opacity =
        0.28 *
        hazeProgress;
    }


    // ------------------------------------------
    // MAP MAIN CAMERA TO PORTAL CAMERA
    // ------------------------------------------

    cameraOffset
      .copy(
        mainCamera.position
      )
      .sub(
        mirrorWorldPosition
      );

    portalCamera.position.set(
      entranceWorldPosition.x -
        cameraOffset.x,

      entranceWorldPosition.y +
        cameraOffset.y,

      entranceWorldPosition.z -
        cameraOffset.z
    );


    // ------------------------------------------
    // MAP CAMERA DIRECTION
    // ------------------------------------------

    mainCamera.getWorldDirection(
      cameraDirection
    );

    cameraDirection.x *= -1;
    cameraDirection.z *= -1;

    portalLookTarget
      .copy(
        portalCamera.position
      )
      .add(
        cameraDirection
      );

    portalCamera.up.copy(
      mainCamera.up
    );

    portalCamera.lookAt(
      portalLookTarget
    );


    // ------------------------------------------
    // OFF-AXIS PROJECTION
    //
    // Makes the portal behave like an opening
    // rather than a flat screen.
    // ------------------------------------------

    const near = 0.1;
    const far = 5000;

    portalBottomLeft.set(
      entranceWorldPosition.x -
        MIRROR_WIDTH / 2,

      entranceWorldPosition.y -
        MIRROR_HEIGHT / 2,

      entranceWorldPosition.z
    );

    portalBottomRight.set(
      entranceWorldPosition.x +
        MIRROR_WIDTH / 2,

      entranceWorldPosition.y -
        MIRROR_HEIGHT / 2,

      entranceWorldPosition.z
    );

    portalTopLeft.set(
      entranceWorldPosition.x -
        MIRROR_WIDTH / 2,

      entranceWorldPosition.y +
        MIRROR_HEIGHT / 2,

      entranceWorldPosition.z
    );

    va
      .copy(
        portalBottomLeft
      )
      .sub(
        portalCamera.position
      );

    vb
      .copy(
        portalBottomRight
      )
      .sub(
        portalCamera.position
      );

    vc
      .copy(
        portalTopLeft
      )
      .sub(
        portalCamera.position
      );

    const distance =
      entranceWorldPosition.z -
      portalCamera.position.z;

    if (
      Math.abs(distance) <
      0.001
    ) {
      return;
    }

    const left =
      (near * va.x) /
      distance;

    const right =
      (near * vb.x) /
      distance;

    const bottom =
      (near * va.y) /
      distance;

    const top =
      (near * vc.y) /
      distance;

    portalCamera.projectionMatrix
      .makePerspective(
        left,
        right,
        top,
        bottom,
        near,
        far
      );

    portalCamera
      .projectionMatrixInverse
      .copy(
        portalCamera.projectionMatrix
      )
      .invert();

    portalCamera.updateMatrixWorld();


    // ------------------------------------------
    // RENDER PORTAL
    // ------------------------------------------

    portal.current.visible =
      false;

    gl.setRenderTarget(
      renderTarget
    );

    gl.clear();

    gl.render(
      threeScene,
      portalCamera
    );

    gl.setRenderTarget(null);

    portal.current.visible =
      true;
  });


  // --------------------------------------------
  // GYM
  // --------------------------------------------

return (
  <group
    rotation={[
      0,
      Math.PI,
      0,
    ]}
    position={[
      0,
      -4.5,
      20,
    ]}
  >
    <primitive
      object={scene}
    />

    {/* TEMP LAMP LIGHT */}

{/* Hanging lamp */}
<spotLight
  position={[0, 5, 0]}
  color="#ffd6a0"
  intensity={100}
  distance={15}
  angle={Math.PI / 2.5}
  penumbra={0.7}
  decay={2}
/>

{/* Very subtle interior fill */}
<pointLight
  position={[0, 2, 1]}
  color="#ffd6a0"
  intensity={10}
  distance={8}
  decay={2}
/>

    {mirrorPlaceholder && (
        <>

          {/* PORTAL SURFACE */}

          <mesh
            ref={portal}
            position={[
              mirrorPlaceholder
                .position.x,

              mirrorPlaceholder
                .position.y,

              mirrorPlaceholder
                .position.z -
                0.05,
            ]}
            rotation={[
              0,
              Math.PI,
              0,
            ]}
          >
            <planeGeometry
              args={[
                MIRROR_WIDTH,
                MIRROR_HEIGHT,
              ]}
            />

            <meshBasicMaterial
              map={
                renderTarget.texture
              }
              side={
                THREE.DoubleSide
              }
            />
          </mesh>


          {/* MIRROR FOG / HAZE */}

          <mesh
            position={[
              mirrorPlaceholder
                .position.x,

              mirrorPlaceholder
                .position.y,

              mirrorPlaceholder
                .position.z -
                0.06,
            ]}
            rotation={[
              0,
              Math.PI,
              0,
            ]}
          >
            <planeGeometry
              args={[
                MIRROR_WIDTH,
                MIRROR_HEIGHT,
              ]}
            />

            <meshBasicMaterial
              ref={mirrorHaze}
              color="#d8d8d8"
              transparent
              opacity={0.28}
              depthWrite={false}
            />
          </mesh>

        </>
      )}
    </group>
  );
}