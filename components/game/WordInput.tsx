"use client";

import { useState } from "react";
import { CornerDownLeft, Loader2, AlertCircle } from "lucide-react";
import { useGame } from "./GameContext";
import { useAudio } from "@/components/audio/AudioProvider";

export function WordInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fx, setFx] = useState<"ok" | "err" | null>(null);
  const { submitWord, isValidating, isRoundActive, baseWord } = useGame();
  const { sfx } = useAudio();
  const wordLength = baseWord.length;

  const handleSubmit = async () => {
    if (!value.trim() || isValidating || !isRoundActive) return;
    const result = await submitWord(value);
    if (result.ok) {
      setValue("");
      setError(null);
      sfx("valid");
      setFx(null);
      requestAnimationFrame(() => setFx("ok"));
    } else if (result.error) {
      setError(result.error);
      const dup = /already (claimed|played)/i.test(result.error);
      sfx(dup ? "duplicate" : "invalid");
      setFx(null);
      requestAnimationFrame(() => setFx("err"));
    }
  };

  const disabled = isValidating || !value.trim() || !isRoundActive;

  return (
    <div className="border-t border-line bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div
            className={`group relative flex flex-1 items-center rounded-xl ${
              fx === "err" ? "animate-shake" : ""
            } ${fx === "ok" ? "animate-success-pulse" : ""}`}
            onAnimationEnd={() => setFx(null)}
          >
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={
                isRoundActive
                  ? "Type your guess…"
                  : "Round complete — next word incoming…"
              }
              autoComplete="off"
              spellCheck={false}
              disabled={!isRoundActive}
              aria-invalid={!!error}
              className={`w-full rounded-xl border bg-surface py-3 pl-4 pr-24 text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                error
                  ? "border-danger/60 focus:border-danger/60"
                  : "border-line focus:border-accent/50"
              }`}
            />
            <div className="pointer-events-none absolute right-3 flex items-center gap-2">
              <span className="font-mono text-[11px] text-subtle">
                {value.length}/{wordLength}
              </span>
              <kbd className="hidden items-center gap-1 rounded-md border border-line bg-elevated px-1.5 py-1 font-mono text-[10px] text-muted sm:flex">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
            </div>
          </div>
          <button
            type="button"
            data-no-sfx
            onClick={handleSubmit}
            disabled={disabled}
            className="flex min-w-[84px] items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white shadow-subtle transition-all hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Guess"
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 flex animate-fade-up items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
