"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import { type RoomPlayer } from "@/lib/players";
import { AvatarArt } from "@/components/ui/AvatarArt";
import { Flame, Crown } from "lucide-react";

export function Leaderboard() {
  const { players, meId } = useGame();
  const ranked = [...players].sort((a, b) => b.score - a.score);

  const TOP_N = 6;
  const visible = ranked.slice(0, TOP_N);
  const myRank = ranked.findIndex((p) => p.id === meId) + 1; // 0 if somehow not found
  const me = myRank > TOP_N ? ranked[myRank - 1] : null;

  // Transient feedback: floating "+N" + row flash on score increases, and a
  // brief "Now Leading" indicator when the top spot changes.
  const [pulse, setPulse] = useState<Record<string, { delta: number; n: number }>>({});
  const [leadingId, setLeadingId] = useState<string | null>(null);
  const prevScores = useRef<Record<string, number>>({});
  const prevLeader = useRef<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const leader = sorted[0] && sorted[0].score > 0 ? sorted[0].id : null;

    const added: Record<string, { delta: number; n: number }> = {};
    for (const p of players) {
      const prev = prevScores.current[p.id];
      if (prev !== undefined && p.score > prev) {
        added[p.id] = { delta: p.score - prev, n: ++seq.current };
      }
      prevScores.current[p.id] = p.score;
    }
    if (Object.keys(added).length) {
      setPulse((cur) => ({ ...cur, ...added }));
      const ids = Object.keys(added);
      setTimeout(() => {
        setPulse((cur) => {
          const c = { ...cur };
          for (const id of ids) if (c[id]?.n === added[id].n) delete c[id];
          return c;
        });
      }, 1200);
    }

    if (leader && leader !== prevLeader.current) {
      prevLeader.current = leader;
      setLeadingId(leader);
      const id = leader;
      setTimeout(() => setLeadingId((cur) => (cur === id ? null : cur)), 2200);
    } else if (!leader) {
      prevLeader.current = null;
    }
  }, [players]);

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Leaderboard</h2>
        <span className="font-mono text-[11px] uppercase tracking-wide text-subtle">
          {players.length} in room
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative" style={{ height: visible.length * 60 }}>
          {visible.map((player: RoomPlayer, i) => {
            const rank = i + 1;
            const isYou = player.id === meId;
            const leader = rank === 1 && player.score > 0;
            const bump = pulse[player.id];
            const nowLeading = leadingId === player.id;
            return (
              <div
                key={player.id}
                className={`absolute left-0 right-0 flex items-center gap-3 rounded-2xl border-[1.5px] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-500 ${
                  isYou
                    ? "border-accent bg-accent-soft"
                    : "border-white/10 bg-white/[0.08]"
                } ${bump ? "ring-2 ring-success" : ""}`}
                style={{
                  transform: `translateY(${i * 60}px)`,
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <span
                  className={`w-4 text-center font-mono text-[15px] font-extrabold ${
                    leader ? "text-warning" : "text-subtle"
                  }`}
                >
                  {rank}
                </span>

                <span className="relative">
                  <span
                    className={`block rounded-[11px] ${leader ? "animate-avatar-glow" : ""}`}
                  >
                    <AvatarArt index={player.avatar} size={38} />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-foreground">
                      {isYou ? `${player.name} (you)` : player.name}
                    </span>
                    {leader && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-warning" fill="currentColor" />
                    )}
                    {nowLeading && (
                      <span className="animate-count-pop shrink-0 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#4A2D00]">
                        Leading
                      </span>
                    )}
                  </div>
                </div>

                <span className="relative font-mono text-[15px] font-extrabold tabular-nums text-foreground">
                  {player.score.toLocaleString()}
                  {bump && (
                    <span
                      key={bump.n}
                      className="animate-points-float absolute -top-3 right-0 font-mono text-[12px] font-extrabold text-success"
                    >
                      +{bump.delta}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pinned below the top 6 if you're not in it — so you're never just
            gone with no feedback at all, without cluttering the main ranked
            list with everyone. */}
        {me && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border-[1.5px] border-accent bg-accent-soft px-3 py-3">
            <span className="w-4 text-center font-mono text-[15px] font-extrabold text-subtle">
              {myRank}
            </span>
            <AvatarArt index={me.avatar} size={38} />
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm font-bold text-foreground">
                {me.name} (you)
              </span>
            </div>
            <span className="font-mono text-[15px] font-extrabold tabular-nums text-foreground">
              {me.score.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-line px-5 py-3">
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-subtle">
          <Flame className="h-3 w-3 text-warning" />
          Longer words score more
        </p>
      </div>
    </aside>
  );
}
