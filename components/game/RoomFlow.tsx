"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameProvider } from "./GameContext";
import { RoomRouter } from "./RoomRouter";
import { Logo } from "@/components/ui/Logo";
import { generateRoomCode, normalizeCode } from "@/lib/room";
import { ArrowRight, ArrowLeft, Plus, LogIn, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

const SESSION_KEY = "quibble:session";

type Session = { code: string; username: string; rounds?: number };

export function RoomFlow() {
  const router = useRouter();
  const params = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // mode: create | join | (none → chooser)
  const mode = params.get("mode");
  const [code, setCode] = useState(() => normalizeCode(params.get("code") ?? ""));
  const [username, setUsername] = useState("");
  const [rounds, setRounds] = useState(5);
  const [joinStep, setJoinStep] = useState<"code" | "name">(
    normalizeCode(params.get("code") ?? "") ? "name" : "code",
  );
  const createdCode = useRef(generateRoomCode());
  // True only for the render immediately after THIS tab clicks "Create" —
  // never persisted, so a page reload (which remounts RoomFlow fresh) always
  // comes back false. Lets a genuinely brand-new room seed instantly, while
  // every reconnect/rejoin still safely waits to hear any existing game state
  // first (see REJOIN_GRACE_MS in GameContext).
  const justCreatedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Restore an in-progress session on refresh.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const enter = (s: Session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  };

  // "Play Again" moves everyone to a brand-new room code. Reusing
  // justCreatedRef here is deliberate and safe: for whichever client is
  // actually host in the new room, it correctly skips the reconnect-safety
  // wait (this genuinely is a fresh room nobody else could already be in);
  // for every other client, it's simply never checked, since only the host
  // ever consults it.
  const migrate = (newCode: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, code: newCode };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
    justCreatedRef.current = true;
  };

  const leave = () => {
    sessionStorage.removeItem(SESSION_KEY);
    // A hard navigation, not router.push. Clearing session causes this
    // component to immediately re-render its own "no session" fallback —
    // the create/join chooser — still at this same /game URL, a moment
    // before (or possibly instead of, if the soft navigation stalls or
    // loses a race) the page actually changes. That fallback flash is very
    // likely what "leave still shows the create room screen" actually is.
    // A hard reload sidesteps the whole category of timing/caching
    // subtlety: there's no intermediate view for anything to race against.
    window.location.href = "/";
  };

  if (!hydrated) return <div className="h-[100dvh] bg-background" />;

  if (session) {
    return (
      <GameProvider
        roomCode={session.code}
        username={session.username}
        rounds={session.rounds ?? 5}
        justCreated={justCreatedRef.current}
        onLeave={leave}
        onMigrate={migrate}
      >
        <RoomRouter />
      </GameProvider>
    );
  }

  const multiplayer = isSupabaseConfigured();

  const shell = (inner: React.ReactNode, sub?: string) => (
    <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <div className="rounded-2xl border border-line bg-surface/70 p-6 shadow-elevated backdrop-blur-xl">
          {inner}
        </div>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-subtle">
          <Users className="h-3.5 w-3.5" />
          {sub ??
            (multiplayer
              ? "No account needed — just a name"
              : "Solo mode — add Supabase keys for multiplayer")}
        </div>
      </div>
    </div>
  );

  const nameField = (
    <div className="mt-5">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
        Username
      </label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitName()}
        placeholder="e.g. amara"
        autoFocus
        autoComplete="off"
        maxLength={20}
        className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-accent/50 focus:outline-none"
      />
    </div>
  );

  function submitName() {
    const name = username.trim().slice(0, 20);
    if (!name) return;
    if (mode === "create") {
      justCreatedRef.current = true;
      enter({ code: createdCode.current, username: name, rounds });
    } else {
      const c = normalizeCode(code);
      if (c.length !== 6) {
        setError("Enter the full 6-character room code.");
        setJoinStep("code");
        return;
      }
      enter({ code: c, username: name });
    }
  }

  // --- Create ---
  if (mode === "create") {
    return shell(
      <>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Create a game
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pick a name — you&apos;ll be the host. We&apos;ll assign your avatar.
        </p>
        {nameField}
        <div className="mt-5">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
            Game length
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { r: 3, label: "Quick", sub: "3 rounds" },
              { r: 5, label: "Standard", sub: "5 rounds" },
              { r: 10, label: "Marathon", sub: "10 rounds" },
            ].map((o) => (
              <button
                key={o.r}
                type="button"
                onClick={() => setRounds(o.r)}
                aria-pressed={rounds === o.r}
                className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-all active:scale-[0.98] ${
                  rounds === o.r
                    ? "border-accent/60 bg-accent-soft text-foreground"
                    : "border-line bg-elevated text-muted hover:border-line-strong hover:text-foreground"
                }`}
              >
                <span className="text-sm font-medium">{o.label}</span>
                <span className="font-mono text-[10px] text-subtle">{o.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={submitName}
          disabled={!username.trim()}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white shadow-subtle transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Create game
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </>,
    );
  }

  // --- Join ---
  if (mode === "join") {
    if (joinStep === "code") {
      return shell(
        <>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Join a game
          </h1>
          <p className="mt-1 text-sm text-muted">Enter the room code.</p>
          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
              Room code
            </label>
            <input
              value={code}
              onChange={(e) => {
                setCode(normalizeCode(e.target.value));
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && normalizeCode(code).length === 6)
                  setJoinStep("name");
              }}
              placeholder="M7K4PX"
              autoFocus
              autoComplete="off"
              maxLength={6}
              className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] text-foreground placeholder:text-subtle/40 focus:border-accent/50 focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>
          <button
            type="button"
            onClick={() =>
              normalizeCode(code).length === 6
                ? setJoinStep("name")
                : setError("Enter the full 6-character room code.")
            }
            disabled={normalizeCode(code).length !== 6}
            className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white shadow-subtle transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
          >
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </>,
      );
    }
    return shell(
      <>
        <button
          type="button"
          onClick={() => setJoinStep("code")}
          className="mb-2 flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          {code}
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Almost there
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pick a name to join room {code}.
        </p>
        {nameField}
        <button
          type="button"
          onClick={submitName}
          disabled={!username.trim()}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white shadow-subtle transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
        >
          Join lobby
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </>,
    );
  }

  // --- Chooser fallback (no mode in URL) ---
  return shell(
    <>
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        Play Quibble
      </h1>
      <p className="mt-1 text-sm text-muted">Start a room or join one.</p>
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => router.push("/game?mode=create")}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white shadow-subtle transition-all hover:bg-accent-hover active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Create game
        </button>
        <button
          type="button"
          onClick={() => router.push("/game?mode=join")}
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-elevated py-3 text-sm font-medium text-foreground transition-colors hover:border-line-strong"
        >
          <LogIn className="h-4 w-4" />
          Join game
        </button>
      </div>
    </>,
  );
}
