import type { Checkin, Commitment, HabitDay, Person } from "./types";
import { HABITS } from "./types";
import { addDays, prevWeek, thisWeek, today, weekKey } from "./dates";

export const pctLost = (p: Person, w: number) => ((p.start_weight - w) / p.start_weight) * 100;

export function entriesFor(checkins: Checkin[], uid: string) {
  return checkins
    .filter((c) => c.user_id === uid)
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
}

/** Consecutive weeks in `weeks`, counting back from this week (or last week while this one is still open). */
export function weekStreak(weeks: Set<string>) {
  let k = thisWeek();
  if (!weeks.has(k)) k = prevWeek(k);
  let n = 0;
  while (weeks.has(k)) {
    n++;
    k = prevWeek(k);
  }
  return n;
}

export const tapCount = (d?: HabitDay) => (d ? HABITS.filter(([k]) => d[k]).length : 0);

export function dayStreak(days: HabitDay[], uid: string) {
  const byDate = new Map(days.filter((d) => d.user_id === uid).map((d) => [d.date, d]));
  let d = today();
  if (!tapCount(byDate.get(d))) d = addDays(d, -1);
  let n = 0;
  while (tapCount(byDate.get(d)) > 0) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function personStats(p: Person, checkins: Checkin[]) {
  const es = entriesFor(checkins, p.id);
  const last = es[es.length - 1];
  const current = last ? Number(last.weight) : p.start_weight;
  const lost = pctLost(p, current);
  const goalPct = p.goal_weight ? ((p.start_weight - p.goal_weight) / p.start_weight) * 100 : null;
  const toGoal = goalPct ? Math.max(0, Math.min(100, (lost / goalPct) * 100)) : null;
  const weeks = new Set(es.map((e) => weekKey(e.date)));
  const best = Math.max(0, ...es.map((e) => pctLost(p, Number(e.weight))));
  return { es, last, current, lost, goalPct, toGoal, weeks, streak: weekStreak(weeks), doneThisWeek: weeks.has(thisWeek()), best };
}

export function teamStreak(people: Person[], checkins: Checkin[]) {
  if (people.length < 2) return 0;
  const sets = people.map((p) => new Set(entriesFor(checkins, p.id).map((e) => weekKey(e.date))));
  return weekStreak(new Set([...sets[0]].filter((k) => sets.every((s) => s.has(k)))));
}

export const commitsFor = (commits: Commitment[], uid: string, week = thisWeek()) =>
  commits.filter((c) => c.user_id === uid && c.week === week).sort((a, b) => a.created_at.localeCompare(b.created_at));
