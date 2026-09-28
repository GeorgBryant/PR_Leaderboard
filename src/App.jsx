import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { supabase } from "./supabase";

import HomeUI from "./HomeUI";
import LoginModal from "./LoginModal";
import ChangePassword from "./ChangePassword";
import "./HomeUI.css";
import CameraRig from "./CameraRig";
import Gym from "./Gym";
import Dancer from "./Dancer";
import BeachBackdrop from "./BeachBackdrop";
import ExerciseCarousel, { exercises } from "./ExerciseCarousel";
import "./ExerciseCarousel.css";
import MissionConsole from "./MissionConsole";
import "./MissionConsole.css";
import SpaceEnvironment from "./SpaceEnvironment";
import "./SpaceEnvironment.css";


export default function App() {
  const [screen, setScreen] = useState("home");
  const [loginOpen, setLoginOpen] = useState(false);
  const accountRef = useRef(null);
  useEffect(() => {
    if (!loginOpen) return;
    function handleOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setLoginOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setLoginOpen(false);
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loginOpen]);
  const [loggedInProfile, setLoggedInProfile] = useState(null);
  // Temporary guest entries survive exercise navigation but not a page refresh.
  const [guestRecords, setGuestRecords] = useState({});

async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed:", error);
    return;
  }

  setLoggedInProfile(null);
  setLoginOpen(false);
}


  useEffect(() => {
  let active = true;

  async function restoreSession() {
    const { data: { user } } =
      await supabase.auth.getUser();

    if (!user || !active) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile && active) {
      setLoggedInProfile({
        id: profile.id,
        name: profile.username,
        mustChangePassword:
          profile.must_change_password,
      });
    }
  }

  restoreSession();

  return () => {
    active = false;
  };
}, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [spaceVisible, setSpaceVisible] = useState(false);
  const [orbitStart, setOrbitStart] = useState(null);
  const launchAudio = useRef(null);
  const glitchAudio = useRef(null);
  const launchStarted = useRef(null);

  // Keep the launch sound tied to the 4.2-second physical ascent.
  useEffect(() => {
    if (screen !== "enteringLeaderboard") {
      launchStarted.current = null;
      if (launchAudio.current) {
        launchAudio.current.pause();
        launchAudio.current.currentTime = 0;
      }
      return;
    }
    const audio = launchAudio.current;
    if (!audio) return;
    launchStarted.current = performance.now();
    audio.currentTime = 0;
    audio.volume = 0.12;
    audio.play().catch(() => {});
    let frame;
    const update = () => {
      const t = (performance.now() - launchStarted.current) / 1000;
      const ascent = Math.min(t / 4.2, 1);
      // Flight position rises cubically in ExerciseCarousel.jsx.
      const distance = 65 * ascent ** 3;
      audio.volume = Math.max(0, Math.min(1, 0.72 / (1 + (distance / 17) ** 2)));
      if (t < 4.2) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [screen === "enteringLeaderboard"]);

  useEffect(() => {
    if (screen !== "leaderboard" || !glitchAudio.current) return;
    const audio = glitchAudio.current;
    audio.currentTime = 0;
    audio.volume = 0.38;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, [screen === "leaderboard"]);
  useEffect(() => {
    if (screen === "leaderboard") {
      setOrbitStart(Date.now());
      setSpaceVisible(true);
      return;
    }
    if (screen !== "enteringLeaderboard") {
      setOrbitStart(null);
      setSpaceVisible(false);
      return;
    }
    // Begin crossfade late in the ascent, before the leaderboard arrives.
    const id = window.setTimeout(() => setSpaceVisible(true), 2650);
    return () => window.clearTimeout(id);
  }, [screen]);
  function previousExercise() { setActiveIndex(current => (current - 1 + exercises.length) % exercises.length); }
  function nextExercise() { setActiveIndex(current => (current + 1) % exercises.length); }
  function toggleAccount() { setLoginOpen((open) => !open); }
  return (
    <main className="app">
      <audio ref={launchAudio} src="/audio/rocket-launch.wav" preload="auto" />
      <audio ref={glitchAudio} src="/audio/ui-glitch.wav" preload="auto" />
      <Canvas camera={{ position: [0, -2, 52], fov: 38, far: 5000 }}>
        <BeachBackdrop />
        <ambientLight intensity={0.35} color="#6f5b9e" />
        <directionalLight position={[0, 20, -40]} intensity={2.5} color="#ffffff" />
        <pointLight position={[0, 3, 1]} intensity={20} distance={12} decay={2} color="#f4e8ff" />
        <CameraRig mode={screen} onTransitionComplete={setScreen} />
        <Gym />
        <Dancer mode={screen} />
        {screen !== "leaderboard" && <ExerciseCarousel activeIndex={activeIndex} mode={screen} />}
      </Canvas>
      {(screen === "enteringLeaderboard" || screen === "leaderboard") && (
        <div className={`space-transition ${spaceVisible ? "space-transition--visible" : ""}`}>
          <SpaceEnvironment exercise={screen === "leaderboard" ? exercises[activeIndex] : null} orbitStart={orbitStart} />
        </div>
      )}
      {screen === "home" && <HomeUI onStart={() => setScreen("entering")} />}
      {screen === "carousel" && <>
        <button className="exercise-select__back" onClick={() => setScreen("exiting")}>BACK</button>
        <div className="exercise-carousel__controls">
          <button onClick={previousExercise} aria-label="Previous exercise">←</button>
          <button className="exercise-carousel__select" onClick={() => setScreen("enteringLeaderboard")}>
            <span className="exercise-carousel__name">{exercises[activeIndex].name}</span>
            <span className="exercise-carousel__select-label">LAUNCH</span>
          </button>
          <button onClick={nextExercise} aria-label="Next exercise">→</button>
        </div>
      </>}
      {screen === "leaderboard" && (
        <MissionConsole
          exercise={exercises[activeIndex]}
          orbitStart={orbitStart}
          loggedInProfile={loggedInProfile}
          guestRecords={guestRecords}
          onGuestRecord={(exerciseId, record) => setGuestRecords((previous) => ({ ...previous, [exerciseId]: record }))}
          onBack={() => setScreen("carousel")}
        />
      )}
      <div className="pr-account" ref={accountRef}>
        <button type="button" className="pr-account__trigger" aria-expanded={loginOpen}
          aria-controls="pr-account-dropdown" onClick={toggleAccount}>
          {loggedInProfile ? loggedInProfile.name : "LOGIN"} <span aria-hidden="true">{loginOpen ? "▴" : "▾"}</span>
        </button>
        {loginOpen && <div id="pr-account-dropdown" className="pr-account__menu">
          {loggedInProfile ? (
<button type="button" onClick={handleLogout}>
  LOG OUT
</button>
          ) : (
            <LoginModal onClose={() => setLoginOpen(false)}
              onLogin={(profile) => { setLoggedInProfile(profile); setLoginOpen(false); }} />
          )}
        </div>}
      </div>

{loggedInProfile?.mustChangePassword && (
  <ChangePassword
    onLogout={handleLogout}
    onComplete={(profile) => {
      setLoggedInProfile({
        id: profile.id,
        name: profile.username,
        mustChangePassword: false,
      });
    }}
  />
)}

    </main>
  );
}
