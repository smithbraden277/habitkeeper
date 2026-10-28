import type { CSSProperties } from "react";
import type { TeamData } from "../lib/useTeamData";
import type { Person } from "../lib/types";
import { HABITS, MILESTONES } from "../lib/types";
import { commitsFor, dayStreak, personStats, tapCount } from "../lib/stats";
import { fmt1, fmtDate, parse, today, weekDates } from "../lib/dates";

export default function PartnerCard({ person: p, data, isMe }: { person: Person; data: TeamData; isMe: boolean }) {
  const s = personStats(p, data.checkins);
  const change = s.current - p.start_weight;
  const commits = commitsFor(data.commits, p.id);
  const t = today();
  return (
    <article className="panel pcard" style={{ "--c": p.color } as CSSProperties}>
      <div className="row between">
        <h2>{p.display_name}{isMe && <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}> (you)</span>}</h2>
        {s.doneThisWeek ? <span className="pill good">✓ Checked in</span> : <span className="pill warn">Due this week</span>}
      </div>
      <div>
        <div className="label">Body weight lost</div>
        <div className="pct">{fmt1(s.lost)}<small>%</small></div>
      </div>
      <div className="stats">
        <div><span className="label">Streak</span><span className="num">{s.streak} wk</span></div>
        <div><span className="label">Daily streak</span><span className="num">{dayStreak(data.days, p.id)} d</span></div>
        <div><span className="label">Change</span><span className="num">{change > 0 ? "+" : ""}{fmt1(change)} {p.unit}</span></div>
      </div>
      {p.goal_weight && s.goalPct && s.toGoal !== null && (
        <div style={{ display: "grid", gap: 6 }}>
          <div className="row between" style={{ fontSize: 13 }}>
            <span className="muted">Goal: {fmt1(s.goalPct)}% ({p.goal_weight} {p.unit})</span>
            <span className="num">{Math.round(s.toGoal)}%</span>
          </div>
          <div className="bar" role="img" aria-label={`${Math.round(s.toGoal)}% of the way to goal`}><i style={{ width: `${s.toGoal}%` }} /></div>
        </div>
      )}
      <div className="badges" aria-label="Milestones">
        {MILESTONES.filter((m) => !s.goalPct || m <= Math.max(s.goalPct, 5) + 0.01).map((m) => (
          <span key={m} className={"badge" + (s.best >= m ? " got" : "")} title={s.best >= m ? "Reached" : "Not yet"}>{m}%</span>
        ))}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <div className="label">Daily habits this week</div>
        <div className="strip" role="img" aria-label={`Habits logged each day this week by ${p.display_name}`}>
          {weekDates().map((ds) => {
            const n = tapCount(data.days.find((d) => d.user_id === p.id && d.date === ds));
            return (
              <div key={ds} className={ds === t ? "today" : ""} title={`${fmtDate(ds)}: ${n} of ${HABITS.length}`}>
                <i style={n ? { background: `color-mix(in srgb, var(--c) ${25 + (n * 75) / HABITS.length}%, var(--sunk))` } : undefined} />
                {parse(ds).toLocaleDateString(undefined, { weekday: "narrow" })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <div className="label">This week's commitments</div>
        {commits.length ? (
          <div className="minicommits">
            {commits.map((c) => (
              <div key={c.id} className={c.status ?? ""}>
                <span className="mark">{c.status === "hit" ? "✓" : c.status === "miss" ? "✗" : "○"}</span>
                <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{c.text}</span>
              </div>
            ))}
          </div>
        ) : <div className="muted" style={{ fontSize: 13.5 }}>None set yet.</div>}
      </div>
      {p.why && <div className="why note">{p.why}</div>}
    </article>
  );
}
