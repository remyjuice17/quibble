"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useGame } from "./GameContext";
import { Timer, LogOut, Flame, Flag } from "lucide-react";
import { SoundSettings } from "@/components/audio/SoundSettings";
import { ClaimedWordsPanel } from "./ClaimedWordsPanel";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TopNav() {
  const { round, totalRounds, secondsLeft, isRoundActive, status, combo, roomCode, leaveRoom, isHost, endGame } =
    useGame();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const canEnd = isHost && status !== "lobby" && status !== "finished";

  const low = isRoundActive && secondsLeft <= 10;
  const timerColor = low ? "#FF5C6B" : "#43CE7A";
  const showCombo = status === "playing" && combo >= 2;
  const comboColor = combo >= 6 ? "#FFB43D" : combo >= 4 ? "#9B7BF5" : "#2FC259";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Left: brand + current (scrambled) base word */}
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <Logo href="/" />
        </div>

        {/* Right: round + timer + leave. overflow-x-auto is a safety net for
            the rare worst case (host, mid-round, active combo all at once on
            the smallest phones) — everything below is sized to avoid needing
            it in the common case. */}
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3">
          <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 sm:flex">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
              Room
            </span>
            <span className="font-mono text-sm tracking-wider text-foreground">
              {roomCode}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] border-line-strong bg-white/[0.12] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] sm:gap-2.5 sm:px-4 sm:py-2">
            <span className="hidden text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted sm:inline">
              Round
            </span>
            <span className="font-mono text-lg font-extrabold leading-none text-foreground sm:text-[22px]">
              {round}
              <span className="text-xs text-subtle sm:text-[15px]">/{totalRounds}</span>
            </span>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors sm:gap-2 sm:px-3"
            style={{
              borderColor: low ? "rgba(255,92,107,0.45)" : "rgba(255,255,255,0.14)",
              background: low ? "rgba(255,92,107,0.16)" : "rgba(255,255,255,0.10)",
            }}
          >
            <Timer className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: timerColor }} />
            <span
              className={`font-mono text-sm font-semibold tabular-nums ${
                isRoundActive ? "" : "text-muted"
              } ${low ? "animate-timer-pulse" : ""}`}
              style={{ color: isRoundActive ? "#FBFAFF" : undefined }}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>

          {showCombo && (
            <span
              key={combo}
              className="flex shrink-0 animate-count-pop items-center gap-1 rounded-lg border px-2 py-1.5 font-mono text-sm font-semibold tabular-nums sm:px-2.5"
              style={{
                color: comboColor,
                borderColor: `${comboColor}55`,
                background: `${comboColor}1f`,
              }}
              title={`${combo} in a row`}
            >
              <Flame className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: comboColor }} />
              ×{combo}
            </span>
          )}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ClaimedWordsPanel />
            <SoundSettings />

            {canEnd && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setConfirmEnd((v) => !v)}
                  data-testid="end-game-button"
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-danger/50 hover:text-danger sm:px-2.5"
                  aria-label="End game for everyone"
                  title="End game for everyone"
                >
                  <Flag className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">End game</span>
                </button>

                {/* Popover, not inline — so this rare, wide confirm state
                    never forces the whole header row to grow. */}
                {confirmEnd && (
                  <div className="absolute right-0 top-full z-40 mt-2 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-danger/40 bg-background p-1.5 shadow-elevated">
                    <span className="pl-1 text-xs font-semibold text-foreground">End game?</span>
                    <button
                      type="button"
                      onClick={() => { setConfirmEnd(false); endGame(); }}
                      data-testid="end-game-confirm"
                      className="rounded-md bg-danger px-2 py-1 text-xs font-bold text-white transition-transform active:scale-95"
                    >
                      End
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(false)}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={leaveRoom}
              data-testid="leave-button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-foreground"
              aria-label="Leave game"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
