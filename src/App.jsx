import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Gym from "./Gym";
import CameraRig from "./CameraRig";
import Dancer from "./Dancer";
import Backdrop from "./Backdrop";


export default function App() {
  return (
    <Canvas
      camera={{
        position: [0, 2.7, 8.5],
        fov: 38,
      }}
    >
      <color attach="background" args={["#111111"]} />

      <ambientLight intensity={0.8} />

      <directionalLight
        position={[0, 6, 4]}
        intensity={2.5}
      />

      <directionalLight
        position={[-4, 3, 2]}
        intensity={1.2}
      />

      <directionalLight
        position={[4, 3, 2]}
        intensity={1.2}
      />

      <Gym />

        <Dancer />
        
        <Backdrop />

      <OrbitControls
  target={[0, 0, -15]}
  enablePan={false}
  enableZoom={true}
/>

      {/*<CameraRig /> */}

    </Canvas>
  );

  
}