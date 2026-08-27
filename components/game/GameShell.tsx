"use client";

import { useEffect, useRef, useState } from "react";
import { TopNav } from "./TopNav";
import { ChatFeed } from "./ChatFeed";
import { Leaderboard } from "./Leaderboard";
import { WordInput } from "./WordInput";
import { RoundOverlay } from "./RoundOverlay";
import { ShuffleWord } from "./ShuffleWord";
import { useGame } from "./GameContext";
import { MessageSquare, Trophy } from "lucide-react";

export function GameShell() {
  const { players } = useGame();
  const [mobileTab, setMobileTab] = useState<"chat" | "leaderboard">("chat");

  // A subtle dot on the Leaderboard tab when scores change while you're
  // looking at Chat — below the lg breakpoint the leaderboard isn't visible
  // side-by-side, so without this a rank change could go completely unnoticed
  // until you happen to switch tabs.
  const [scoreChanged, setScoreChanged] = useState(false);
  const prevScores = useRef<Record<string, number>>({});
  useEffect(() => {
    let changed = false;
    for (const p of players) {
      if (prevScores.current[p.id] !== undefined && p.score !== prevScores.current[p.id]) {
        changed = true;
      }
      prevScores.current[p.id] = p.score;
    }
    if (changed && mobileTab !== "leaderboard") setScoreChanged(true);
  }, [players, mobileTab]);
  useEffect(() => {
    if (mobileTab === "leaderboard") setScoreChanged(false);
  }, [mobileTab]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <TopNav />

      {/* Focal point — the round's letters */}
      <div className="flex flex-col items-center border-b border-line bg-black/[0.14] px-4 py-4">
        <span className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-subtle">
          Unscramble these letters
        </span>
        <div className="flex max-w-full justify-center overflow-x-auto px-0.5">
          <ShuffleWord />
        </div>
      </div>

      {/* Mobile/tablet-portrait only: Chat and Leaderboard share the space
          via tabs instead of the leaderboard just being invisible below the
          lg breakpoint's side-by-side layout. */}
      <div className="flex border-b border-line lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${
            mobileTab === "chat"
              ? "border-b-2 border-accent text-foreground"
              : "border-b-2 border-transparent text-muted"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("leaderboard")}
          className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${
            mobileTab === "leaderboard"
              ? "border-b-2 border-accent text-foreground"
              : "border-b-2 border-transparent text-muted"
          }`}
        >
          <Trophy className="h-4 w-4" /> Leaderboard
          {scoreChanged && (
            <span className="absolute right-[28%] top-1.5 h-2 w-2 animate-count-pop rounded-full bg-success" />
          )}
        </button>
      </div>

      {/* Play area — RoundOverlay covers this region during intermission */}
      <div className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1400px]">
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Below lg: whichever tab is active. At lg+: always chat, the
                leaderboard has its own always-visible sidebar instead. */}
            <div className={`min-h-0 flex-1 overflow-hidden ${mobileTab === "leaderboard" ? "hidden lg:block" : ""}`}>
              <ChatFeed />
            </div>
            <div className={`min-h-0 flex-1 overflow-hidden lg:hidden ${mobileTab === "leaderboard" ? "" : "hidden"}`}>
              <Leaderboard />
            </div>
          </main>

          <div className="hidden w-[320px] shrink-0 border-l border-line-strong bg-black/20 lg:block">
            <Leaderboard />
          </div>
        </div>

        <RoundOverlay />
      </div>

      <WordInput />
    </div>
  );
}
