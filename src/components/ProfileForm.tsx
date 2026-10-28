import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, Unit } from "../lib/types";
import { today } from "../lib/dates";

export default function ProfileForm({ userId, initial, onDone, onCancel }: {
  userId: string; initial: Profile | null; onDone: () => void; onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.display_name ?? "");
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? "lb");
  const [start, setStart] = useState(initial ? String(initial.start_weight) : "");
  const [date, setDate] = useState(initial?.start_date ?? today());
  const [goal, setGoal] = useState(initial?.goal_weight ? String(initial.goal_weight) : "");
  const [why, setWhy] = useState(initial?.why ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const s = parseFloat(start), g = goal ? parseFloat(goal) : null;
    if (g && g >= s) return setMsg("Goal weight should be below your starting weight.");
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId, display_name: name.trim(), unit, start_weight: s, start_date: date, goal_weight: g, why: why.trim() || null,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    onDone();
  }

  return (
    <form className="formgrid" onSubmit={save}>
      <div className="grid2">
        <label className="f">Your name<input id="pf-name" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="f">Units
          <select id="pf-unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </label>
        <label className="f">Starting weight<input id="pf-start" type="number" step="0.1" min="30" max="1000" inputMode="decimal" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="f">Start date<input id="pf-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="f">Goal weight (optional)<input id="pf-goal" type="number" step="0.1" min="30" max="1000" inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
      </div>
      <label className="f">Your why (optional)
        <textarea id="pf-why" maxLength={280} placeholder="What's this for? e.g. Keep up with my kids, feel good at the wedding in June" value={why} onChange={(e) => setWhy(e.target.value)} />
      </label>
      <div className="row">
        <button className="primary" disabled={busy}>{initial ? "Save changes" : "Continue"}</button>
        {onCancel && <button type="button" className="ghost" onClick={onCancel}>Cancel</button>}
      </div>
      {msg && <div className="status err" role="status">{msg}</div>}
    </form>
  );
}
