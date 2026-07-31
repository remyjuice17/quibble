"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio } from "./AudioProvider";
import { Volume2, VolumeX, Music, X } from "lucide-react";

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-no-sfx
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? "bg-accent" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Slider({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round(value * 100)}
      disabled={disabled}
      data-no-sfx
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-accent disabled:opacity-40 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
    />
  );
}

export function SoundSettings({ align = "right" }: { align?: "right" | "left" }) {
  const { settings, setSettings, sfx } = useAudio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const anyOn = settings.sfxOn || settings.musicOn;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-no-sfx
        onClick={() => {
          setOpen((o) => !o);
          if (!open) sfx("modalOpen");
          else sfx("modalClose");
        }}
        aria-label="Sound settings"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-foreground"
      >
        {anyOn ? (
          <Volume2 className="h-4 w-4" strokeWidth={2} />
        ) : (
          <VolumeX className="h-4 w-4" strokeWidth={2} />
        )}
      </button>

      {open && (
        <div
          className={`absolute top-10 z-50 w-64 animate-fade-up rounded-2xl border border-line bg-elevated/95 p-4 shadow-elevated backdrop-blur-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Sound</h3>
            <button
              type="button"
              data-no-sfx
              onClick={() => {
                setOpen(false);
                sfx("modalClose");
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Volume2 className="h-3.5 w-3.5 text-muted" />
                Sound effects
              </span>
              <Toggle
                on={settings.sfxOn}
                onChange={(v) => {
                  setSettings({ sfxOn: v });
                  if (v) sfx("click");
                }}
              />
            </div>
            <Slider
              value={settings.sfxVol}
              disabled={!settings.sfxOn}
              onChange={(v) => setSettings({ sfxVol: v })}
            />

            <div className="h-px bg-line" />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Music className="h-3.5 w-3.5 text-muted" />
                Background music
              </span>
              <Toggle
                on={settings.musicOn}
                onChange={(v) => setSettings({ musicOn: v })}
              />
            </div>
            <Slider
              value={settings.musicVol}
              disabled={!settings.musicOn}
              onChange={(v) => setSettings({ musicVol: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
