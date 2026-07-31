"use client";

import { TopNav } from "./TopNav";
import { ChatFeed } from "./ChatFeed";
import { Leaderboard } from "./Leaderboard";
import { WordInput } from "./WordInput";
import { RoundOverlay } from "./RoundOverlay";
import { ShuffleWord } from "./ShuffleWord";

export function GameShell() {
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

      {/* Play area — RoundOverlay covers this region during intermission */}
      <div className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1400px]">
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatFeed />
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
