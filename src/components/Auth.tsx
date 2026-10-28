import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ err?: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const redirect = window.location.origin + import.meta.env.BASE_URL;
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } });
    setBusy(false);
    if (error) return setMsg({ err: true, text: error.message });
    if (mode === "signup" && !data.session) setMsg({ text: "Check your email for a confirmation link, then come back and sign in." });
  }

  async function reset() {
    if (!email) return setMsg({ err: true, text: "Enter your email first." });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + import.meta.env.BASE_URL });
    setMsg(error ? { err: true, text: error.message } : { text: "Password reset email sent." });
  }

  return (
    <div className="wrap">
      <div className="panel auth formgrid">
        <div className="brand"><img src={import.meta.env.BASE_URL + "icon.svg"} alt="" />habitkeeper</div>
        <h1 style={{ fontSize: 30 }}>{mode === "signin" ? "Welcome back" : "Start your pact"}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Weekly weigh-ins, daily habits and commitments with your accountability partner.
        </p>
        <form className="formgrid" onSubmit={submit}>
          <label className="f">Email<input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="f">Password
            <input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="primary" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        {msg && <div className={"status" + (msg.err ? " err" : "")} role="status">{msg.text}</div>}
        <div className="row between" style={{ fontSize: 14 }}>
          <button className="linkbtn" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}>
            {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
          {mode === "signin" && <button className="linkbtn" onClick={reset}>Forgot password</button>}
        </div>
      </div>
    </div>
  );
}
