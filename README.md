# habitkeeper

An accountability app for two friends who are losing weight together. It's meant to grow over time into an all-in-one tracker for fitness, eating habits, and motivation.

## What's here

`tracker/index.html` is the source of **Weigh-In Partners**. It runs as a claude.ai Artifact, and the live page is at https://claude.ai/artifact/48VijcoQAAUQbywCG821Ge.

What it does today:

- **Weekly check-ins:** weight, how the week went, notes, and an optional progress photo.
- **Progress as % of starting body weight**, so partners of different sizes are measured on the same scale. Both partners share one chart, and there are milestone badges.
- **Daily habit taps:** worked out, water, steps, ate on plan. Each partner has a daily streak.
- **Weekly commitments:** up to 3 promises a week, each marked "did it" or "missed", and visible to your partner.
- **Streaks and cheers:** personal and team weekly streaks, plus emoji cheers and short notes on each other's check-ins.
- **Coach's corner:** a weekly recap written by Claude, with a shout-out for each partner.

## How it runs

The page is a single HTML file with no build step. Data and features come from the Artifact runtime (`window.claude.use(...)`):

| Capability | Used for |
| --- | --- |
| `db` | Shared data in collections `people`, `checkins`, `cheers`, `days`, `commitments`, `recaps` |
| `user` | Remembering which partner a viewer is |
| `assets` | Progress photos (resized to a JPEG of at most 1400px before upload) |
| `sample` | Writing the weekly recap with Claude |

Outside claude.ai, the page renders but can't load or save any data.

## Sharing

To let your partner save check-ins and upload photos, share the artifact with them **by email as an Editor**, and don't turn on a public link.

## Roadmap

- Nudges when a partner is behind
- A smoothed trend line for weight
- A log for non-scale wins
- Before/now photo compare
- Celebrations and a team level
- Longer term: food and workout logging
