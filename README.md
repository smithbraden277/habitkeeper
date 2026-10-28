# habitkeeper

An accountability app for friends who are losing weight together. It's meant to grow over time into an all-in-one tracker for fitness, eating habits, and motivation.

Live at **https://smithbraden277.github.io/habitkeeper/**

## Features

- **Accounts and teams.** Sign up with email. Create a team and send your partner an invite link, or join a team with a 6-letter code.
- **Weekly check-ins** with weight, how the week went, notes, and an optional progress photo. Photos are private and only teammates can see them.
- **Progress as % of starting body weight**, so partners of different sizes are on the same scale. There's a shared chart and milestone badges.
- **Daily habit taps:** worked out, water, steps, ate on plan. Each person has a daily streak and a 7-day habit strip.
- **Weekly commitments:** up to 3 promises a week, each marked "did it" or "missed", and visible to your partner.
- **Streaks and cheers:** personal and team weekly streaks, plus emoji cheers and encouragement notes on check-ins.
- **Installable:** on your phone, use "Add to Home Screen" and it opens like an app.

## Stack

- [Vite](https://vite.dev) + React + TypeScript, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
- [Supabase](https://supabase.com) for auth, the Postgres database, and photo storage. The schema and row level security policies are in `supabase/migrations/`.

## Setup

1. Create a Supabase project. In the **SQL Editor**, run `supabase/migrations/0001_init.sql`.
2. In Supabase, go to **Authentication → URL Configuration** and set Site URL to `https://smithbraden277.github.io/habitkeeper/`.
3. Put the project URL and anon key in `.env.production`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
   Both values are public by design. Access is enforced by the row level security policies, so never commit the `service_role` key.
4. In GitHub, go to **Settings → Pages → Build and deployment** and set Source to **GitHub Actions**.

## Local development

```
npm install
cp .env.production .env.local   # or set your own project's values
npm run dev
```

## Roadmap

- Claude weekly recap (through a Supabase Edge Function with an Anthropic API key)
- Nudges when a partner is behind
- A smoothed weight trend line
- Non-scale wins log
- Before/now photo compare
- Celebrations and team levels
- Food and workout logging

`tracker/index.html` is the original claude.ai Artifact version, kept for reference.
