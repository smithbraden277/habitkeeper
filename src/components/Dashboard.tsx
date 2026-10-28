import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { TeamData } from "../lib/useTeamData";
import { fmtShort, monday, parse } from "../lib/dates";
import TeamBanner from "./TeamBanner";
import PartnerCard from "./PartnerCard";
import MyWeek from "./MyWeek";
import Chart from "./Chart";
import CheckinForm from "./CheckinForm";
import Feed from "./Feed";
import ProfileForm from "./ProfileForm";
import InviteCard from "./InviteCard";

export default function Dashboard({ userId, data }: { userId: string; data: TeamData }) {
  const [editing, setEditing] = useState(false);
  const { people, team } = data;
  const me = people.find((p) => p.id === userId)!;
  const start = people.map((p) => p.start_date).sort()[0];
  const wk = start ? Math.floor((monday(new Date()).getTime() - monday(parse(start)).getTime()) / 6048e5) + 1 : null;
  const sun = monday(new Date());
  sun.setDate(sun.getDate() + 6);

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand"><img src={import.meta.env.BASE_URL + "icon.svg"} alt="" />habitkeeper</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="small ghost" onClick={() => setEditing((v) => !v)}>Edit profile</button>
          <button className="small ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
      <header className="top">
        <div className="label">{wk ? `Week ${wk} · ` : ""}Check in by Sunday, {fmtShort(sun)}</div>
        <h1>{team!.name}</h1>
        <div className="weekline muted">Progress is measured as % of starting body weight, so everyone is on the same scale.</div>
      </header>

      {editing && (
        <section className="panel formgrid">
          <h2>Edit your profile</h2>
          <ProfileForm userId={userId} initial={me} onDone={() => { setEditing(false); void data.reload("members"); }} onCancel={() => setEditing(false)} />
        </section>
      )}
      {people.length < 2 && <InviteCard team={team!} />}
      <TeamBanner data={data} />
      <section className="people">
        {people.map((p) => <PartnerCard key={p.id} person={p} data={data} isMe={p.id === userId} />)}
      </section>
      <MyWeek me={me} data={data} />
      <Chart people={people} checkins={data.checkins} />
      <CheckinForm me={me} data={data} />
      <Feed userId={userId} data={data} />
      {people.length >= 2 && <InviteCard team={team!} compact />}
    </div>
  );
}
