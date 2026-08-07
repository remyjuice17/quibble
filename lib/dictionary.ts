// Local, instant word VALIDATION.
//
// This is the validation dictionary and is intentionally separate from the
// curated base-word pool (lib/baseWords.ts): this decides whether a *submitted*
// word is valid; the pool decides which *base* words a round starts from.
// Keeping them separate makes it easy to swap dictionaries or add languages
// later without touching game logic.
//
// The list is a static asset at `public/dictionary.txt`, loaded once into a Set
// in memory when the game starts. After that first load every check is a
// synchronous Set lookup — instant, case-insensitive, no external API.
//
// Shipped list: SCOWL (Spell Checker Oriented Word Lists), medium vocabulary
// (size tiers up to ~60), merging English + British/American/intl variants.
// This recognises common British and international English while excluding
// obscure vocabulary, proper nouns, and abbreviations. Regenerate with
// `node scripts/build-dictionary.mjs`, then rebuild the pool with
// `node scripts/build-basewords.mjs`.

let WORDS: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

export function isDictionaryReady(): boolean {
  return WORDS !== null;
}

/** Load the word list once (idempotent — subsequent calls reuse the Set). */
export function loadDictionary(): Promise<Set<string>> {
  if (WORDS) return Promise.resolve(WORDS);
  if (loading) return loading;
  loading = fetch("/dictionary.txt")
    .then((r) => {
      if (!r.ok) throw new Error(`dictionary ${r.status}`);
      return r.text();
    })
    .then((text) => {
      const set = new Set<string>();
      for (const line of text.split("\n")) {
        const w = line.trim().toLowerCase();
        if (w) set.add(w);
      }
      WORDS = set;
      return set;
    })
    .catch((e) => {
      loading = null; // allow a retry
      throw e;
    });
  return loading;
}

/** Instant, case-insensitive membership test. Requires the dictionary loaded. */
export function isValidWord(word: string): boolean {
  if (!WORDS) return false;
  return WORDS.has(word.trim().toLowerCase());
}

/**
 * Every valid dictionary word (length >= 3) that can be formed from the letters
 * of `base` (each letter used at most as often as it appears). Used to build the
 * end-of-game Word Review. Computed once per round from the in-memory Set, so
 * it's a single linear pass — no per-word network or repeated work.
 */
/**
 * True if `word` can be spelled using only the letters available in `base`
 * (each letter usable at most as many times as it appears in base). Shared by
 * possibleWords() and the live submit-time check, so both apply the exact
 * same rule.
 */
export function canFormFromLetters(word: string, base: string): boolean {
  const w = word.trim().toLowerCase();
  const b = base.trim().toLowerCase();
  const need = new Uint8Array(26);
  const A = 97;
  for (let i = 0; i < b.length; i++) need[b.charCodeAt(i) - A]++;
  const have = new Uint8Array(26);
  for (let i = 0; i < w.length; i++) {
    const c = w.charCodeAt(i) - A;
    if (c < 0 || c > 25) return false;
    if (++have[c] > need[c]) return false;
  }
  return true;
}

export function possibleWords(base: string): string[] {
  if (!WORDS) return [];
  const b = base.trim().toLowerCase();
  const out: string[] = [];
  WORDS.forEach((w) => {
    if (w.length < 3 || w.length > b.length) return;
    if (canFormFromLetters(w, base)) out.push(w);
  });
  // Longest first, then alphabetical — reads well in the review.
  out.sort((x, y) => y.length - x.length || (x < y ? -1 : 1));
  return out;
}
