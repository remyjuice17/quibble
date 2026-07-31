// Build the VALIDATION dictionary (public/dictionary.txt) from SCOWL.
//
// Medium vocabulary: SCOWL size tiers up to 60 (excludes the obscure 70+ tier),
// merged across English + British/American/Canadian/Australian variants so the
// game recognises common British and international English. Proper nouns,
// abbreviations, contractions and accented entries are dropped (a–z only).
//
// Requires the build-time devDependency `wordlist-english` (SCOWL data).
// Run: node scripts/build-dictionary.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dir = require.resolve("wordlist-english/package.json").replace(/package\.json$/, "");

const SIZES = [10, 20, 35, 40, 50, 55, 60];
const VARIANTS = ["english", "american", "british", "canadian", "australian"];

const set = new Set();
for (const v of VARIANTS) for (const s of SIZES) {
  const p = `${dir}${v}-words-${s}.json`;
  if (!fs.existsSync(p)) continue;
  for (const raw of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const w = String(raw).trim().toLowerCase();
    if (/^[a-z]+$/.test(w)) set.add(w);
  }
}
const words = [...set].sort();
fs.writeFileSync(new URL("../public/dictionary.txt", import.meta.url), words.join("\n") + "\n");
console.log(`Wrote public/dictionary.txt — ${words.length} SCOWL words (size <= 60).`);
