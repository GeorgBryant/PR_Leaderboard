
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./LoginModal.css";

// Maps our ten Supabase authentication accounts.
// Usernames are retrieved dynamically from the database.
const ACCOUNT_EMAILS = [
  "pr01@gbryant.uk",
  "pr02@gbryant.uk",
  "pr03@gbryant.uk",
  "pr04@gbryant.uk",
  "pr05@gbryant.uk",
  "pr06@gbryant.uk",
  "pr07@gbryant.uk",
  "pr08@gbryant.uk",
  "pr09@gbryant.uk",
  "pr10@gbryant.uk",
];

// Temporary mapping between usernames and login identifiers.
// This allows the database to supply the displayed usernames
// without exposing authentication emails in our profiles table.
const ACCOUNT_MAPPING = {
  George: 0,
  Lucas: 1,
  Ollie: 2,
  Aidan: 3,
  Alex: 4,
  Jonty: 5,
  Conor: 6,
  "Big Ben": 7,
  Ace: 8,
  Ruki: 9,
};

export default function LoginModal({ onLogin }) {
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Load the roster from Supabase.
  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, username");

      if (!active) return;

      if (fetchError) {
        console.error("Profile loading failed:", fetchError);
        setError("COULD NOT LOAD PROFILES.");
      } else {
        const roster = (data ?? [])
          .filter((member) =>
            Object.prototype.hasOwnProperty.call(
              ACCOUNT_MAPPING,
              member.username
            )
          )
.sort((a, b) =>
  a.username.localeCompare(b.username)
);

        setProfiles(roster);
      }

      setProfilesLoading(false);
    }

    loadProfiles();

    return () => {
      active = false;
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");

    const selectedProfile = profiles.find(
      (member) => member.id === profileId
    );

    if (!selectedProfile) {
      setError("SELECT A PROFILE.");
      return;
    }

    const accountIndex =
      ACCOUNT_MAPPING[selectedProfile.username];

    const email = ACCOUNT_EMAILS[accountIndex];

    if (!email) {
      setError("ACCOUNT CONFIGURATION ERROR.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate against Supabase.
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw authError;
      }

      // Verify that the authenticated account
      // matches the selected profile.
      if (data.user.id !== selectedProfile.id) {
        await supabase.auth.signOut();

        throw new Error(
          "ACCOUNT DOES NOT MATCH SELECTED PROFILE."
        );
      }

      // Retrieve the authenticated member's
      // current activation status.
      const { data: member, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, username, must_change_password")
          .eq("id", data.user.id)
          .single();

      if (profileError || !member) {
        await supabase.auth.signOut();

        throw new Error(
          "MEMBER PROFILE NOT FOUND."
        );
      }

      // Notify App.jsx that login succeeded.
      onLogin({
        id: member.id,
        name: member.username,
        mustChangePassword:
          member.must_change_password,
      });

    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.message || "LOGIN FAILED."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pr-login__dropdown">
      <section
        className="pr-login"
        role="region"
        aria-labelledby="pr-login-title"
      >

        <h2 id="pr-login-title">
          LOGIN<span>.</span>
        </h2>



        <form onSubmit={submit}>
          <label htmlFor="pr-profile">
            PROFILE
          </label>

          <select
            id="pr-profile"
            value={profileId}
            required
            disabled={profilesLoading || loading}
            onChange={(event) => {
              setProfileId(event.target.value);
              setPassword("");
              setError("");
            }}
          >
            <option value="" disabled>
              {profilesLoading
                ? "LOADING PROFILES..."
                : "SELECT PROFILE"}
            </option>

            {profiles.map((profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profile.username}
              </option>
            ))}
          </select>

          {profileId && (
            <>
              <label htmlFor="pr-password">
                PASSWORD
              </label>

              <input
                id="pr-password"
                type="password"
                autoComplete="current-password"
                value={password}
                disabled={loading}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
              />
            </>
          )}

          {error && (
            <p
              className="pr-login__notice"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="pr-login__submit"
            type="submit"
            disabled={
              loading ||
              profilesLoading ||
              !profileId
            }
          >
            {loading
              ? "CONNECTING..."
              : "LOGIN"}


          </button>
        </form>


      </section>
    </div>
  );
}
