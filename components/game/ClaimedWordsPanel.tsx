"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import { ListChecks, X } from "lucide-react";

export function ClaimedWordsPanel() {
  const { claimedWords } = useGame();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Newest first reads better in a live list.
  const words = [...claimedWords].reverse();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-no-sfx
        onClick={() => setOpen((o) => !o)}
        aria-label="Claimed words"
        className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        <ListChecks className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden font-mono text-xs sm:inline">Claimed</span>
        <span className="font-mono text-xs tabular-nums text-subtle">
          {claimedWords.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 animate-fade-up rounded-2xl border border-line bg-elevated/95 shadow-elevated backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Claimed this round
            </h3>
            <button
              type="button"
              data-no-sfx
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {words.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-subtle">
                No words claimed yet. Be the first!
              </p>
            ) : (
              <ul className="space-y-0.5">
                {words.map((w, i) => (
                  <li
                    key={`${w.word}-${i}`}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${
                      w.mine ? "bg-accent-soft" : ""
                    }`}
                  >
                    <span className="flex-1 truncate font-mono text-sm text-foreground">
                      {w.word.toUpperCase()}
                    </span>
                    <span className="truncate text-[11px] text-subtle">
                      {w.mine ? "you" : w.name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-accent">
                      +{w.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
