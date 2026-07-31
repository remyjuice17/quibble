"use client";

import { useGame } from "./GameContext";
import { AvatarArt } from "@/components/ui/AvatarArt";
import { CheckCircle2, Crown, Type, Zap } from "lucide-react";

export function RoundOverlay() {
  const { status, round, totalRounds, baseWord, players, meId, roundAwards } =
    useGame();
  if (status !== "complete") return null;

  const ranked = [...players].sort((a, b) => b.score - a.score).slice(0, 6);
  const awards = roundAwards && roundAwards.round === round ? roundAwards : null;
  const chips = awards
    ? [
        awards.longest && {
          key: "longest",
          icon: Type,
          label: "Longest",
          value: awards.longest.word.toUpperCase(),
          who: awards.longest.name,
        },
        awards.fastest && {
          key: "fastest",
          icon: Zap,
          label: "Fastest",
          value: `${(awards.fastest.ms / 1000).toFixed(1)}s`,
          who: awards.fastest.name,
        },
      ].filter(Boolean)
    : [];

  return (
    <div className="absolute inset-0 z-20 flex animate-fade-in items-center justify-center bg-background/75 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm animate-fade-up flex-col items-center rounded-2xl border border-line bg-elevated/95 p-6 text-center shadow-elevated">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
        </span>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
          Round {round} of {totalRounds} complete
        </h2>
        <p className="mt-1 text-sm text-muted">
          The word was{" "}
          <span className="font-mono word-outline">
            {baseWord.toUpperCase()}
          </span>
        </p>

        {/* Round MVP */}
        {awards?.mvp && (
          <div className="mt-4 flex w-full animate-fade-up items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2.5">
            <span className="relative">
              <AvatarArt index={awards.mvp.avatar} size={34} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-background">
                <Crown className="h-2.5 w-2.5" fill="currentColor" />
              </span>
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                Round MVP
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {awards.mvp.id === meId ? "You" : awards.mvp.name}
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-foreground">
              +{awards.mvp.points}
            </span>
          </div>
        )}

        {/* Award chips */}
        {chips.length > 0 && (
          <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
            {chips.map((ch) => {
              const C = ch!.icon;
              return (
                <span
                  key={ch!.key}
                  className="flex animate-count-pop items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5"
                >
                  <C className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
                    {ch!.label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ch!.value}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Updated leaderboard */}
        <div className="mt-4 w-full space-y-1">
          {ranked.map((p, i) => {
            const you = p.id === meId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 ${
                  you ? "border-accent/30 bg-accent-soft" : "border-transparent"
                }`}
              >
                <span
                  className={`w-4 text-center font-mono text-xs ${
                    i === 0 ? "text-warning" : "text-subtle"
                  }`}
                >
                  {i + 1}
                </span>
                <AvatarArt index={p.avatar} size={24} />
                <span className="min-w-0 flex-1 truncate text-left text-sm text-foreground">
                  {you ? `${p.name} (you)` : p.name}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {p.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-subtle">
          {round >= totalRounds ? "Final results coming up…" : "Next round starting…"}
        </p>
      </div>
    </div>
  );
}
