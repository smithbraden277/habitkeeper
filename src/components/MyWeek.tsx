import { useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import type { TeamData } from "../lib/useTeamData";
import type { Commitment, HabitDay, HabitKey, Person } from "../lib/types";
import { HABITS } from "../lib/types";
import { commitsFor, dayStreak } from "../lib/stats";
import { parse, thisWeek, today, weekDates } from "../lib/dates";

const IDEAS = ["Work out 3 times", "No soda on weekdays", "8k steps 5 days", "Pack lunch 4 days", "In bed by 11", "Log every meal"];

export default function MyWeek({ me, data }: { me: Person; data: TeamData }) {
  const t = today();
  const [day, setDay] = useState(t);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const cur = data.days.find((d) => d.user_id === me.id && d.date === day);
  const commits = commitsFor(data.commits, me.id);
  const hits = commits.filter((c) => c.status === "hit").length;

  const fail = (e: { message: string } | null) => {
    if (e) {
      setErr("Couldn't save that. Check your connection and try again.");
      void data.reload("all");
    }
  };

  async function toggle(k: HabitKey) {
    const next: HabitDay = { user_id: me.id, date: day, workout: false, water: false, steps: false, plan: false, ...cur, [k]: !cur?.[k] };
    data.setDays((ds) => [...ds.filter((d) => !(d.user_id === me.id && d.date === day)), next]);
    setErr(null);
    const { error } = await supabase.from("habit_days").upsert(next);
    fail(error);
  }

  async function add(text: string) {
    text = text.trim();
    if (!text || commits.length >= 3) return;
    setDraft("");
    setErr(null);
    const { data: row, error } = await supabase.from("commitments").insert({ user_id: me.id, week: thisWeek(), text }).select().single();
    if (row) data.setCommits((cs) => [...cs, row as Commitment]);
    fail(error);
  }

  async function mark(c: Commitment, status: Commitment["status"]) {
    data.setCommits((cs) => cs.map((x) => (x.id === c.id ? { ...x, status } : x)));
    const { error } = await supabase.from("commitments").update({ status }).eq("id", c.id);
    fail(error);
  }

  async function remove(c: Commitment) {
    data.setCommits((cs) => cs.filter((x) => x.id !== c.id));
    const { error } = await supabase.from("commitments").delete().eq("id", c.id);
    fail(error);
  }

  return (
    <section className="panel">
      <div className="myweek">
        <div>
          <div className="row between">
            <h2>Today's habits</h2>
            <span className="pill good">{dayStreak(data.days, me.id)}-day streak</span>
          </div>
          <div className="daybtns" aria-label="Pick a day">
            {weekDates().filter((d) => d <= t).map((d) => (
              <button key={d} className={"daybtn" + (d === day ? " on" : "")} aria-pressed={d === day} onClick={() => setDay(d)}>
                {d === t ? "Today" : parse(d).toLocaleDateString(undefined, { weekday: "short" })}
              </button>
            ))}
          </div>
          <div className="taps" style={{ "--c": me.color } as CSSProperties}>
            {HABITS.map(([k, label]) => (
              <button key={k} className={"tap" + (cur?.[k] ? " on" : "")} aria-pressed={!!cur?.[k]} onClick={() => toggle(k)}>
                <span className="t">{label}</span>
                <span className="s">{cur?.[k] ? "Done" : "Tap when done"}</span>
              </button>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>Ten seconds a day. Any habit logged keeps your daily streak alive.</div>
        </div>
        <div>
          <div className="row between">
            <h2>This week I will…</h2>
            {commits.length > 0 && <span className={"pill " + (hits === commits.length ? "good" : "warn")}>{hits} of {commits.length} done</span>}
          </div>
          {commits.length ? (
            <div className="commits">
              {commits.map((c) => (
                <div key={c.id} className={"commit " + (c.status ?? "")}>
                  <span className="mark">{c.status === "hit" ? "✓" : c.status === "miss" ? "✗" : "○"}</span>
                  <span className="txt">{c.text}</span>
                  <button className="small" aria-pressed={c.status === "hit"} onClick={() => mark(c, c.status === "hit" ? null : "hit")}>Did it</button>
                  <button className="small ghost" aria-pressed={c.status === "miss"} onClick={() => mark(c, c.status === "miss" ? null : "miss")}>Missed</button>
                  {!c.status && <button className="small ghost" aria-label={"Remove " + c.text} onClick={() => remove(c)}>✕</button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 14 }}>Pick 1 to 3 specific promises for this week. Your partner will see them on your card.</div>
          )}
          {commits.length < 3 && (
            <>
              <form className="row" style={{ gap: 8, flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); void add(draft); }}>
                <input id="cm-input" maxLength={80} placeholder="e.g. Work out 3 times" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button type="submit">Add</button>
              </form>
              <div className="ideas">
                {IDEAS.filter((i) => !commits.some((c) => c.text === i)).slice(0, 4).map((i) => (
                  <button key={i} className="small ghost" onClick={() => add(i)}>+ {i}</button>
                ))}
              </div>
            </>
          )}
          {err && <div className="status err" role="status">{err}</div>}
        </div>
      </div>
    </section>
  );
}
