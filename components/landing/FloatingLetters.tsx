// Small boxless letters that drift down like gentle snow, embedded softly into
// the background. Positions are static (not random) so server and client render
// identically — no hydration mismatch.
const LETTERS = [
  { ch: "Q", left: "6%", top: "18%", size: 30, rot: -12, op: 0.14, dur: 13, delay: -2 },
  { ch: "U", left: "16%", top: "62%", size: 22, rot: 8, op: 0.1, dur: 16, delay: -7, blur: true },
  { ch: "I", left: "27%", top: "34%", size: 18, rot: -6, op: 0.12, dur: 11, delay: -4 },
  { ch: "B", left: "38%", top: "78%", size: 34, rot: 14, op: 0.12, dur: 18, delay: -9, blur: true },
  { ch: "B", left: "49%", top: "12%", size: 20, rot: -10, op: 0.13, dur: 12, delay: -1 },
  { ch: "L", left: "58%", top: "52%", size: 26, rot: 6, op: 0.11, dur: 15, delay: -6 },
  { ch: "E", left: "69%", top: "28%", size: 32, rot: -14, op: 0.14, dur: 17, delay: -3, blur: true },
  { ch: "W", left: "78%", top: "68%", size: 22, rot: 10, op: 0.1, dur: 14, delay: -8 },
  { ch: "O", left: "88%", top: "22%", size: 28, rot: -8, op: 0.13, dur: 16, delay: -5 },
  { ch: "R", left: "93%", top: "56%", size: 24, rot: 12, op: 0.11, dur: 12, delay: -10, blur: true },
  { ch: "D", left: "10%", top: "88%", size: 26, rot: -6, op: 0.12, dur: 15, delay: -2 },
  { ch: "A", left: "44%", top: "42%", size: 18, rot: 8, op: 0.1, dur: 13, delay: -11 },
  { ch: "Z", left: "63%", top: "82%", size: 20, rot: -12, op: 0.11, dur: 17, delay: -4, blur: true },
  { ch: "K", left: "83%", top: "40%", size: 24, rot: 6, op: 0.12, dur: 14, delay: -6 },
];

export function FloatingLetters() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {LETTERS.map((l, i) => (
        <span
          key={i}
          className="absolute animate-letter-fall font-display font-extrabold text-white"
          style={{
            left: l.left,
            top: l.top,
            fontSize: l.size,
            opacity: l.op,
            filter: l.blur ? "blur(1.5px)" : undefined,
            // @ts-expect-error CSS custom property
            "--rot": `${l.rot}deg`,
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
          }}
        >
          {l.ch}
        </span>
      ))}
    </div>
  );
}
