"use client";

import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { useGame } from "./GameContext";
import { useAudio } from "@/components/audio/AudioProvider";

/**
 * Shows the round's letters with a Shuffle button. Shuffling is purely LOCAL
 * and cosmetic: it reorders how *this* player sees the letters (to spark new
 * word ideas) and never touches the synced base word or valid words. Letters
 * animate to their new slots via transform transitions.
 */
export function ShuffleWord() {
  const { scrambled, round, isRoundActive } = useGame();
  const { sfx } = useAudio();
  const [order, setOrder] = useState<number[]>([]);

  // Snap back to the synced order whenever the round's letters change.
  useEffect(() => {
    setOrder(scrambled.map((_, i) => i));
  }, [scrambled, round]);

  // Tiles are the thing you're actively trying to solve — sized to fit the
  // real viewport rather than relying purely on the horizontal-scroll
  // fallback (still present as a safety net) so longer words don't need
  // swiping sideways just to be seen in full on a phone.
  const [viewportW, setViewportW] = useState(390);
  useEffect(() => {
    const update = () => setViewportW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (scrambled.length === 0) return null;

  const shuffle = () => {
    setOrder((prev) => {
      if (prev.length < 2) return prev;
      let next = prev;
      for (let attempt = 0; attempt < 8; attempt++) {
        next = [...prev];
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        if (next.join() !== prev.join()) break;
      }
      return next;
    });
    sfx("shuffle");
  };

  const n = scrambled.length;
  // Reserve room for the shuffle button + its gap, and the stage's own
  // horizontal padding, so the budget reflects what's actually left for tiles.
  const budget = Math.min(460, viewportW - 32 - 48 - 16);
  const gap = n > 8 ? 6 : 8;
  const tileSize = Math.max(18, Math.min(48, Math.floor((budget - gap * (n - 1)) / n)));
  const fontSize = Math.round(tileSize * 0.5);
  const step = tileSize + gap;
  const width = n * step - gap;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width, height: tileSize }}>
        {scrambled.map((letter, i) => {
          const pos = order.indexOf(i);
          return (
            <span
              key={i}
              className="tile absolute top-0 flex items-center justify-center"
              style={{
                width: tileSize,
                height: tileSize,
                fontSize,
                transform: `translateX(${(pos < 0 ? i : pos) * step}px)`,
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>
      <button
        type="button"
        data-no-sfx
        onClick={shuffle}
        disabled={!isRoundActive}
        aria-label="Shuffle letters"
        title="Shuffle letters"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-line-strong bg-white/10 text-foreground transition-all hover:bg-white/20 active:scale-95 active:rotate-180 disabled:opacity-40"
      >
        <Shuffle className="h-5 w-5" />
      </button>
    </div>
  );
}
