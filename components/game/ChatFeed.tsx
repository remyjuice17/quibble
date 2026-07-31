"use client";

import { useEffect, useRef } from "react";
import { useGame } from "./GameContext";
import { AvatarArt } from "@/components/ui/AvatarArt";
import type { ChatMessage } from "@/lib/mockData";
import { Zap, Ruler } from "lucide-react";

function SystemLine({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-1.5">
      <span className="rounded-full border border-line bg-white/10 px-3.5 py-1 text-xs font-bold text-muted">
        {text}
      </span>
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const mine = !!msg.mine;
  const hasPoints = typeof msg.points === "number";
  const hasCombo = typeof msg.combo === "number" && msg.combo >= 2;
  return (
    <div
      className={`animate-message-in flex items-end gap-2.5 py-1.5 ${
        mine ? "flex-row-reverse" : ""
      }`}
    >
      <AvatarArt index={msg.avatar ?? 0} size={40} />

      <div
        className={`flex min-w-0 max-w-[88%] flex-col ${
          mine ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`mb-1 flex items-center gap-1.5 ${
            mine ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-[13px] font-extrabold text-foreground">
            {mine ? "You" : msg.author}
          </span>
          {msg.first && (
            <span className="flex animate-count-pop items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#4A2D00]">
              <Zap className="h-3 w-3" fill="currentColor" /> First
            </span>
          )}
          {msg.longest && (
            <span className="flex animate-count-pop items-center gap-1 rounded-full bg-badge px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              <Ruler className="h-3 w-3" /> Longest
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-2 border px-3 py-2 shadow-[0_4px_14px_rgba(20,10,45,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] ${
            mine
              ? "rounded-2xl rounded-br-md border-white/20 bg-gradient-to-b from-[#34AE6E] to-[#237A4C]"
              : "rounded-2xl rounded-bl-md border-line bg-gradient-to-b from-white/[0.14] to-white/[0.09]"
          }`}
        >
          <span className="break-words text-base font-extrabold tracking-[0.01em] text-white">
            {msg.text}
          </span>
          {hasPoints && (
            <span
              className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[13px] font-extrabold text-white ${
                mine ? "bg-black/25" : "bg-emerald"
              }`}
            >
              +{msg.points}
              {hasCombo && <span className="text-warning">×{msg.combo}</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatFeed() {
  const { messages, players } = useGame();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-extrabold text-foreground">Chat</h2>
        <span className="flex items-center gap-1.5 text-xs font-bold text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {players.length} online
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-[620px]">
          {messages.map((msg) =>
            msg.kind === "system" ? (
              <SystemLine key={msg.id} text={msg.text} />
            ) : (
              <Message key={msg.id} msg={msg} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
