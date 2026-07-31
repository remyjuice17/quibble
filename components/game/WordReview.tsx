"use client";

import { useGame } from "./GameContext";
import { Check } from "lucide-react";

export function WordReview() {
  const { gameReview } = useGame();
  if (!gameReview || gameReview.length === 0) return null;

  return (
    <section className="animate-fade-up rounded-2xl border border-line bg-surface/70 shadow-elevated backdrop-blur-xl">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Word review</h2>
        <p className="mt-0.5 text-xs text-muted">
          Every word each round could have made — see what you missed.
        </p>
      </div>

      <div className="divide-y divide-line">
        {gameReview.map((rv) => {
          const foundSet = new Set(rv.found.map((f) => f.word));
          const mineSet = new Set(rv.found.filter((f) => f.mine).map((f) => f.word));
          const found = rv.possible.filter((w) => foundSet.has(w));
          const missed = rv.possible.filter((w) => !foundSet.has(w));
          const total = rv.possible.length;
          const pct = total ? Math.round((found.length / total) * 100) : 0;

          return (
            <div key={rv.round} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">
                    Round {rv.round}
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {rv.baseWord.toUpperCase()}
                  </span>
                </div>
                {total > 0 && (
                  <div className="flex items-center gap-3 font-mono text-[11px] text-subtle">
                    <span>
                      <span className="text-foreground">{total}</span> possible
                    </span>
                    <span>
                      <span className="text-success">{found.length}</span> found
                    </span>
                    <span>
                      <span className="text-foreground">{missed.length}</span> missed
                    </span>
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-accent">
                      {pct}%
                    </span>
                  </div>
                )}
              </div>

              {total === 0 ? (
                <p className="mt-3 text-xs text-subtle">
                  Word list wasn&apos;t ready for this round.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {found.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
                        Found
                      </p>
                      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                        {found.map((w) => {
                          const mine = mineSet.has(w);
                          return (
                            <span
                              key={w}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs ${
                                mine
                                  ? "bg-accent-soft text-accent ring-1 ring-accent/30"
                                  : "bg-elevated text-foreground/80"
                              }`}
                              title={mine ? "You found this" : "Found by the room"}
                            >
                              <Check className="h-3 w-3 text-success" />
                              {w}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
                      Missed words
                    </p>
                    {missed.length === 0 ? (
                      <p className="text-xs text-success">
                        Nothing missed — the room found them all.
                      </p>
                    ) : (
                      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                        {missed.map((w) => (
                          <span
                            key={w}
                            className="rounded-md bg-elevated/60 px-2 py-1 font-mono text-xs text-subtle"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
