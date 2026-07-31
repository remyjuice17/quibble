"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAudio,
  type AudioSettings,
  type MusicState,
  type SfxName,
} from "@/lib/audio/engine";

export type Toast = {
  id: string;
  title: string;
  detail?: string;
  tone?: "accent" | "gold";
};

type AudioContextValue = {
  settings: AudioSettings;
  setSettings: (s: Partial<AudioSettings>) => void;
  sfx: (name: SfxName, opts?: { intensity?: number }) => void;
  music: (state: MusicState) => void;
  toast: (t: Omit<Toast, "id">) => void;
  toasts: Toast[];
};

const Ctx = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used within <AudioProvider>");
  return v;
}

const STORAGE = "quibble:audio";
const DEFAULTS: AudioSettings = { sfxOn: true, musicOn: true, sfxVol: 0.7, musicVol: 0.5 };

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AudioSettings>(DEFAULTS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const engine = getAudio();

  // Load persisted settings and push them into the engine.
  useEffect(() => {
    let loaded = DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) loaded = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    setSettingsState(loaded);
    engine.setSettings(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSettings = useCallback(
    (s: Partial<AudioSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...s };
        engine.setSettings(next);
        try {
          localStorage.setItem(STORAGE, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [engine],
  );

  const sfx = useCallback(
    (name: SfxName, opts?: { intensity?: number }) => engine.sfx(name, opts),
    [engine],
  );
  const music = useCallback((state: MusicState) => engine.setMusic(state), [engine]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);

  // Unlock the AudioContext on the first user gesture (browser autoplay policy).
  useEffect(() => {
    const unlock = () => engine.unlock();
    const opts = { once: true } as AddEventListenerOptions;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [engine]);

  // Delegated navigation sounds: hover + click for any interactive element.
  // A button can opt into a specific cue with data-sfx="ready" etc., or opt
  // out entirely with data-no-sfx (e.g. the Guess button, which plays valid/
  // invalid instead).
  useEffect(() => {
    const interactive = (el: EventTarget | null) => {
      if (!(el instanceof Element)) return null;
      const node = el.closest("button, a, [role=button]") as HTMLElement | null;
      if (!node) return null;
      if (node.hasAttribute("data-no-sfx")) return null;
      if (node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true")
        return null;
      return node;
    };
    const onOver = (e: Event) => {
      if (interactive(e.target)) engine.sfx("hover");
    };
    const onClick = (e: Event) => {
      const node = interactive(e.target);
      if (!node) return;
      const cue = (node.dataset.sfx as SfxName) || "click";
      engine.sfx(cue);
    };
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [engine]);

  return (
    <Ctx.Provider value={{ settings, setSettings, sfx, music, toast, toasts }}>
      {children}
    </Ctx.Provider>
  );
}
