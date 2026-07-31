"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Shuffle,
  Zap,
  Ruler,
  Flag,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SLIDES = [
  {
    icon: Shuffle,
    title: "Same letters, everyone",
    body: "Each round every player gets the same scrambled word to work from.",
  },
  {
    icon: Zap,
    title: "Spell fast",
    body: "Make as many valid words as you can from those letters before the timer runs out.",
  },
  {
    icon: Ruler,
    title: "Longer words score more",
    body: "Points scale with length — reach for the big ones, but quick short words add up.",
  },
  {
    icon: Flag,
    title: "First to claim wins it",
    body: "Each word can only be claimed once per round, so speed beats hesitation.",
  },
  {
    icon: Trophy,
    title: "Five rounds to the crown",
    body: "Chain combos, earn awards, and climb the leaderboard across five rounds.",
  },
];

const INTERVAL = 4500;

export function HowToPlay() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: number) => {
    setI((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused]);

  const slide = SLIDES[i];
  const Icon = slide.icon;

  return (
    <section
      className="animate-fade-up rounded-2xl border border-line bg-surface/70 p-5 shadow-elevated backdrop-blur-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="How to play"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
          How to play
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-no-sfx
            onClick={() => go(i - 1)}
            aria-label="Previous"
            className="flex h-6 w-6 items-center justify-center rounded-md text-subtle transition-colors hover:bg-elevated hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-no-sfx
            onClick={() => go(i + 1)}
            aria-label="Next"
            className="flex h-6 w-6 items-center justify-center rounded-md text-subtle transition-colors hover:bg-elevated hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Fixed height keeps the card steady as slides change */}
      <div className="flex min-h-[76px] items-start gap-4">
        <div
          key={`icon-${i}`}
          className="flex h-11 w-11 shrink-0 animate-fade-in items-center justify-center rounded-xl border border-accent/25 bg-accent-soft text-accent"
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div key={`text-${i}`} className="animate-fade-up">
          <h3 className="text-sm font-semibold text-foreground">{slide.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{slide.body}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {SLIDES.map((_, d) => (
          <button
            key={d}
            type="button"
            data-no-sfx
            onClick={() => go(d)}
            aria-label={`Go to slide ${d + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              d === i ? "w-5 bg-accent" : "w-1.5 bg-line-strong hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
