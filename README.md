# Quibble

A fast, friendly **multiplayer word game** for teams — built with **Next.js (App
Router)**, **TypeScript**, and **Tailwind CSS**. Linear-inspired: dark-mode
first, minimal, rounded, with smooth motion, procedural audio, and Geist
typography.

Players join a room with just a username, get a scrambled base word each round,
and race to find as many valid words as they can. It's fully playable:
real-time rooms, synchronized rounds, live chat + leaderboard, scoring,
gamification (combos, XP/levels, awards), and a procedural sound system.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Start a game**. Without Supabase keys the
app runs in **solo mode** (backed by an in-memory channel) so you can develop
the full UI before configuring anything.

## Word validation

Validation is **fully local and instant** — there is no dictionary API. The app
bundles **SCOWL** (Spell Checker Oriented Word Lists) at a medium vocabulary
level (size tiers up to ~60), merging English + British/American/international
variants so it recognises common British and international English while
excluding obscure vocabulary, proper nouns, and abbreviations. It ships as
`public/dictionary.txt` (~80k words), loads once into an in-memory `Set` in the
browser, and every check after that is a synchronous, case-insensitive lookup —
no per-guess network requests. Regenerate it with:

```bash
node scripts/build-dictionary.mjs   # needs the wordlist-english devDependency
```

The validation dictionary is intentionally **separate** from the base-word pool
below, so you can swap dictionaries or add languages without touching game logic.

## Base words (the "Lexo Word Pool")

Base words are not random dictionary picks. `scripts/build-basewords.mjs`
preprocesses SCOWL into a small curated pool: it scores every common 7–10 letter
candidate for "playability" (vowel count, letter diversity, vowel/consonant
balance, and the number of valid subwords each yields), keeps only those above
threshold, and writes them to both `lib/baseWords.ts` (bundled, imported by the
game) and `public/lexo-word-pool.json` (a portable dataset). Each entry carries
metadata — `word`, `letters`, `vowels`, `difficulty`, `validSubwords`,
`playabilityScore`. The game picks base words from this precomputed pool, so
starts are fast and there's no runtime scoring. Rebuild with:

```bash
node scripts/build-basewords.mjs    # run after build-dictionary.mjs
```

## One word per round

Each valid word can be claimed **once per round**. The first successful
submission (by server/broadcast order) wins the points and appears in chat;
later submissions of the same word are rejected with "Already claimed." A
**Claimed Words** panel in the game nav lists everything found so far. The
claimed set resets at the start of each round.

## Multiplayer (Supabase Realtime)

Players join with just a username — **no accounts, no database tables**. It uses
Supabase Realtime **Presence** (who's in the room + live scores) and
**Broadcast** (words + round state).

1. Create a free project at https://supabase.com.
2. From **Project Settings → API**, copy the **Project URL** and the **`anon`
   public key**.
3. Add them to `.env.local`:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart the dev server, open two tabs with different usernames, and they join
the same room. Realtime is enabled by default on new Supabase projects — there's
nothing else to configure (no tables, no RLS, no SQL).

### How synchronisation works

- The earliest player in the room is the **host** and runs the round loop,
  broadcasting each round's base word and an absolute `endsAt` timestamp.
- Every client renders its countdown from that timestamp, correcting for clock
  skew, so timers stay aligned. The host heartbeats state every ~2s so late
  joiners catch up.
- Each valid word updates that player's presence **score** and broadcasts the
  word to everyone; first-claim-wins is resolved from broadcast order.
- If the host leaves, the next-earliest player takes over automatically.

## Deployment

The app is a standard Next.js build. It needs **only two public env vars**
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and **no database**.

### Vercel (recommended)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. On https://vercel.com, **Add New → Project** and import the repo. Framework
   preset auto-detects **Next.js**; leave build (`next build`) and output
   defaults as-is.
3. Under **Environment Variables**, add both `NEXT_PUBLIC_*` values from your
   Supabase project (add them for Production, Preview, and Development).
4. **Deploy.** Add a custom domain later under **Settings → Domains**.

Because the Supabase values are `NEXT_PUBLIC_*`, they are read at **build time** —
if you change them, trigger a redeploy.

### Any Node host

`npm run build && npm run start` serves the app on `$PORT` (default 3000). Set
the two env vars in the host's environment. Works on Render, Railway, Fly.io,
a container, etc. (Netlify works too via its Next.js adapter.)

### Notes

- `public/dictionary.txt` (SCOWL, ~744KB, ~260KB gzipped) ships as a static asset and is
  CDN-cached; it loads once on the game screen, then validation is offline.
- Fonts (Geist + Geist Mono) are self-hosted via the `geist` package — no
  external font fetch at runtime.
- The `anon` key is meant to be public. Since there are no tables/RLS, the only
  surface is Realtime channels; for a public launch consider Supabase's Realtime
  rate limits / authorization if you expect abuse.

## Project structure

```
app/
  layout.tsx        # Geist fonts + AudioProvider + metadata
  globals.css       # Tokens, word-outline utils, base styles
  page.tsx          # Landing page
  game/page.tsx     # RoomFlow + GameShell
components/
  game/             # RoomFlow, RoomRouter, GameContext (realtime), Lobby,
                    #   Countdown (round-start modal), GameShell, TopNav,
                    #   ChatFeed, Leaderboard, WordInput, RoundOverlay,
                    #   Results, GameAudio, ClaimedWordsPanel
  audio/            # AudioProvider, SoundSettings, AchievementToaster
  landing/ ui/      # HeroWord, Logo, AvatarArt, Confetti
lib/
  supabase.ts       # Browser client (null when unconfigured)
  room.ts           # Channel abstraction + local shim + payload types
  players.ts        # Avatars, scoring, RoomPlayer
  words.ts          # Base-word selection (scored pool) + scramble
  baseWords.ts      # AUTO-GENERATED Lexo Word Pool (from SCOWL)
  dictionary.ts     # Local SCOWL loader + instant validator
  progression.ts    # XP / levels (localStorage)
  audio/engine.ts   # Procedural Web Audio (SFX + generative music)
scripts/
  build-dictionary.mjs # SCOWL → public/dictionary.txt
  build-basewords.mjs  # Scores candidates against SCOWL → Lexo pool
public/
  dictionary.txt    # SCOWL validation list
  lexo-word-pool.json # curated base-word dataset
tailwind.config.ts  # Design tokens (colors, radii, shadows, keyframes)
```

## Design tokens

| Token        | Value     | Use                 |
| ------------ | --------- | ------------------- |
| `background` | `#08090A` | Page base           |
| `surface`    | `#0F1011` | Panels              |
| `elevated`   | `#161719` | Tiles, cards        |
| `line`       | `#232427` | Hairline borders    |
| `foreground` | `#F7F8F8` | Primary text        |
| `muted`      | `#8A8F98` | Secondary text      |
| `accent`     | `#5E6AD2` | Brand / interactive |
