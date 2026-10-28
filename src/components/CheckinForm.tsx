import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { TeamData } from "../lib/useTeamData";
import type { Mood, Person } from "../lib/types";
import { MOODS } from "../lib/types";
import { personStats } from "../lib/stats";
import { today } from "../lib/dates";
import { shrink } from "../lib/photos";

export default function CheckinForm({ me, data }: { me: Person; data: TeamData }) {
  const s = personStats(me, data.checkins);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today());
  const [mood, setMood] = useState<Mood>("okay");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ err?: boolean; text: string } | null>(null);
  const [inputKey, setInputKey] = useState(0);

  function pick(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!(w > 0)) return setMsg({ err: true, text: "Enter your weight as a number." });
    setBusy(true);
    setMsg(null);
    let photo_path: string | null = null;
    if (file) {
      setMsg({ text: "Uploading photo…" });
      let blob: Blob;
      try {
        blob = await shrink(file);
      } catch {
        setBusy(false);
        return setMsg({ err: true, text: "That photo couldn't be read. Try a JPEG or PNG, or save without a photo." });
      }
      photo_path = `${me.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("photos").upload(photo_path, blob, { contentType: "image/jpeg" });
      if (error) {
        setBusy(false);
        return setMsg({ err: true, text: `Photo upload failed: ${error.message}` });
      }
    }
    const { error } = await supabase.from("checkins").insert({ user_id: me.id, date, weight: w, mood, note: note.trim() || null, photo_path });
    setBusy(false);
    if (error) return setMsg({ err: true, text: `Couldn't save: ${error.message}` });
    await data.reload("checkins");
    setWeight("");
    setNote("");
    pick(null);
    setInputKey((k) => k + 1);
    setMsg({ text: "Saved. Nice work showing up." });
  }

  return (
    <section className="panel">
      <form className="formgrid" onSubmit={submit}>
        <div className="row between">
          <h2>Weekly check-in</h2>
          {s.doneThisWeek && <span className="pill good">Already in for this week. Extra check-ins are fine.</span>}
        </div>
        <div className="grid2">
          <label className="f">Weight ({me.unit})
            <input id="ci-weight" type="number" step="0.1" min="30" max="1000" inputMode="decimal" required
              placeholder={String(s.last ? s.last.weight : me.start_weight)} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          <label className="f">Date<input id="ci-date" type="date" required value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <span className="label">How did the week go?</span>
          <div className="moods" role="radiogroup">
            {(Object.keys(MOODS) as Mood[]).map((k) => (
              <span key={k}>
                <input type="radio" name="mood" id={"mood-" + k} value={k} checked={mood === k} onChange={() => setMood(k)} />
                <label htmlFor={"mood-" + k}>{MOODS[k]}</label>
              </span>
            ))}
          </div>
        </div>
        <label className="f">Notes
          <textarea id="ci-note" maxLength={1500} placeholder="Wins, struggles, what you're trying next week…" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label className="f">Progress photo (optional)
          <input key={inputKey} id="ci-photo" type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          {preview && <img className="preview" src={preview} alt="Selected photo preview" />}
        </label>
        <div className="tip">Same scale, same time of day, ideally first thing in the morning. Weekly numbers bounce around by a pound or two, so watch the trend line, not one week.</div>
        <div className="row"><button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save check-in"}</button></div>
        {msg && <div className={"status" + (msg.err ? " err" : "")} role="status">{msg.text}</div>}
      </form>
    </section>
  );
}
