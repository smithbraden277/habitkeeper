import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { TeamData } from "../lib/useTeamData";
import ProfileForm from "./ProfileForm";

const PENDING = "habitkeeper.invite";

export default function Onboarding({ userId, email, data }: { userId: string; email: string; data: TeamData }) {
  const [code, setCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // An invite link looks like .../habitkeeper/#join=ABC123
  useEffect(() => {
    const m = location.hash.match(/join=([A-Za-z0-9]+)/);
    const saved = (() => { try { return localStorage.getItem(PENDING); } catch { return null; } })();
    const c = m?.[1] ?? saved;
    if (c) {
      setCode(c.toUpperCase());
      try { localStorage.setItem(PENDING, c.toUpperCase()); } catch { /* private mode */ }
    }
  }, []);

  async function run(fn: "create_team" | "join_team") {
    setBusy(true);
    setMsg(null);
    const { error } = fn === "create_team"
      ? await supabase.rpc("create_team", { team_name: teamName || "Our pact" })
      : await supabase.rpc("join_team", { code });
    setBusy(false);
    if (error) return setMsg(error.message);
    try { localStorage.removeItem(PENDING); } catch { /* ignore */ }
    if (location.hash) history.replaceState(null, "", location.pathname);
    await data.reload("all");
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand"><img src={import.meta.env.BASE_URL + "icon.svg"} alt="" />habitkeeper</div>
        <button className="small ghost" onClick={() => supabase.auth.signOut()}>Sign out {email}</button>
      </div>
      {!data.me ? (
        <section className="panel formgrid">
          <div className="label">Step 1 of 2</div>
          <h2>Set up your profile</h2>
          <p className="muted" style={{ margin: 0 }}>Progress is measured as % of your starting weight, so partners of any size are on the same scale.</p>
          <ProfileForm userId={userId} initial={null} onDone={() => data.reload("all")} />
        </section>
      ) : (
        <section className="panel formgrid">
          <div className="label">Step 2 of 2</div>
          <h2>Find your partner</h2>
          {code ? (
            <>
              <p className="muted" style={{ margin: 0 }}>You've been invited to a team.</p>
              <div className="row">
                <input id="join-code" className="code" style={{ maxWidth: 200 }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Invite code" />
                <button className="primary" disabled={busy || code.length < 6} onClick={() => run("join_team")}>Join team</button>
              </div>
            </>
          ) : (
            <div className="grid2" style={{ alignItems: "start" }}>
              <div className="formgrid">
                <h3 style={{ fontSize: 16 }}>Start a new team</h3>
                <label className="f">Team name<input id="team-name" maxLength={40} placeholder="Our pact" value={teamName} onChange={(e) => setTeamName(e.target.value)} /></label>
                <button className="primary" disabled={busy} onClick={() => run("create_team")}>Create team</button>
                <span className="muted" style={{ fontSize: 13 }}>You'll get an invite link to send your partner.</span>
              </div>
              <div className="formgrid">
                <h3 style={{ fontSize: 16 }}>Join your partner's team</h3>
                <label className="f">Invite code<input id="join-code" className="code" maxLength={6} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
                <button disabled={busy || code.length < 6} onClick={() => run("join_team")}>Join team</button>
              </div>
            </div>
          )}
          {msg && <div className="status err" role="status">{msg}</div>}
        </section>
      )}
    </div>
  );
}
