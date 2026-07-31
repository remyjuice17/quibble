import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { HeroWord } from "@/components/landing/HeroWord";
import { FloatingLetters } from "@/components/landing/FloatingLetters";
import { ArrowRight, MessageSquare, Timer, Trophy } from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Fast rounds",
    body: "Short, timed rounds keep everyone on their toes. Jump in between meetings.",
  },
  {
    icon: MessageSquare,
    title: "Live chat",
    body: "Guess out loud, heckle politely, and celebrate together in a real-time feed.",
  },
  {
    icon: Trophy,
    title: "Team leaderboard",
    body: "Track who's on top across the game. Bragging rights included.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Ambient sky: clouds + soft drifting light */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute left-1/2 top-[-12%] h-[440px] w-[860px] -translate-x-1/2 rounded-full bg-badge/25 blur-[150px]" />
      <div className="pointer-events-none absolute left-[-6%] top-[30%] h-[220px] w-[560px] animate-cloud-drift rounded-full bg-white/10 blur-[34px]" />
      <div className="pointer-events-none absolute right-[-8%] top-[14%] h-[240px] w-[640px] animate-cloud-drift rounded-full bg-white/[0.08] blur-[40px] [animation-direction:alternate-reverse]" />
      <FloatingLetters />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1200px] flex-col px-6">
        {/* Top bar */}
        <nav className="flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {/* PLACEHOLDER count — wire to Supabase Presence before launch (see LAUNCH_NOTES.md) */}
            <span className="hidden items-center gap-2 rounded-full border border-line bg-white/[0.07] px-3 py-1.5 text-[13px] font-bold text-muted sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 [animation:timer-pulse_2s_ease-in-out_infinite]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              214 online
            </span>
            <Link href="/game?mode=create" className="btn-primary px-5 py-2.5 text-sm">
              Play now
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-6 animate-fade-in rounded-full border border-line-strong bg-white/[0.09] px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
            A word game for your team
          </span>

          <h1 className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Think fast.
            <br />
            Spell faster.
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base font-semibold leading-relaxed text-muted sm:text-lg">
            Quibble is a fast, friendly multiplayer word game built for the
            people you work with. Same room or half a world away.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/game?mode=create"
              className="btn-primary group px-8 py-4 text-[17px]"
            >
              Start playing
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/game?mode=join"
              className="rounded-full border-[1.5px] border-line bg-white/[0.08] px-7 py-4 text-sm font-bold text-foreground transition-colors hover:border-line-strong"
            >
              Join with a code
            </Link>
          </div>

          <div className="mt-16 w-full">
            <HeroWord />
          </div>
        </main>

        {/* Features */}
        <section id="how" className="border-t border-line py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-glass rounded-2xl p-6 transition-colors hover:border-line-strong"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <f.icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-line py-6 text-xs text-subtle sm:flex-row">
          <span>Quibble — a fast multiplayer word game for your team.</span>
          <span className="font-mono">v0.1.0</span>
        </footer>
      </div>
    </div>
  );
}
