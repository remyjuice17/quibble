export type RoomPlayer = {
  id: string;
  name: string;
  color: string;
  avatar: number;
  score: number;
  joinedAt: number;
  ready?: boolean;
  // End-of-game stats (accumulated during play)
  wordsSubmitted?: number; // dictionary-checked attempts
  wordsValid?: number; // accepted words
  longestWord?: string;
  combo?: number; // current streak of consecutive valid words
  bestCombo?: number; // best streak this game
};

const PALETTE = [
  "#5E6AD2",
  "#4CB782",
  "#F2994A",
  "#BB6BD9",
  "#56CCF2",
  "#EB5757",
  "#F2C94C",
  "#2D9CDB",
  "#9B51E0",
  "#27AE60",
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/** Points for a valid word. Longer words are worth more. Tweak freely. */
export function scoreForWord(word: string): number {
  return word.length * 10;
}
