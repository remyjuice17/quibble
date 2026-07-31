"use client";

import { useEffect, useState } from "react";

const WORDS = ["QUIBBLE", "PUZZLE", "RIDDLE", "LETTERS", "GUESS"];

export function HeroWord() {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(WORDS[0].split(""));

  useEffect(() => {
    let raf = 0;
    let scrambleCount = 0;
    const target = WORDS[(index + 1) % WORDS.length];

    const hold = setTimeout(() => {
      const scramble = () => {
        scrambleCount++;
        const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const len = Math.max(target.length, display.length);
        const next = Array.from({ length: len }, (_, i) =>
          scrambleCount > 8 && i < target.length
            ? target[i]
            : pool[Math.floor(Math.random() * pool.length)],
        );
        setDisplay(next.slice(0, scrambleCount > 8 ? target.length : len));
        if (scrambleCount > 8) {
          setDisplay(target.split(""));
          setIndex((v) => (v + 1) % WORDS.length);
          return;
        }
        raf = window.setTimeout(scramble, 55);
      };
      scramble();
    }, 2200);

    return () => {
      clearTimeout(hold);
      clearTimeout(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {display.map((letter, i) => (
        <span
          key={i}
          className="tile flex h-14 w-12 items-center justify-center text-3xl sm:h-[74px] sm:w-[58px] sm:text-[40px]"
          style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
