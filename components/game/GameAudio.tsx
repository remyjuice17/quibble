"use client";

import { useEffect, useRef } from "react";
import { useGame } from "./GameContext";
import { useAudio } from "@/components/audio/AudioProvider";

/**
 * Bridges game state → audio. Mounted once inside the provider tree; it owns no
 * UI. All cues are derived from transitions so gameplay code stays audio-free.
 */
export function GameAudio() {
  const {
    status,
    round,
    players,
    meId,
    secondsLeft,
    countdownLeft,
    combo,
  } = useGame();
  const { sfx, music, toast } = useAudio();

  const prev = useRef({
    status: "" as string,
    round: 0,
    count: -1,
    playerN: players.length,
    secs: 999,
    combo: 0,
    myLongest: 0,
    order: [] as string[],
    myRank: 99,
  });

  // Music + high-level status cues.
  useEffect(() => {
    const p = prev.current;
    if (status !== p.status) {
      if (status === "lobby") music("lobby");
      else if (status === "countdown") music("countdown");
      else if (status === "playing") {
        music(secondsLeft <= 10 ? "energetic" : "gameplay");
        // Round 1 gets the "Go!"; later rounds get a softer round-start.
        if (round <= 1) sfx("go");
        else sfx("roundStart");
      } else if (status === "complete") {
        sfx("timeUp");
        setTimeout(() => sfx("roundComplete"), 260);
      } else if (status === "finished") {
        music("winner");
        sfx("winner");
        setTimeout(() => sfx("confetti"), 180);
        setTimeout(() => music("results"), 2600);
      }
      p.status = status;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // New-round begins → reset round marker.
  useEffect(() => {
    prev.current.round = round;
  }, [round]);

  // Countdown ticks.
  useEffect(() => {
    const p = prev.current;
    if (status === "countdown" && countdownLeft !== p.count) {
      if (countdownLeft >= 1 && countdownLeft <= 3) sfx("tick");
      p.count = countdownLeft;
    }
    if (status !== "countdown") p.count = -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownLeft, status]);

  // Time warnings + energetic music switch in the last 10s.
  useEffect(() => {
    const p = prev.current;
    if (status === "playing") {
      if (secondsLeft === 10 && p.secs > 10) {
        sfx("t10");
        music("energetic");
      }
      if (secondsLeft === 5 && p.secs > 5) sfx("t5");
    }
    p.secs = secondsLeft;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, status]);

  // Players joining / leaving (lobby + in-game).
  useEffect(() => {
    const p = prev.current;
    if (players.length > p.playerN) sfx("playerJoin");
    else if (players.length < p.playerN) sfx("playerLeave");
    p.playerN = players.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  // Combo escalation + "On Fire" recognition.
  useEffect(() => {
    const p = prev.current;
    if (combo >= 2 && combo > p.combo) {
      sfx("combo", { intensity: combo - 2 });
      if (combo === 5) {
        sfx("badge");
        toast({ title: "On Fire", detail: "5 words in a row", tone: "gold" });
      }
    }
    if (combo === 0 && p.combo >= 3) sfx("streakBroken");
    p.combo = combo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo]);

  // Personal-best word (my longestWord grew during play).
  useEffect(() => {
    const me = players.find((pl) => pl.id === meId);
    const len = me?.longestWord?.length ?? 0;
    const p = prev.current;
    if (status === "playing" && len > p.myLongest && p.myLongest > 0) {
      sfx("personalBest");
      toast({ title: "Personal best", detail: (me?.longestWord ?? "").toUpperCase() });
    }
    p.myLongest = len;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, meId, status]);

  // Leaderboard movement.
  useEffect(() => {
    if (status !== "playing") return;
    const order = [...players].sort((a, b) => b.score - a.score).map((x) => x.id);
    const p = prev.current;
    const myRank = order.indexOf(meId);
    if (p.order.length) {
      if (myRank >= 0 && myRank < p.myRank) {
        if (myRank === 0 && p.myRank > 0) sfx("reachFirst");
        else sfx("rankUp");
      }
      // Someone other than me took over first place.
      if (order[0] !== p.order[0] && order[0] !== meId) sfx("overtake");
    }
    p.order = order;
    p.myRank = myRank;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, status, meId]);

  return null;
}
