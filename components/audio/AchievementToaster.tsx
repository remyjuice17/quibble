"use client";

import { useAudio } from "./AudioProvider";
import { Award, Sparkles } from "lucide-react";

export function AchievementToaster() {
  const { toasts } = useAudio();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[300px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => {
        const gold = t.tone === "gold";
        const Icon = gold ? Sparkles : Award;
        return (
          <div
            key={t.id}
            className="animate-toast-in flex items-center gap-3 rounded-xl border bg-elevated/95 px-3.5 py-3 shadow-elevated backdrop-blur-xl"
            style={{
              borderColor: gold ? "rgba(242,201,76,0.4)" : "rgba(94,106,210,0.35)",
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: gold ? "rgba(242,201,76,0.14)" : "rgba(94,106,210,0.14)",
                color: gold ? "#F2C94C" : "#5E6AD2",
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {t.title}
              </p>
              {t.detail && (
                <p className="truncate text-xs text-muted">{t.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
