// Lightweight, browser-local progression. Persists to localStorage so it works
// with no backend; a Supabase `profiles` row can later replace the store while
// keeping this same API.

export type Profile = {
  xp: number;
  wins: number;
  games: number;
  streak: number; // current win streak
  bestStreak: number;
};

const KEY = "quibble:profile";

const DEFAULT: Profile = { xp: 0, wins: 0, games: 0, streak: 0, bestStreak: 0 };

export function getProfile(): Profile {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

/** XP required to advance FROM the given level to the next. */
export function xpToNext(level: number): number {
  return Math.round(120 * Math.pow(level, 1.35));
}

/** Resolve a level (1-indexed) and the XP already banked within it. */
export function levelInfo(xp: number): {
  level: number;
  intoLevel: number;
  span: number;
} {
  let level = 1;
  let remaining = xp;
  // Cap iterations defensively.
  for (let i = 0; i < 500; i++) {
    const span = xpToNext(level);
    if (remaining < span) return { level, intoLevel: remaining, span };
    remaining -= span;
    level += 1;
  }
  return { level, intoLevel: 0, span: xpToNext(level) };
}

export function titleForLevel(level: number): string {
  if (level >= 35) return "Quibblemaster";
  if (level >= 20) return "Cryptographer";
  if (level >= 10) return "Lexicographer";
  if (level >= 5) return "Wordsmith";
  return "Rookie";
}

export type GameOutcome = {
  won: boolean;
  score: number;
  roundMvps: number;
  awards: number; // longest/fastest awards won across the game
};

export function computeGameXp(o: GameOutcome, streakAfterWin: number): number {
  let xp = Math.round(o.score / 10);
  if (o.won) xp += 100 + Math.min(150, Math.max(0, streakAfterWin - 1) * 25);
  xp += o.roundMvps * 30;
  xp += o.awards * 20;
  return Math.max(0, xp);
}

export type ProgressResult = {
  gained: number;
  before: { xp: number; level: number; intoLevel: number; span: number };
  after: { xp: number; level: number; intoLevel: number; span: number };
  leveledUp: boolean;
  newLevel: number;
  title: string;
  streak: number;
};

/** Apply a finished game to the stored profile and return an animation-ready diff. */
export function applyGameResult(o: GameOutcome): ProgressResult {
  const prev = getProfile();
  const streak = o.won ? prev.streak + 1 : 0;
  const gained = computeGameXp(o, streak);

  const beforeXp = prev.xp;
  const afterXp = prev.xp + gained;
  const before = { xp: beforeXp, ...levelInfo(beforeXp) };
  const after = { xp: afterXp, ...levelInfo(afterXp) };

  const next: Profile = {
    xp: afterXp,
    games: prev.games + 1,
    wins: prev.wins + (o.won ? 1 : 0),
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
  };
  saveProfile(next);

  return {
    gained,
    before: { xp: before.xp, level: before.level, intoLevel: before.intoLevel, span: before.span },
    after: { xp: after.xp, level: after.level, intoLevel: after.intoLevel, span: after.span },
    leveledUp: after.level > before.level,
    newLevel: after.level,
    title: titleForLevel(after.level),
    streak,
  };
}
