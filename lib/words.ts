// Base word selection + letter scrambling.
//
// Base words are NOT taken at random from the validation dictionary. They come
// from the curated "Lexo Word Pool" (lib/baseWords.ts, also emitted as
// public/lexo-word-pool.json) — preprocessed from SCOWL and scored so every
// entry is a common, enjoyable 7–10 letter word with >=3 vowels, a balanced
// vowel/consonant ratio, diverse letters, and lots of valid subwords.
//
// This is deliberately SEPARATE from validation (lib/dictionary.ts): the pool
// decides which base words start a round; the dictionary decides which
// submissions are valid. Rebuild the pool with `node scripts/build-basewords.mjs`.

import { BASE_WORD_POOL, type BaseWordEntry } from "./baseWords";

export type { BaseWordEntry };
export { BASE_WORD_POOL };

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Normalised 0–100 playability score. `subwords` (count of valid words formable
 * from the letters) is the expensive input, precomputed for the pool; pass it
 * in when known. Mirrors scripts/build-basewords.mjs.
 */
export function scorePlayability(word: string, subwords = 0): number {
  const w = word.toLowerCase();
  const chars = w.split("");
  const vowels = chars.filter((c) => VOWELS.has(c)).length;
  const diversity = new Set(chars).size / w.length;
  const ratio = vowels / w.length;
  const counts: Record<string, number> = {};
  let repeat = 0;
  for (const c of chars) repeat = Math.max(repeat, (counts[c] = (counts[c] || 0) + 1));
  const vowelScore = (Math.min(vowels, 5) / 5) * 22;
  const diversityScore = diversity * 24;
  const subwordScore = (Math.min(subwords, 150) / 150) * 42;
  const balanceScore = Math.max(0, 12 - Math.abs(ratio - 0.4) * 40);
  const repeatPenalty = repeat >= 4 ? 30 : repeat === 3 ? 10 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round(vowelScore + diversityScore + subwordScore + balanceScore - repeatPenalty)),
  );
}

/**
 * Pick a base word from the pool, avoiding an immediate repeat. Weighted toward
 * higher playability so rounds skew fun. Pure lookup — no runtime scoring.
 */
export function generateBaseWord(exclude?: string): string {
  const pool: BaseWordEntry[] = exclude
    ? BASE_WORD_POOL.filter((e) => e.word !== exclude)
    : BASE_WORD_POOL;
  if (pool.length === 0) return BASE_WORD_POOL[0].word;

  const weights = pool.map((e) => e.playabilityScore + 20);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i].word;
  }
  return pool[pool.length - 1].word;
}

/** Shuffle a word's letters (Fisher–Yates), avoiding the original ordering. */
export function scramble(word: string): string[] {
  const letters = word.split("");
  if (letters.length < 2) return letters;
  for (let attempt = 0; attempt < 12; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    if (letters.join("") !== word) break;
  }
  return letters;
}
