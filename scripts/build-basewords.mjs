// Build the curated "Lexo Word Pool" — the base words a round can start from.
//
// This is SEPARATE from the validation dictionary. It preprocesses the SCOWL
// validation list (public/dictionary.txt) into a small, high-quality pool: only
// common, enjoyable 7–10 letter words with >=3 vowels, a balanced vowel/
// consonant ratio, diverse letters, and lots of valid subwords survive. Each
// candidate is scored (0–100 playability) and anything below threshold is
// discarded. Output: lib/baseWords.ts (bundled) + public/lexo-word-pool.json.
//
// Run: node scripts/build-basewords.mjs  (after build-dictionary.mjs)
import fs from "node:fs";

const dict = fs
  .readFileSync(new URL("../public/dictionary.txt", import.meta.url), "utf8")
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);
const DICT = new Set(dict);

const A = "a".charCodeAt(0);
const vec = (w) => { const v = new Uint8Array(26); for (let i = 0; i < w.length; i++) v[w.charCodeAt(i) - A]++; return v; };
// Subword candidates: valid words length 3..10, a–z only.
const CAND = dict.filter((w) => w.length >= 3 && w.length <= 10 && /^[a-z]+$/.test(w)).map((w) => ({ w, v: vec(w), len: w.length }));

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const vowelCount = (w) => [...w].filter((c) => VOWELS.has(c)).length;
const uniqRatio = (w) => new Set(w.split("")).size / w.length;
const maxRepeat = (w) => { const m = {}; let mx = 0; for (const c of w.split("")) mx = Math.max(mx, (m[c] = (m[c] || 0) + 1)); return mx; };

function subwordCount(word) {
  const base = vec(word), L = word.length;
  let n = 0;
  for (const c of CAND) {
    if (c.len > L || c.w === word) continue;
    let ok = true;
    for (let i = 0; i < 26; i++) if (c.v[i] > base[i]) { ok = false; break; }
    if (ok) n++;
  }
  return n;
}

// Normalised 0–100 playability. Mirrors lib/words.ts scorePlayability().
function playability(vowels, diversity, subwords, ratio, repeat) {
  const vowelScore = (Math.min(vowels, 5) / 5) * 22;
  const diversityScore = diversity * 24;
  const subwordScore = (Math.min(subwords, 150) / 150) * 42;
  // Balanced vowel:consonant ratio peaks around 0.4.
  const balanceScore = Math.max(0, 12 - Math.abs(ratio - 0.4) * 40);
  const repeatPenalty = repeat >= 4 ? 30 : repeat === 3 ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(vowelScore + diversityScore + subwordScore + balanceScore - repeatPenalty)));
}
const difficultyFor = (score) => (score >= 80 ? "Easy" : score >= 60 ? "Medium" : "Hard");

// Curated candidates: common, recognisable words (proper nouns/abbrev excluded).
const CANDIDATES = `
operation education computer languages painting discovery creative relations
marketing designer operate operates operated learning teaching students
customer customers business consumer consumers together everyone somewhere
question questions national personal material remember important different
sometimes therefore following knowledge experience adventure celebrate
celebration information direction directions collection collections companion
generation generations understand understands background champions character
characters community condition conditions department developer developers
difference discussion educated elephant engineer engineers equipment establish
everybody excellent exercise expensive experience explained favourite feedback
frequency furniture generated gardener graduate grateful happiness hardware
highlight historian holidays hospital household identify improved incredible
industry inspired interest introduce invention journalist keyboard landscape
laughter lifetime literature magazine magician marketing meantime measured
medicine mentions merchant midnight mistakes moderate mountain movement
musician narrative negative newspaper november numerous obstacle offering
operator ordinary organise organised original overcome painters paradise
passenger patience peaceful personal petroleum physical platform pleasant
political portrait positive powerful presence preserve pressure previous
printers producer products property proposal reaction realised reasoning
recorded regarded relative reminder reporter republic resource response
returned romantic salaries sandwich schedule scenario sculpture searched
seasonal sensible sentence sequence services shipment shoulder signature
simplify situated slippery smallest software solution somebody speaker
specific standard straight strategy stranger strength struggle students
suddenly suitable superior surprise survival swimming sympathy teaching
template terrible thousand together tomorrow tornadoes tradition training
transfer traveller treasure triangle tropical umbrella universe vacation
valuable vertical vineyard vitamins volcanoes wanderer wildlife wondered
workshop yesterday relations education designer colourful favourite
`.split(/\s+/).map((w) => w.trim().toLowerCase()).filter(Boolean);

const inRange = (w) => w.length >= 7 && w.length <= 10;
const seen = new Set();
const pool = [];
for (const w of CANDIDATES) {
  if (seen.has(w)) continue;
  seen.add(w);
  if (!inRange(w) || !DICT.has(w)) continue;
  const vowels = vowelCount(w);
  const diversity = uniqRatio(w);
  const repeat = maxRepeat(w);
  const ratio = vowels / w.length;
  const subwords = subwordCount(w);
  const score = playability(vowels, diversity, subwords, ratio, repeat);
  // Threshold: enjoyable, playable words only.
  if (vowels >= 3 && diversity >= 0.6 && repeat <= 3 && subwords >= 30 && score >= 45) {
    pool.push({
      word: w.toUpperCase(),
      letters: w.length,
      vowels,
      difficulty: difficultyFor(score),
      validSubwords: subwords,
      playabilityScore: score,
    });
  }
}
pool.sort((a, b) => b.playabilityScore - a.playabilityScore || b.validSubwords - a.validSubwords);

// 1) Bundled TS module (imported by the game — no runtime fetch/calculation).
const ts = `// AUTO-GENERATED by scripts/build-basewords.mjs — do not edit by hand.
// The curated "Lexo Word Pool": common 7–10 letter words scored for playability
// against the SCOWL validation list. This is separate from the validation
// dictionary (lib/dictionary.ts) — it only decides which base words a round
// starts from. Also emitted as public/lexo-word-pool.json.

export type BaseWordEntry = {
  word: string;
  letters: number;
  vowels: number;
  difficulty: "Easy" | "Medium" | "Hard";
  validSubwords: number;
  playabilityScore: number;
};

export const BASE_WORD_POOL: BaseWordEntry[] = ${JSON.stringify(pool)};
`;
fs.writeFileSync(new URL("../lib/baseWords.ts", import.meta.url), ts);

// 2) Standalone JSON dataset (portable; supports future languages/dictionaries).
fs.writeFileSync(
  new URL("../public/lexo-word-pool.json", import.meta.url),
  JSON.stringify({ source: "SCOWL<=60", generated: new Date().toISOString().slice(0, 10), count: pool.length, words: pool }, null, 2),
);

const need = ["OPERATION","EDUCATION","COMPUTER","CREATIVE","DISCOVERY","RELATIONS","MARKETING","PAINTING","LANGUAGES","DESIGNER"];
const have = new Set(pool.map((p) => p.word));
console.log(`Pool: ${pool.length} words. Examples present: ${need.every((w) => have.has(w)) ? "ALL" : "MISSING " + need.filter((w) => !have.has(w))}`);
console.log("Top:", pool.slice(0, 6).map((p) => `${p.word}(${p.playabilityScore}/${p.validSubwords}sw/${p.difficulty})`).join(", "));
console.log("Bottom:", pool.slice(-3).map((p) => `${p.word}(${p.playabilityScore}/${p.validSubwords}sw/${p.difficulty})`).join(", "));
