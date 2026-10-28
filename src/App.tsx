import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { configured, supabase } from "./lib/supabase";
import { useTeamData } from "./lib/useTeamData";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured)
    return (
      <div className="wrap">
        <div className="panel auth">
          <h2>Almost there</h2>
          <p className="muted">This copy of habitkeeper isn't connected to a database yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and rebuild.</p>
        </div>
      </div>
    );
  if (session === undefined) return <div className="wrap muted">Loading…</div>;
  if (!session) return <Auth />;
  return <SignedIn userId={session.user.id} email={session.user.email ?? ""} />;
}

function SignedIn({ userId, email }: { userId: string; email: string }) {
  const data = useTeamData(userId);
  if (data.loading) return <div className="wrap muted">Loading your check-ins…</div>;
  if (data.error)
    return (
      <div className="wrap">
        <div className="panel">
          <h2>Couldn't load your data</h2>
          <p className="muted">{data.error}</p>
          <button onClick={() => data.reload("all")}>Try again</button>
        </div>
      </div>
    );
  if (!data.me || !data.team) return <Onboarding userId={userId} email={email} data={data} />;
  return <Dashboard userId={userId} data={data} />;
}
