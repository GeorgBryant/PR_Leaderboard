import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Exercise from "./Exercise";
import { getOrbitPose } from "./orbitFlight";

// Independent, inexpensive orbital camera feed. No second camera into the
// main scene, and the original launch model is unmounted in leaderboard mode.
function ResidualThrust({ exercise }) {
  const mesh = useRef();
  const cursor = useRef(0);
  const accumulator = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef(Array.from({ length: 42 }, () => ({
    age: 99, life: 1, x: 0, y: 0, z: 0, vx: 0, vz: 0, size: 0.1
  })));
  // Emission height can be art-directed independently for each exercise.
  const offset = exercise.id === "deadlift" ? -0.3 : -0.9;
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const dt = Math.min(delta, 0.06);
    accumulator.current += dt * 8; // ~8 puffs/sec, not launch thrust.
    while (accumulator.current >= 1) {
      accumulator.current -= 1;
      const p = particles.current[cursor.current++ % particles.current.length];
      const angle = Math.random() * Math.PI * 2;
      p.age = 0;
      p.life = 1.6 + Math.random() * 1.2;
      p.x = (Math.random() - 0.5) * 0.18;
      p.y = offset;
      p.z = (Math.random() - 0.5) * 0.18;
      p.vx = Math.cos(angle) * 0.14;
      p.vz = Math.sin(angle) * 0.14;
      p.size = 0.07 + Math.random() * 0.11;
    }
    particles.current.forEach((p, i) => {
      p.age += dt;
      if (p.age < p.life) {
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.y -= 0.34 * dt;
        const fade = Math.max(0.001, 1 - p.age / p.life);
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(p.size * (1 + p.age * 0.65) * fade);
      } else {
        dummy.position.set(0, -10000, 0);
        dummy.scale.setScalar(0.001);
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[null, null, 42]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#e3c6df" transparent opacity={0.34} depthWrite={false} />
    </instancedMesh>
  );
}

function ExerciseFeed({ exercise, orbitStart }) {
  const rig = useRef();
  const model = useRef();
  const fitted = useRef(false);
  useFrame((state, delta) => {
    if (!rig.current || !model.current) return;
    // Fit the animated GLB itself, not its arbitrary export origin/scale.
    if (!fitted.current) {
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
          const fit = 2.9 / longest;
          model.current.scale.setScalar(fit);
          model.current.position.copy(center).multiplyScalar(-fit);
          fitted.current = true;
        }
      }
    }
    const t = orbitStart ? (Date.now() - orbitStart) / 1000 : 0;
    const p = getOrbitPose(t);
    const direction = new THREE.Vector3(p.dx, p.dy, p.dz).normalize();
    const target = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), direction
    );
    rig.current.quaternion.copy(target);
    // Camera and its UP vector rotate together with the payload.
    // The exercise is stable in frame even when reversing direction.
    const cameraOffset = new THREE.Vector3(0, 0, 7.2).applyQuaternion(target);
    state.camera.position.copy(cameraOffset);
    state.camera.up.set(0, 1, 0).applyQuaternion(target);
    state.camera.lookAt(0, 0, 0);
  });
  return (
    <group ref={rig}>
      <group ref={model}>
        <group scale={exercise.scale} rotation={[
          exercise.rotationX ?? 0, exercise.rotationY ?? 0, exercise.rotationZ ?? 0
        ]}>
          <Exercise url={exercise.url} />
        </group>
      </group>
      <ResidualThrust exercise={exercise} />
    </group>
  );
}

