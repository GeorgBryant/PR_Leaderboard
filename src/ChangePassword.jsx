
import { useState } from "react";
import { supabase } from "./supabase";
import "./ChangePassword.css";

export default function ChangePassword({ onComplete, onLogout }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");


    if (password !== confirm) {
      setError("PASSWORDS DO NOT MATCH.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) throw updateError;

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("COULD NOT VERIFY ACCOUNT.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, username, must_change_password")
          .eq("id", userData.user.id)
          .single();

      if (profileError || !profile) {
        throw new Error("COULD NOT VERIFY PROFILE.");
      }

      if (profile.must_change_password) {
        throw new Error(
          "PASSWORD UPDATED, BUT ACTIVATION IS STILL PENDING."
        );
      }

      onComplete(profile);
    } catch (err) {
      setError(err.message || "PASSWORD UPDATE FAILED.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="password-overlay">
      <section className="password-panel">

        <h1>NEW PASSWORD<span>.</span></h1>



        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">
            NEW PASSWORD
          </label>

          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="confirm-password">
            CONFIRM PASSWORD
          </label>

          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && (
            <p className="password-panel__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "UPDATING..." : "CHANGE PASSWORD"}
          </button>

          <button
  type="button"
  onClick={onLogout}
  className="password-panel__logout"
>
SWITCH ACCOUNT
</button>

        </form>
      </section>
    </div>
  );
}
