import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import type { Checkin, Cheer, Commitment, HabitDay, Member, Person, Profile, Team } from "./types";
import { COLORS } from "./types";
import { addDays, thisWeek, today } from "./dates";

type TableName = "checkins" | "habit_days" | "commitments" | "cheers" | "members";

export interface TeamData {
  loading: boolean;
  error: string | null;
  me: Profile | null;
  team: Team | null;
  people: Person[];
  checkins: Checkin[];
  days: HabitDay[];
  commits: Commitment[];
  cheers: Cheer[];
  reload: (what?: TableName | "all") => Promise<void>;
  setDays: React.Dispatch<React.SetStateAction<HabitDay[]>>;
  setCommits: React.Dispatch<React.SetStateAction<Commitment[]>>;
}

const HISTORY_DAYS = 70;

export function useTeamData(userId: string): TeamData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [days, setDays] = useState<HabitDay[]>([]);
  const [commits, setCommits] = useState<Commitment[]>([]);
  const [cheers, setCheers] = useState<Cheer[]>([]);

  const ids = useMemo(() => (members.length ? members.map((m) => m.user_id) : [userId]), [members, userId]);
  const idsKey = ids.join(",");

  const loadCore = useCallback(async () => {
    const { data: prof, error: e1 } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (e1) throw e1;
    setMe(prof as Profile | null);
    const { data: mine, error: e2 } = await supabase.from("team_members").select("team_id").eq("user_id", userId).order("joined_at").limit(1);
    if (e2) throw e2;
    const teamId = mine?.[0]?.team_id as string | undefined;
    if (!teamId) {
      setTeam(null);
      setMembers([]);
      setProfiles(prof ? [prof as Profile] : []);
      return;
    }
    const [{ data: t }, { data: ms }] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).single(),
      supabase.from("team_members").select("*").eq("team_id", teamId).order("joined_at"),
    ]);
    setTeam(t as Team);
    setMembers((ms ?? []) as Member[]);
    const { data: ps } = await supabase.from("profiles").select("*").in("id", (ms ?? []).map((m) => m.user_id));
    setProfiles((ps ?? []) as Profile[]);
  }, [userId]);

  const load = useCallback(
    async (what: TableName | "all" = "all") => {
      const list = idsKey.split(",");
      const since = addDays(today(), -HISTORY_DAYS);
      const jobs: PromiseLike<unknown>[] = [];
      if (what === "all" || what === "members") jobs.push(loadCore());
      if (what === "all" || what === "checkins")
        jobs.push(supabase.from("checkins").select("*").in("user_id", list).order("date").then(({ data }) => setCheckins((data ?? []) as Checkin[])));
      if (what === "all" || what === "habit_days")
        jobs.push(supabase.from("habit_days").select("*").in("user_id", list).gte("date", since).then(({ data }) => setDays((data ?? []) as HabitDay[])));
      if (what === "all" || what === "commitments")
        jobs.push(
          supabase.from("commitments").select("*").in("user_id", list).gte("week", addDays(thisWeek(), -HISTORY_DAYS))
            .then(({ data }) => setCommits((data ?? []) as Commitment[])),
        );
      if (what === "all" || what === "cheers")
        jobs.push(supabase.from("cheers").select("*").order("created_at").then(({ data }) => setCheers((data ?? []) as Cheer[])));
      await Promise.all(jobs);
    },
    [idsKey, loadCore],
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load("all")
      .catch((e) => alive && setError(e?.message ?? "Couldn't load your data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  // Live updates: refetch a table whenever a teammate changes it.
  useEffect(() => {
    const map: Record<string, TableName> = {
      checkins: "checkins", habit_days: "habit_days", commitments: "commitments", cheers: "cheers", team_members: "members", profiles: "members",
    };
    const ch = supabase.channel("team-" + userId);
    for (const table of Object.keys(map))
      ch.on("postgres_changes", { event: "*", schema: "public", table }, () => void load(map[table]));
    ch.subscribe();
    const onFocus = () => void load("all");
    window.addEventListener("focus", onFocus);
    return () => {
      void supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
    };
  }, [load, userId]);

  const people: Person[] = useMemo(() => {
    const order = members.length ? members : [{ user_id: userId, color_index: 0 } as Member];
    return order
      .map((m) => {
        const p = profiles.find((x) => x.id === m.user_id);
        return p ? { ...p, start_weight: Number(p.start_weight), goal_weight: p.goal_weight ? Number(p.goal_weight) : null, color: COLORS[m.color_index % COLORS.length] } : null;
      })
      .filter((p): p is Person => p !== null);
  }, [members, profiles, userId]);

  return {
    loading, error, me, team, people,
    checkins: useMemo(() => checkins.map((c) => ({ ...c, weight: Number(c.weight) })), [checkins]),
    days, commits, cheers, reload: load, setDays, setCommits,
  };
}
