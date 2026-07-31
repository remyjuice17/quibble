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
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: brand + current (scrambled) base word */}
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/" />
        </div>

        {/* Right: round + timer + leave */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 sm:flex">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
              Room
            </span>
            <span className="font-mono text-sm tracking-wider text-foreground">
              {roomCode}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line-strong bg-white/[0.12] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Round
            </span>
            <span className="font-mono text-[22px] font-extrabold leading-none text-foreground">
              {round}
              <span className="text-[15px] text-subtle">/{totalRounds}</span>
            </span>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors"
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
              className="flex animate-count-pop items-center gap-1 rounded-lg border px-2.5 py-1.5 font-mono text-sm font-semibold tabular-nums"
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

          <ClaimedWordsPanel />
          <SoundSettings />

          {canEnd && (
            confirmEnd ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-1.5 py-1">
                <span className="pl-1 text-xs font-semibold text-foreground">End game?</span>
                <button
                  type="button"
                  onClick={() => { setConfirmEnd(false); endGame(); }}
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
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-danger/50 hover:text-danger"
                aria-label="End game for everyone"
                title="End game for everyone"
              >
                <Flag className="h-3.5 w-3.5" strokeWidth={2} /> End game
              </button>
            )
          )}

          <button
            type="button"
            onClick={leaveRoom}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-foreground"
            aria-label="Leave game"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
