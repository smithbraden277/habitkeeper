import { useState } from "react";
import type { Team } from "../lib/types";

export default function InviteCard({ team, compact }: { team: Team; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}${import.meta.env.BASE_URL}#join=${team.invite_code}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the link stays visible to copy by hand */
    }
  }
  if (compact)
    return (
      <div className="muted" style={{ fontSize: 13 }}>
        Team invite code <span className="num">{team.invite_code}</span> · <button className="linkbtn" onClick={copy}>{copied ? "Link copied" : "Copy invite link"}</button>
      </div>
    );
  return (
    <section className="panel formgrid">
      <h2>Invite your partner</h2>
      <p className="muted" style={{ margin: 0 }}>Send them this link. They'll create an account and land in your team.</p>
      <div className="row">
        <input id="invite-link" readOnly value={link} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0 }} />
        <button className="primary" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>Or they can enter the code <span className="code" style={{ fontSize: 15 }}>{team.invite_code}</span> after signing up.</div>
    </section>
  );
}
