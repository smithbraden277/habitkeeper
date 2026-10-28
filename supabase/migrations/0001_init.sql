-- habitkeeper initial schema.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  unit text not null default 'lb' check (unit in ('lb', 'kg')),
  start_weight numeric(6,1) not null check (start_weight > 0),
  start_date date not null default current_date,
  goal_weight numeric(6,1) check (goal_weight > 0),
  why text check (char_length(why) <= 280),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our pact' check (char_length(name) between 1 and 40),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid not null references auth.users on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  color_index int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null,
  weight numeric(6,1) not null check (weight > 0),
  mood text check (mood in ('great', 'okay', 'rough')),
  note text check (char_length(note) <= 1500),
  photo_path text,
  created_at timestamptz not null default now()
);
create index on public.checkins (user_id, date);

create table public.habit_days (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null,
  workout boolean not null default false,
  water boolean not null default false,
  steps boolean not null default false,
  plan boolean not null default false,
  primary key (user_id, date)
);

create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  week date not null, -- Monday of the week
  text text not null check (char_length(text) between 1 and 80),
  status text check (status in ('hit', 'miss')),
  created_at timestamptz not null default now()
);
create index on public.commitments (user_id, week);

create table public.cheers (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins on delete cascade,
  from_user uuid not null references auth.users on delete cascade default auth.uid(),
  emoji text check (char_length(emoji) <= 8),
  text text check (char_length(text) <= 200),
  created_at timestamptz not null default now(),
  check (emoji is not null or text is not null)
);
create unique index cheers_one_emoji on public.cheers (checkin_id, from_user, emoji) where emoji is not null;

-- ---------- helpers ----------

-- True when the signed-in user and `other` are in at least one team together (or are the same person).
create or replace function public.is_teammate(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select other = auth.uid() or exists (
    select 1 from team_members a join team_members b on a.team_id = b.team_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function public.is_member(team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = team and user_id = auth.uid());
$$;

create or replace function public.create_team(team_name text default 'Our pact')
returns public.teams language plpgsql security definer set search_path = public as $$
declare t teams;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into teams (name, created_by) values (coalesce(nullif(trim(team_name), ''), 'Our pact'), auth.uid()) returning * into t;
  insert into team_members (team_id, user_id, color_index) values (t.id, auth.uid(), 0);
  return t;
end $$;

create or replace function public.join_team(code text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare t teams; n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into t from teams where invite_code = upper(trim(code));
  if t.id is null then raise exception 'No team found with that invite code'; end if;
  select count(*) into n from team_members where team_id = t.id;
  if n >= 8 then raise exception 'That team is full'; end if;
  insert into team_members (team_id, user_id, color_index) values (t.id, auth.uid(), n)
  on conflict do nothing;
  return t;
end $$;

grant execute on function public.create_team(text), public.join_team(text) to authenticated;

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.checkins enable row level security;
alter table public.habit_days enable row level security;
alter table public.commitments enable row level security;
alter table public.cheers enable row level security;

create policy "read self and teammates" on public.profiles for select to authenticated using (public.is_teammate(id));
create policy "write own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members read team" on public.teams for select to authenticated using (public.is_member(id));
create policy "creator renames team" on public.teams for update to authenticated using (created_by = auth.uid());

create policy "members read members" on public.team_members for select to authenticated using (public.is_member(team_id));
create policy "leave team" on public.team_members for delete to authenticated using (user_id = auth.uid());

-- checkins, habit_days, commitments: teammates read, owner writes
create policy "teammates read" on public.checkins for select to authenticated using (public.is_teammate(user_id));
create policy "owner inserts" on public.checkins for insert to authenticated with check (user_id = auth.uid());
create policy "owner updates" on public.checkins for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner deletes" on public.checkins for delete to authenticated using (user_id = auth.uid());

create policy "teammates read" on public.habit_days for select to authenticated using (public.is_teammate(user_id));
create policy "owner inserts" on public.habit_days for insert to authenticated with check (user_id = auth.uid());
create policy "owner updates" on public.habit_days for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner deletes" on public.habit_days for delete to authenticated using (user_id = auth.uid());

create policy "teammates read" on public.commitments for select to authenticated using (public.is_teammate(user_id));
create policy "owner inserts" on public.commitments for insert to authenticated with check (user_id = auth.uid());
create policy "owner updates" on public.commitments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner deletes" on public.commitments for delete to authenticated using (user_id = auth.uid());

create policy "teammates read" on public.cheers for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id and public.is_teammate(c.user_id)));
create policy "cheer a teammate" on public.cheers for insert to authenticated
  with check (from_user = auth.uid() and exists (select 1 from public.checkins c where c.id = checkin_id and public.is_teammate(c.user_id)));
create policy "remove own cheer" on public.cheers for delete to authenticated using (from_user = auth.uid());

-- ---------- progress photos ----------
-- Private bucket; files live at <user id>/<file>.jpg and are shown to teammates through signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "teammates view photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_teammate(((storage.foldername(name))[1])::uuid));
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- live updates ----------

alter publication supabase_realtime add table public.checkins, public.habit_days, public.commitments, public.cheers, public.profiles, public.team_members;
