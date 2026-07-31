"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import { AvatarArt } from "@/components/ui/AvatarArt";
import { Confetti } from "@/components/ui/Confetti";
import {
  applyGameResult,
  type ProgressResult,
} from "@/lib/progression";
import type { RoomPlayer } from "@/lib/players";
import { Trophy, RotateCcw, Home, LogOut, Crown, Sparkles } from "lucide-react";
import { useAudio } from "@/components/audio/AudioProvider";
import { WordReview } from "./WordReview";

type Stat = { label: string; name: string; value: string };

function buildStats(players: RoomPlayer[]): Stat[] {
  if (players.length === 0) return [];
  const best = <T,>(pick: (p: RoomPlayer) => number) =>
    [...players].sort((a, b) => pick(b) - pick(a))[0];

  const topScore = best((p) => p.score);
  const longest = [...players].sort(
    (a, b) => (b.longestWord?.length ?? 0) - (a.longestWord?.length ?? 0),
  )[0];
  const combo = best((p) => p.bestCombo ?? 0);
  const words = best((p) => p.wordsValid ?? 0);
  const accurate = [...players].sort((a, b) => {
    const acc = (p: RoomPlayer) =>
      (p.wordsSubmitted ?? 0) > 0 ? (p.wordsValid ?? 0) / (p.wordsSubmitted ?? 1) : 0;
    return acc(b) - acc(a);
  })[0];
  const accVal = (p: RoomPlayer) =>
    (p.wordsSubmitted ?? 0) > 0
      ? Math.round(((p.wordsValid ?? 0) / (p.wordsSubmitted ?? 1)) * 100)
      : 0;

  return [
    { label: "Highest score", name: topScore.name, value: `${topScore.score}` },
    {
      label: "Longest word",
      name: longest.name,
      value: (longest.longestWord || "—").toUpperCase(),
    },
    { label: "Highest combo", name: combo.name, value: `${combo.bestCombo ?? 0}×` },
    { label: "Most words", name: words.name, value: `${words.wordsValid ?? 0}` },
    {
      label: "Most accurate",
      name: accurate.name,
      value: `${accVal(accurate)}%`,
    },
  ];
}

export function Results() {
  const { players, meId, isHost, gameId, myGameAwards, playAgain, returnToLobby, leaveRoom } =
    useGame();

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const stats = buildStats(players);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-[-8%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-warning/15 blur-[150px]" />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
        {/* Winner */}
        {winner && (
          <section className="relative animate-fade-up flex flex-col items-center overflow-hidden rounded-2xl border border-line bg-surface/70 p-8 text-center shadow-elevated backdrop-blur-xl">
            <Confetti />
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Trophy className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
              Winner
            </p>
            <div className="relative mt-4">
              <span className="block animate-avatar-glow rounded-[22px]">
                <AvatarArt index={winner.avatar} size={80} />
              </span>
              <Crown
                className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 text-warning"
                fill="currentColor"
              />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              🥇 {winner.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">
              {winner.score} points
            </p>
          </section>
        )}

        {/* Final leaderboard */}
        <section className="animate-fade-up rounded-2xl border border-line bg-surface/70 shadow-elevated backdrop-blur-xl">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">
              Final leaderboard
            </h2>
          </div>
          <div className="space-y-1 p-3">
            {ranked.map((p, i) => {
              const you = p.id === meId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    you
                      ? "border-accent/30 bg-accent-soft"
                      : "border-transparent"
                  }`}
                >
                  <span
                    className={`w-5 text-center font-mono text-sm ${
                      i === 0 ? "text-warning" : "text-subtle"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <AvatarArt index={p.avatar} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {you ? `${p.name} (you)` : p.name}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {p.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-line bg-surface/60 p-3.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
                {s.label}
              </p>
              <p className="mt-1 truncate font-mono text-base font-semibold text-foreground">
                {s.value}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">{s.name}</p>
            </div>
          ))}
        </section>

        {/* XP / level progression */}
        <ProgressReveal
          gameId={gameId}
          won={!!winner && winner.id === meId}
          score={players.find((p) => p.id === meId)?.score ?? 0}
          roundMvps={myGameAwards.mvps}
          awards={myGameAwards.awards}
        />

        {/* End-of-game Word Review */}
        <WordReview />

        {/* Actions */}
        <section className="flex flex-col gap-3 pb-2 sm:flex-row">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={playAgain}
                data-sfx="playAgain"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-glow transition-all hover:bg-accent-hover active:scale-[0.99]"
              >
                <RotateCcw className="h-4 w-4" />
                Play again
              </button>
              <button
                type="button"
                onClick={returnToLobby}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium text-foreground transition-colors hover:border-line-strong"
              >
                <Home className="h-4 w-4" />
                Return to lobby
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
              Waiting for host…
            </div>
          )}
          <button
            type="button"
            onClick={leaveRoom}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Leave room
          </button>
        </section>
      </main>
    </div>
  );
}

// Applies the finished game to the local profile exactly once per game, then
// animates the XP bar (and a level-up, if any). Persists via lib/progression.
const appliedGames = new Set<number>();

function ProgressReveal({
  gameId,
  won,
  score,
  roundMvps,
  awards,
}: {
  gameId: number;
  won: boolean;
  score: number;
  roundMvps: number;
  awards: number;
}) {
  const [result, setResult] = useState<ProgressResult | null>(null);
  const [width, setWidth] = useState(0);
  const [level, setLevel] = useState(1);
  const [leveled, setLeveled] = useState(false);
  const { sfx, toast } = useAudio();

  useEffect(() => {
    const key = gameId || -1;
    if (appliedGames.has(key)) return;
    appliedGames.add(key);
    const r = applyGameResult({ won, score, roundMvps, awards });
    setResult(r);
    setLevel(r.before.level);
    setWidth((r.before.intoLevel / r.before.span) * 100);

    const timers: ReturnType<typeof setTimeout>[] = [];
    // A few soft ticks as the stats/XP settle in.
    [0, 140, 280].forEach((d) =>
      timers.push(setTimeout(() => sfx("statsReveal"), 320 + d)),
    );
    timers.push(setTimeout(() => sfx("xp"), 340));
    timers.push(
      setTimeout(() => {
        if (r.leveledUp) {
          setWidth(100);
          timers.push(
            setTimeout(() => {
              setLevel(r.newLevel);
              setLeveled(true);
              setWidth(0);
              sfx("levelUp");
              toast({
                title: `Level ${r.newLevel}`,
                detail: r.title,
                tone: "gold",
              });
              timers.push(
                setTimeout(
                  () => setWidth((r.after.intoLevel / r.after.span) * 100),
                  80,
                ),
              );
            }, 700),
          );
        } else {
          setWidth((r.after.intoLevel / r.after.span) * 100);
        }
      }, 300),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) return null;

  return (
    <section className="animate-fade-up rounded-2xl border border-line bg-surface/70 p-5 shadow-elevated backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft font-mono text-xs font-bold text-accent">
            {level}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">{result.title}</p>
            <p className="text-[11px] text-subtle">Level {level}</p>
          </div>
          {leveled && (
            <span className="ml-1 flex animate-count-pop items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              <Sparkles className="h-3 w-3" />
              Level up
            </span>
          )}
        </div>
        <span className="font-mono text-sm font-semibold text-accent">
          +{result.gained} XP
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${width}%` }}
        />
      </div>

      {result.streak > 1 && (
        <p className="mt-2 text-[11px] text-muted">
          🔥 {result.streak} win streak
        </p>
      )}
    </section>
  );
}
