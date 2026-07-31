# Quibble — launch / port notes

Open tasks to complete before/while taking the redesigned game live. The bright
"letter-tile" visual identity currently lives in the **preview**
(`quibble-preview.jsx`, the design source of truth); porting it into this
deployable Next.js app is tracked separately. Items below are things that must
be real (not mocked) once live.

## 1. "N online" indicator — wire to real presence  ⬅ pending

The landing nav shows a live-players pill (e.g. "214 online"). In the preview
this number is a **hard-coded placeholder** — it does not reflect anyone. Do NOT
ship a fake live count; it's misleading.

**Plan (during the landing port):**
- Use Supabase Realtime **Presence** — the same primitive already used for
  in-room multiplayer (`lib/room.ts`), so no new infra.
- On the landing (client), join one global channel, e.g. `presence:lobby`:
  - `const ch = supabase.channel("presence:lobby", { config: { presence: { key: <anon-id> } } })`
  - `ch.on("presence", { event: "sync" }, () => setCount(Object.keys(ch.presenceState()).length))`
  - `ch.subscribe(async (s) => { if (s === "SUBSCRIBED") await ch.track({ at: Date.now() }); })`
  - untrack / `removeChannel` on unmount.
- Show the real count; when Supabase isn't configured (solo/dev) or the channel
  is empty, hide the pill or show a non-live label instead of a fake number.

**Caveats:** counts only visitors with the app open (not registered users);
Supabase free tier caps concurrent connections / channel members — fine for
team/casual scale, revisit if traffic grows. A cheaper approximation is a
polled "active in last N minutes" count instead of true presence.

**Alternative if we don't want a live count at all:** replace the label with a
non-live line ("Play with your team") or a real cumulative stat
("N games played") computed once.

## 2. (add further port/launch tasks here)
- Port the preview's visual identity (palette, fonts, sky/clouds, falling
  letters, tiles, buttons, chat bubbles, animated leaderboard, gameplay
  hierarchy) into the app components + `globals.css` / `tailwind.config.ts`.
- Join/leave sound cues and letter-confetti / tile-flip loader (do in-app where
  the audio engine + confetti live).