const exerciseKey = (id) => id === "press" ? "overhead_press" : id;
const displayWeight = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function MissionConsole({ exercise, onBack, orbitStart, loggedInProfile, guestRecords, onGuestRecord }) {
  const staticCanvas = useRef(null);
  const [signalReady, setSignalReady] = useState(false);
  const [metric, setMetric] = useState("raw");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [bodyweight, setBodyweight] = useState("");
  const [saving, setSaving] = useState(false);
  // The feed renders continuously underneath a short, procedural static overlay.
  // Only the overlay disappears: the orbit and mannequin never restart.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setSignalReady(true);
      return;
    }
    const canvas = staticCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const width = 160;
    const height = 100;
    canvas.width = width;
    canvas.height = height;
    const frame = ctx.createImageData(width, height);
    let frameTimer;
    let frameNumber = 0;
    const draw = () => {
      frameNumber++;
      const pixels = frame.data;
      const band = Math.floor(Math.random() * height);
      for (let y = 0; y < height; y++) {
        const stripe = Math.abs(y - band) < 4;
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const value = Math.floor(Math.random() * 215) + (stripe ? 40 : 0);
          pixels[index] = pixels[index + 1] = pixels[index + 2] = Math.min(255, value);
          pixels[index + 3] = 255;
        }
      }
      ctx.putImageData(frame, 0, 0);
      frameTimer = window.setTimeout(draw, 65);
    };
    draw();
    const readyTimer = window.setTimeout(() => setSignalReady(true), 1150);
    return () => {
      window.clearTimeout(frameTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  const key = exerciseKey(exercise.id);
  const memberReady = Boolean(loggedInProfile && !loggedInProfile.mustChangePassword);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("personal_records")
      .select("user_id, exercise, weight_kg, bodyweight_kg, profiles(username)")
      .eq("exercise", key);
    if (queryError) setError(queryError.message);
    else setRecords(data ?? []);
    setLoading(false);
  }, [key]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  useEffect(() => {
    const existing = memberReady
      ? records.find((record) => record.user_id === loggedInProfile.id)
      : guestRecords[key];
    if (existing) {
      setWeight(String(existing.weight_kg));
      setBodyweight(String(existing.bodyweight_kg));
    } else {
      setWeight("");
      setBodyweight("");
    }
  }, [key, formOpen, memberReady, loggedInProfile?.id, guestRecords]);

  const ranked = useMemo(() => {
    const members = records.map((record) => ({
      id: record.user_id,
      name: record.profiles?.username ?? "ATHLETE",
      raw: Number(record.weight_kg),
      bw: Number(record.weight_kg) / Number(record.bodyweight_kg),
      guest: false,
    }));
    // Guests preview their ranking locally; they never overwrite real members.
    if (!loggedInProfile && guestRecords[key]) {
      const guest = guestRecords[key];
      members.push({ id: "guest", name: "YOU / GUEST", raw: Number(guest.weight_kg),
        bw: Number(guest.weight_kg) / Number(guest.bodyweight_kg), guest: true });
    }
    return members.sort((a, b) => (metric === "raw" ? b.raw - a.raw : b.bw - a.bw)
      || b.raw - a.raw || a.name.localeCompare(b.name));
  }, [records, guestRecords, key, metric, loggedInProfile]);

  async function submitRecord(event) {
    event.preventDefault();
    setError("");
    const load = Number(weight);
    const mass = Number(bodyweight);
    if (!Number.isFinite(load) || !Number.isFinite(mass) || load <= 0 || load > 1000 || mass <= 0 || mass > 500) {
      setError("ENTER A VALID LIFT (UP TO 1000 KG) AND BODYWEIGHT (UP TO 500 KG).");
      return;
    }
    if (!memberReady) {
      if (loggedInProfile) { setError("CHANGE YOUR PASSWORD BEFORE SAVING RECORDS."); return; }
      onGuestRecord(key, { weight_kg: load, bodyweight_kg: mass });
      setFormOpen(false);
      return;
    }
    setSaving(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user || auth.user.id !== loggedInProfile.id) throw new Error("SESSION EXPIRED. PLEASE LOG IN AGAIN.");
      const { error: saveError } = await supabase.from("personal_records").upsert({
        user_id: auth.user.id, exercise: key, weight_kg: load, bodyweight_kg: mass,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,exercise" });
      if (saveError) throw saveError;
      await loadRecords();
      setFormOpen(false);
    } catch (saveError) { setError(saveError.message || "COULD NOT SAVE RECORD."); }
    finally { setSaving(false); }
  }
  return (
    <section className={`mission ${signalReady ? "mission--connected" : ""}`} aria-label={`${exercise.name} leaderboard`}>
      <button className="mission__back" onClick={onBack}>← BACK</button>
      <div className="mission__layout">
        <div className="mission__board">
          <header className="mission__board-header">
            <h1>{exercise.name}</h1>
          </header>

          <div className="mission__ranking">
            <div className="mission__ranking-header">
              <h2>LEADERBOARD</h2>
              <div className="mission__metric" role="group" aria-label="Ranking metric">
                <span className={metric === "raw" ? "is-active" : ""}>RAW</span>
                <button type="button" role="switch" aria-label="Bodyweight ranking"
                  aria-checked={metric === "bw"} className={`mission__switch ${metric === "bw" ? "is-bw" : ""}`}
                  onClick={() => setMetric(current => current === "raw" ? "bw" : "raw")}>
                  <span className="mission__switch-thumb" />
                </button>
                <span className={metric === "bw" ? "is-active" : ""}>BW</span>
              </div>
            </div>
            <div className="mission__columns"><span>RANK</span><span>RAT</span><span>{metric === "raw" ? "LOAD" : "RATIO"}</span></div>
            <div className="mission__records" aria-live="polite">
              {loading && <p className="mission__note">LOADING RECORDS...</p>}
              {!loading && ranked.length === 0 && <p className="mission__note">NO RECORDS YET</p>}
              {!loading && ranked.map((person, index) => (
                <div className={`mission__athlete ${person.guest ? "mission__athlete--guest" : ""}`} key={person.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{person.name}</strong>
                  <span>{metric === "raw" ? `${displayWeight(person.raw)} KG` : `${person.bw.toFixed(2)} ×`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mission__entry">
            {error && <p className="mission__error" role="alert">{error}</p>}
            {!loggedInProfile && guestRecords[key] && <p className="mission__note">GUEST PREVIEW — NOT SAVED</p>}
            {formOpen ? (
              <form className="mission__record-form" onSubmit={submitRecord}>
                <div className="mission__form-heading">
                  <strong>{memberReady ? "YOUR RECORD" : "GUEST PREVIEW"}</strong>
                  <button type="button" className="mission__cancel" onClick={() => setFormOpen(false)}>CANCEL</button>
                </div>
                <div className="mission__fields">
                  <label htmlFor="mission-load">LIFT / KG
                    <input id="mission-load" type="number" min="0.01" max="1000" step="any" required value={weight}
                      onChange={(event) => setWeight(event.target.value)} />
                  </label>
                  <label htmlFor="mission-bodyweight">BODYWEIGHT / KG
                    <input id="mission-bodyweight" type="number" min="0.01" max="500" step="any" required value={bodyweight}
                      onChange={(event) => setBodyweight(event.target.value)} />
                  </label>
                </div>
                <button className="mission__submit" type="submit" disabled={saving}>
                  {saving ? "SAVING..." : memberReady ? "SAVE RECORD" : "PREVIEW RANK"}<span>↗</span>
                </button>
              </form>
            ) : (
              <button className="mission__submit" onClick={() => setFormOpen(true)}
                disabled={Boolean(loggedInProfile?.mustChangePassword)}>
                ENTER PERSONAL RECORD <span>↗</span>
              </button>
            )}
          </div>
        </div>

        <aside className="mission__feed" aria-label="Exercise camera feed">
          <div className="mission__feed-top"><span>{exercise.name}</span><span className="mission__rec">● REC</span></div>
          <div className="mission__viewport">
            <Canvas camera={{ position: [0, 1.1, 5.5], fov: 38 }} gl={{ alpha: true, antialias: true }}>
              <ambientLight intensity={1.6} />
              <directionalLight position={[3, 5, 5]} intensity={2.2} color="#f4e7ff" />
              <pointLight position={[-3, 1, -2]} intensity={10} color="#a07ce4" />
              <Suspense fallback={null}><ExerciseFeed exercise={exercise} orbitStart={orbitStart} /></Suspense>
            </Canvas>
            {!signalReady && (
              <div className="mission__signal" aria-hidden="true">
                <canvas ref={staticCanvas} className="mission__static" />
                <div className="mission__signal-bars" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
