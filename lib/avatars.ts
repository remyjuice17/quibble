// 20 original flat-style animal avatars. The art lives in
// components/ui/AvatarArt.tsx; each index maps to one animal below.
export const ARCHETYPES = [
  "fox", "cat", "dog", "bear", "panda",
  "rabbit", "frog", "owl", "penguin", "pig",
  "cow", "horse", "monkey", "lion", "tiger",
  "koala", "chick", "mouse", "snake", "fish",
] as const;

export const AVATAR_COUNT = ARCHETYPES.length;

/**
 * Pick a random avatar index that isn't already taken. Once every avatar is
 * in use, duplicates become unavoidable, so we fall back to any avatar.
 */
export function pickAvatar(taken: Set<number>): number {
  const free: number[] = [];
  for (let i = 0; i < AVATAR_COUNT; i++) if (!taken.has(i)) free.push(i);
  const pool = free.length ? free : ARCHETYPES.map((_, i) => i);
  return pool[Math.floor(Math.random() * pool.length)];
}
