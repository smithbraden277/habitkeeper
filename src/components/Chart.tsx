import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Checkin, Person } from "../lib/types";
import { entriesFor, pctLost } from "../lib/stats";
import { fmt1, fmtDate, fmtShort, monday, parse } from "../lib/dates";

const niceStep = (raw: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
const fmtTick = (v: number) => (Math.abs(v - Math.round(v)) < 0.01 ? String(Math.round(v)) : fmt1(v));

export default function Chart({ people, checkins }: { people: Person[]; checkins: Checkin[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const H = W < 500 ? 220 : 260, m = { l: 44, r: 16, t: 14, b: 28 };
  const series = people.map((p) => ({
    p,
    pts: [{ t: parse(p.start_date).getTime(), v: 0, e: null as Checkin | null },
      ...entriesFor(checkins, p.id).map((e) => ({ t: parse(e.date).getTime(), v: pctLost(p, e.weight), e }))],
  }));
  const ts = series.flatMap((s) => s.pts.map((x) => x.t));
  const vs = series.flatMap((s) => s.pts.map((x) => x.v));
  const t0 = Math.min(...ts);
  let t1 = Math.max(...ts, Date.now());
  if (t1 - t0 < 14 * 864e5) t1 = t0 + 14 * 864e5;
  const step = niceStep((Math.max(2, ...vs) - Math.min(0, ...vs)) / 4);
  const vMax = Math.ceil(Math.max(2, ...vs) / step) * step, vMin = Math.floor(Math.min(0, ...vs) / step) * step;
  const x = (t: number) => m.l + ((t - t0) / (t1 - t0)) * (W - m.l - m.r);
  const y = (v: number) => m.t + ((vMax - v) / (vMax - vMin)) * (H - m.t - m.b);

  const yTicks: number[] = [];
  for (let v = vMin; v <= vMax + 1e-9; v += step) yTicks.push(v);
  const span = (t1 - t0) / 864e5, every = span > 120 ? 28 : span > 50 ? 14 : 7;
  const xTicks: Date[] = [];
  const first = monday(new Date(t0));
  if (first.getTime() < t0) first.setDate(first.getDate() + 7);
  for (const d = new Date(first); d.getTime() <= t1 && x(d.getTime()) <= W - m.r - 18; d.setDate(d.getDate() + every)) xTicks.push(new Date(d));

  return (
    <section className="panel">
      <div className="row between">
        <h2>% of body weight lost</h2>
        <div className="legend">
          {people.map((p) => <span key={p.id} className="row" style={{ gap: 6, "--c": p.color } as CSSProperties}><span className="dot" />{p.display_name}</span>)}
        </div>
      </div>
      <div className="chartbox" ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Percent of starting body weight lost over time for each partner">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={Math.abs(v) < 1e-9 ? 1.5 : 1} fill="none" />
              <text x={m.l - 8} y={y(v) + 4} textAnchor="end">{fmtTick(v)}%</text>
            </g>
          ))}
          {xTicks.map((d) => <text key={d.getTime()} x={x(d.getTime())} y={H - 8} textAnchor="middle">{fmtShort(d)}</text>)}
          {series.map(({ p, pts }) => (
            <g key={p.id}>
              <path d={pts.map((q, i) => `${i ? "L" : "M"}${x(q.t).toFixed(1)},${y(q.v).toFixed(1)}`).join("")} fill="none" stroke={p.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((q, i) => {
                const last = i === pts.length - 1;
                return (
                  <circle key={i} cx={x(q.t)} cy={y(q.v)} r={last ? 5 : 3} fill={last ? p.color : "var(--surface)"} stroke={p.color} strokeWidth={2}>
                    <title>{`${p.display_name}, ${q.e ? `${fmtDate(q.e.date)}: ${q.e.weight} ${p.unit}, ` : "start, "}${fmt1(q.v)}% lost`}</title>
                  </circle>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
