export type Unit = "lb" | "kg";
export type Mood = "great" | "okay" | "rough";

export interface Profile {
  id: string;
  display_name: string;
  unit: Unit;
  start_weight: number;
  start_date: string;
  goal_weight: number | null;
  why: string | null;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

export interface Member {
  team_id: string;
  user_id: string;
  color_index: number;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  mood: Mood | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface HabitDay {
  user_id: string;
  date: string;
  workout: boolean;
  water: boolean;
  steps: boolean;
  plan: boolean;
}

export interface Commitment {
  id: string;
  user_id: string;
  week: string;
  text: string;
  status: "hit" | "miss" | null;
  created_at: string;
}

export interface Cheer {
  id: string;
  checkin_id: string;
  from_user: string;
  emoji: string | null;
  text: string | null;
  created_at: string;
}

/** A team member with their profile, as the dashboard shows them. */
export interface Person extends Profile {
  color: string;
}

export const HABITS = [
  ["workout", "Worked out"],
  ["water", "Drank enough water"],
  ["steps", "Hit my steps"],
  ["plan", "Ate on plan"],
] as const;
export type HabitKey = (typeof HABITS)[number][0];

export const MOODS: Record<Mood, string> = { great: "Great week", okay: "Okay week", rough: "Rough week" };
export const CHEERS = ["💪", "👏", "🔥", "🙌"];
export const MILESTONES = [1, 2.5, 5, 7.5, 10, 15, 20];
export const COLORS = ["var(--p0)", "var(--p1)", "var(--p2)", "var(--p3)"];
