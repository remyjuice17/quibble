"use client";

import { useMemo, useState } from "react";
import { useGame } from "./GameContext";
import { AvatarArt } from "@/components/ui/AvatarArt";
import { Logo } from "@/components/ui/Logo";
import { SoundSettings } from "@/components/audio/SoundSettings";
import { HowToPlay } from "./HowToPlay";
import {
  Copy,
  Check,
  Link2,
  Share2,
  Users,
  Crown,
  LogOut,
  Play,
} from "lucide-react";

export function Lobby() {
  const {
    roomCode,
    players,
    meId,
    isHost,
    isReady,
    readyCount,
    toggleReady,
    startGame,
    leaveRoom,
  } = useGame();

  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/game?mode=join&code=${roomCode}`;
  }, [roomCode]);

  const copy = async (what: "code" | "link", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join my Quibble game",
          text: `Join my Quibble game — room code ${roomCode}`,
          url: inviteLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy("link", inviteLink);
    }
  };

  // Host first, then join order.
  const ordered = [...players].sort(
    (a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id),
  );
  const hostId = ordered[0]?.id;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/15 blur-[140px]" />

      {/* Top bar */}
      <header className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <SoundSettings />
          <button
            type="button"
            onClick={leaveRoom}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Leave
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-4 sm:px-6">
        {/* Room code + share */}
        <section className="animate-fade-up rounded-2xl border border-line bg-surface/70 p-6 text-center shadow-elevated backdrop-blur-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            Room code
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-foreground sm:text-5xl">
            {roomCode}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => copy("code", roomCode)}
              className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-line-strong"
            >
              {copied === "code" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy code
            </button>
            <button
              type="button"
              onClick={() => copy("link", inviteLink)}
              className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-line-strong"
            >
              {copied === "link" ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Copy invite link
            </button>
            <button
              type="button"
              onClick={share}
              className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-line-strong"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </section>

        {/* How to play */}
        <HowToPlay />

        {/* Players */}
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-surface/70 shadow-elevated backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-muted" />
              Players
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wide text-subtle">
              {readyCount} / {players.length} ready
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
            {ordered.map((p) => {
              const you = p.id === meId;
              const isRoomHost = p.id === hostId;
              return (
                <div
                  key={p.id}
                  className="flex animate-join-pop items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <AvatarArt index={p.avatar} size={36} />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {you ? `${p.name} (you)` : p.name}
                    </span>
                    {isRoomHost && (
                      <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                        <Crown className="h-2.5 w-2.5" fill="currentColor" />
                        Host
                      </span>
                    )}
                  </div>
                  {p.ready ? (
                    <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                      <Check className="h-3 w-3" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-[11px] text-subtle">Not ready</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-3 pb-2 sm:flex-row">
          <button
            type="button"
            onClick={toggleReady}
            data-sfx="ready"
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all active:scale-[0.99] ${
              isReady
                ? "border-success/40 bg-success/15 text-success"
                : "border-line bg-surface text-foreground hover:border-line-strong"
            }`}
          >
            <Check className="h-4 w-4" />
            {isReady ? "Ready ✓" : "Ready up"}
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              data-sfx="startGame"
              className="group flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-glow transition-all hover:bg-accent-hover active:scale-[0.99]"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Start Game
            </button>
          ) : (
            <div className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
              Waiting for host…
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
