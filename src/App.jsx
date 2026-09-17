import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import SiteAudio from "./SiteAudio";
import CameraRig from "./CameraRig";
import Gym from "./Gym";
import Dancer from "./Dancer";
import BeachBackdrop from "./BeachBackdrop";
import ExerciseCarousel, {
  exercises,
} from "./ExerciseCarousel";

import "./ExerciseCarousel.css";

export default function App() {
  const [screen, setScreen] =
    useState("home");

  const [activeIndex, setActiveIndex] =
    useState(0);

  function previousExercise() {
    setActiveIndex(
      (current) =>
        (current - 1 + exercises.length) %
        exercises.length
    );
  }

  function nextExercise() {
    setActiveIndex(
      (current) =>
        (current + 1) %
        exercises.length
    );
  }

  return (
    <main className="app">
      <SiteAudio />

      <Canvas
        camera={{
          position: [0, -2, 52],
          fov: 38,
          far: 5000,
        }}
      >
        <BeachBackdrop />

        {/* Temporary development lighting */}

        <ambientLight
          intensity={0.35}
          color="#6f5b9e"
        />

        <directionalLight
          position={[0, 20, -40]}
          intensity={2.5}
          color="#ffffff"
        />

        <pointLight
          position={[0, 3, 1]}
          intensity={20}
          distance={12}
          decay={2}
          color="#f4e8ff"
        />

        {/* ----------------------------------
            CAMERA
        ---------------------------------- */}

        <CameraRig
          mode={screen}
          onTransitionComplete={(destination) =>
            setScreen(destination)
          }
        />

        {/* ----------------------------------
            HOME SCENE
        ---------------------------------- */}

        <Gym />

        <Dancer
          mode={screen}
        />

        {/* Exercise carousel stays
            permanently in the world */}

        <ExerciseCarousel
          activeIndex={activeIndex}
        />
      </Canvas>

      {/* ----------------------------------
          TEMPORARY EXERCISE SELECTOR
      ---------------------------------- */}

      {screen === "home" && (
        <button
          onClick={() =>
            setScreen("entering")
          }
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 100,
          }}
        >
          TEMP: EXERCISES
        </button>
      )}

      {/* ----------------------------------
          CAROUSEL UI
      ---------------------------------- */}

      {screen === "carousel" && (
        <>
          <button
            className="exercise-select__back"
            onClick={() =>
              setScreen("exiting")
            }
          >
            BACK
          </button>

          <div className="exercise-carousel__controls">
            <button
              onClick={previousExercise}
              aria-label="Previous exercise"
            >
              ←
            </button>

            <span>
              {exercises[activeIndex].name}
            </span>

            <button
              onClick={nextExercise}
              aria-label="Next exercise"
            >
              →
            </button>
          </div>
        </>
      )}
    </main>
  );
}