"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import { useAudio } from "@/components/audio/AudioProvider";

export function Countdown() {
  const { round, totalRounds, baseWord, countdownLeft } = useGame();
  const { sfx } = useAudio();
  const letters = baseWord.toUpperCase().split("");

  // The final 3 seconds show 3-2-1; the extra lead second is the reveal beat.
  const showNumber = countdownLeft >= 1 && countdownLeft <= 3;
  const closing = countdownLeft <= 0;

  // The card is a fixed max-w-lg with px-8 padding + mx-4 outer margin — on a
  // narrow phone that leaves very little room, and this row previously used
  // one fixed tile size for every word length. A 9-10 letter word needed far
  // more width than a small phone has, and since the outer wrapper is
  // overflow-hidden (not scrollable), it just clipped past the card edge
  // instead of wrapping or scrolling. Size tiles from the actual available
  // width so any word length fits on any real screen.
  const [viewportW, setViewportW] = useState(390); // sensible default before mount
  useEffect(() => {
    const update = () => setViewportW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const cardPadding = viewportW < 640 ? 32 : 64; // px-4/px-8 * 2, roughly
  const outerMargin = 32; // mx-4 * 2
  const budget = Math.min(440, viewportW - outerMargin - cardPadding);
  const n = letters.length || 1;
  const gap = n > 8 ? 6 : 8;
  const tileW = Math.max(20, Math.min(52, Math.floor((budget - gap * (n - 1)) / n)));
  const tileH = Math.round(tileW * 1.22);
  const fontSize = Math.round(tileW * 0.58);

  // Stagger a soft blip per letter as the word is revealed (once per mount).
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    const timers = letters.map((_, i) =>
      setTimeout(() => sfx("letter"), i * 65),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/70 backdrop-blur-md transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[150px]" />

      <div className="relative mx-4 w-full max-w-lg animate-fade-up rounded-3xl border border-line bg-surface/80 px-4 py-10 text-center shadow-elevated backdrop-blur-xl sm:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-subtle">
          Round {round} of {totalRounds}
        </p>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Your word
        </p>

        {/* Word — the focal point; letters reveal one by one */}
        <div className="mt-3 flex flex-nowrap items-center justify-center" style={{ gap }}>
          {letters.map((ch, i) => (
            <span
              key={`${baseWord}-${i}`}
              className="tile flex shrink-0 animate-letter-in items-center justify-center"
              style={{
                width: tileW,
                height: tileH,
                fontSize,
                animationDelay: `${i * 65}ms`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">
          Create as many valid words as possible.
        </p>

        <div className="mx-auto mt-7 h-px w-16 bg-line" />

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Round begins in…
        </p>

        <div className="mt-3 flex h-16 items-center justify-center">
          {showNumber ? (
            <span
              key={countdownLeft}
              className="animate-count-pop font-mono text-6xl font-bold tabular-nums text-foreground"
            >
              {countdownLeft}
            </span>
          ) : (
            <span className="flex gap-1.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-timer-pulse rounded-full bg-muted"
                  style={{ animationDelay: `${d * 160}ms` }}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
