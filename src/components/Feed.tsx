import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import type { TeamData } from "../lib/useTeamData";
import type { Checkin, Cheer, Person } from "../lib/types";
import { CHEERS, MOODS } from "../lib/types";
import { entriesFor, pctLost } from "../lib/stats";
import { addDays, fmt1, fmtDate, fmtShort, thisWeek, weekKey } from "../lib/dates";
import { photoUrl } from "../lib/photos";

export default function Feed({ userId, data }: { userId: string; data: TeamData }) {
  const [light, setLight] = useState<string | null>(null);
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const items = data.checkins.filter((c) => byId.has(c.user_id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLight(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  let wk: string | null = null;
  const out: React.ReactNode[] = [];
  for (const c of items) {
    const k = weekKey(c.date);
    if (k !== wk) {
      wk = k;
      out.push(<div key={"w" + k} className="weekhead">{k === thisWeek() ? "This week" : `Week of ${fmtShort(k)} – ${fmtShort(addDays(k, 6))}`}</div>);
    }
    out.push(<Entry key={c.id} c={c} p={byId.get(c.user_id)!} userId={userId} data={data} byId={byId} onPhoto={setLight} />);
  }

  return (
    <section>
      <div className="row between" style={{ marginBottom: 10 }}><h2>Check-in log</h2></div>
      <div className="feed">
        {items.length ? out : <div className="panel muted">No check-ins yet. The first one sets the baseline for the chart.</div>}
      </div>
      {light && (
        <div className="lightbox" onClick={() => setLight(null)}>
          <img src={light} alt="Progress photo, enlarged" />
        </div>
      )}
    </section>
  );
}

function Entry({ c, p, userId, data, byId, onPhoto }: {
  c: Checkin; p: Person; userId: string; data: TeamData; byId: Map<string, Person>; onPhoto: (u: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [noteText, setNoteText] = useState("");
  useEffect(() => {
    if (c.photo_path) void photoUrl(c.photo_path).then((u) => (u ? setSrc(u) : setPhotoErr(true)));
  }, [c.photo_path]);

  const es = entriesFor(data.checkins, p.id);
  const i = es.findIndex((e) => e.id === c.id);
  const prev = i > 0 ? es[i - 1].weight : p.start_weight;
  const d = c.weight - prev;
  const mine = c.user_id === userId;
  const cheers = data.cheers.filter((x) => x.checkin_id === c.id);
  const notes = cheers.filter((x) => x.text);
  const canCheer = !mine;

  async function toggleCheer(emoji: string, existing?: Cheer) {
    if (existing) await supabase.from("cheers").delete().eq("id", existing.id);
    else await supabase.from("cheers").insert({ checkin_id: c.id, from_user: userId, emoji });
    await data.reload("cheers");
  }
  async function sendNote(e: React.FormEvent) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    setNoteText("");
    await supabase.from("cheers").insert({ checkin_id: c.id, from_user: userId, text });
    await data.reload("cheers");
  }
  async function remove() {
    await supabase.from("checkins").delete().eq("id", c.id);
    if (c.photo_path) await supabase.storage.from("photos").remove([c.photo_path]);
    await data.reload("checkins");
  }

  return (
    <article className="panel entry" style={{ "--c": p.color } as CSSProperties}>
      <div className="meta">
        <span className="who">{p.display_name}</span>
        <span className="muted">{fmtDate(c.date)}</span>
        {c.mood && <span className="chip">{MOODS[c.mood]}</span>}
      </div>
      <div className="meta">
        <span className="w">{c.weight} {p.unit}</span>
        <span className={"delta " + (d < 0 ? "down" : d > 0 ? "up" : "")}>
          {d > 0 ? "+" : d < 0 ? "−" : "±"}{fmt1(Math.abs(d))} {i > 0 ? "since last" : "from start"}
        </span>
        <span className="delta" style={{ color: "var(--c)" }}>{fmt1(pctLost(p, c.weight))}% total</span>
      </div>
      {c.note && <div className="note">{c.note}</div>}
      {c.photo_path && (photoErr ? <div className="tip">Photo not available.</div>
        : src ? <img className="photo" src={src} alt={`${p.display_name}'s progress photo, ${fmtDate(c.date)}`} loading="lazy" onClick={() => onPhoto(src)} onError={() => setPhotoErr(true)} />
        : <div className="tip">Loading photo…</div>)}
      {(canCheer || cheers.some((x) => x.emoji)) && (
        <div className="cheers">
          {CHEERS.map((e) => {
            const list = cheers.filter((x) => x.emoji === e);
            if (!list.length && !canCheer) return null;
            const own = list.find((x) => x.from_user === userId);
            const names = list.map((x) => byId.get(x.from_user)?.display_name ?? "Someone").join(", ");
            return (
              <button key={e} className={"cheer small" + (own ? " mine" : "")} disabled={!canCheer} title={names || "Send a cheer"}
                aria-label={`${e} ${list.length}${names ? " from " + names : ""}`} onClick={() => toggleCheer(e, own)}>
                {e} {list.length || ""}
              </button>
            );
          })}
          {canCheer && (
            <form className="row" style={{ flex: 1, gap: 6, minWidth: 0 }} onSubmit={sendNote}>
              <input id={"cn-" + c.id} placeholder="Leave some encouragement" maxLength={200} style={{ flex: 1, minWidth: 160, padding: "6px 10px" }}
                value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button className="small" type="submit">Send</button>
            </form>
          )}
        </div>
      )}
      {notes.length > 0 && (
        <div className="cheernotes">
          {notes.map((n) => {
            const fp = byId.get(n.from_user);
            return (
              <div key={n.id} className="cheernote" style={{ "--c": fp?.color ?? "var(--muted)" } as CSSProperties}>
                <b>{fp?.display_name ?? "Someone"}: </b>{n.text}
              </div>
            );
          })}
        </div>
      )}
      {mine && (confirm ? (
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>Delete this check-in?</span>
          <button className="small" onClick={remove}>Delete</button>
          <button className="small ghost" onClick={() => setConfirm(false)}>Keep</button>
        </div>
      ) : <div><button className="small ghost" onClick={() => setConfirm(true)}>Delete</button></div>)}
    </article>
  );
}
