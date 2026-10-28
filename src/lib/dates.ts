const pad = (n: number) => String(n).padStart(2, "0");

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const monday = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const today = () => ymd(new Date());
export const weekKey = (s: string) => ymd(monday(parse(s)));
export const thisWeek = () => ymd(monday(new Date()));
export const prevWeek = (k: string) => addDays(k, -7);
export const weekDates = (k = thisWeek()) => [...Array(7)].map((_, i) => addDays(k, i));

export const fmtDate = (s: string) => parse(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const fmtShort = (d: Date | string) =>
  (typeof d === "string" ? parse(d) : d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
