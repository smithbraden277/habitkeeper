import type { TeamData } from "../lib/useTeamData";
import { personStats, teamStreak } from "../lib/stats";
import { fmt1 } from "../lib/dates";

export default function TeamBanner({ data }: { data: TeamData }) {
  const { people, checkins } = data;
  if (people.length < 2) return null;
  const all = people.map((p) => personStats(p, checkins));
  const done = all.filter((s) => s.doneThisWeek).length;
  const ts = teamStreak(people, checkins);
  const avg = all.reduce((a, s) => a + s.lost, 0) / all.length;
  const msg =
    done === all.length ? (ts > 1 ? `Everyone checked in. ${ts} weeks in a row together.` : "Everyone checked in this week. Nice work, team.")
    : done === 0 ? "New week. Who's weighing in first?"
    : `Waiting on ${people.filter((_, i) => !all[i].doneThisWeek).map((p) => p.display_name).join(" and ")} this week.`;
  const lbl = { color: "inherit", opacity: 0.7 };
  return (
    <div className="team">
      <div><div className="label" style={lbl}>Team this week</div><strong>{msg}</strong></div>
      <div style={{ display: "flex", gap: 22 }}>
        <div><div className="label" style={lbl}>Team streak</div><div className="big">{ts} wk</div></div>
        <div><div className="label" style={lbl}>Average lost</div><div className="big">{fmt1(avg)}%</div></div>
      </div>
    </div>
  );
}
