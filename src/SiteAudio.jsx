import { useRef } from "react";

export default function SiteAudio() {
  const audioRef = useRef(null);

  function startMusic() {
    if (!audioRef.current) return;

    audioRef.current.volume = 0.6;
    audioRef.current.play();
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/pr-theme.wav"
        loop
      />

      <button
        onClick={startMusic}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 100,
        }}
      >
        PLAY MUSIC
      </button>
    </>
  );
}