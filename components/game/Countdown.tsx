"use client";

import { useEffect, useRef } from "react";
import { useGame } from "./GameContext";
import { useAudio } from "@/components/audio/AudioProvider";

export function Countdown() {
  const { round, totalRounds, baseWord, countdownLeft } = useGame();
  const { sfx } = useAudio();
  const letters = baseWord.toUpperCase().split("");

  // The final 3 seconds show 3-2-1; the extra lead second is the reveal beat.
  const showNumber = countdownLeft >= 1 && countdownLeft <= 3;
  const closing = countdownLeft <= 0;

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

      <div className="relative mx-4 w-full max-w-lg animate-fade-up rounded-3xl border border-line bg-surface/80 px-8 py-10 text-center shadow-elevated backdrop-blur-xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-subtle">
          Round {round} of {totalRounds}
        </p>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Your word
        </p>

        {/* Word — the focal point; letters reveal one by one */}
        <div className="mt-3 flex flex-nowrap items-center justify-center gap-1.5">
          {letters.map((ch, i) => (
            <span
              key={`${baseWord}-${i}`}
              className="tile flex h-12 w-10 shrink-0 animate-letter-in items-center justify-center text-2xl sm:h-14 sm:w-11 sm:text-3xl"
              style={{ animationDelay: `${i * 65}ms` }}
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
