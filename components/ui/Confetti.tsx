"use client";

import { useMemo } from "react";

const COLORS = ["#5E6AD2", "#F7F8F8", "#F2C94C"];

/**
 * A restrained, one-shot particle burst for the results screen. Sparse, low
 * opacity, monochrome-leaning; drifts rather than explodes. Renders nothing
 * when the user prefers reduced motion.
 */
export function Confetti({ count = 24 }: { count?: number }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const rand = (min: number, max: number) => min + Math.random() * (max - min);
        return {
          id: i,
          left: rand(2, 98),
          delay: rand(0, 350),
          duration: rand(900, 1500),
          size: rand(4, 8),
          tx: rand(-40, 40),
          fall: rand(220, 380),
          rot: rand(-220, 220),
          color: COLORS[i % COLORS.length],
          round: Math.random() > 0.5,
          opacity: rand(0.35, 0.8),
        };
      }),
    [count],
  );

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <style>{`
        @keyframes qb-confetti {
          0%   { transform: translate3d(0,-12px,0) rotate(0deg); opacity: var(--o); }
          10%  { opacity: var(--o); }
          100% { transform: translate3d(var(--tx), var(--fall), 0) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {bits.map((b) => (
        <span
          key={b.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            background: b.color,
            borderRadius: b.round ? "9999px" : "1px",
            // custom props consumed by the keyframe
            ["--tx" as string]: `${b.tx}px`,
            ["--fall" as string]: `${b.fall}px`,
            ["--rot" as string]: `${b.rot}deg`,
            ["--o" as string]: b.opacity,
            animation: `qb-confetti ${b.duration}ms cubic-bezier(0.16,1,0.3,1) ${b.delay}ms both`,
          }}
        />
      ))}
    </div>
  );
}
