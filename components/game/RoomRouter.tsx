"use client";

import { useGame } from "./GameContext";
import { Lobby } from "./Lobby";
import { Countdown } from "./Countdown";
import { GameShell } from "./GameShell";
import { Results } from "./Results";
import { GameAudio } from "./GameAudio";

export function RoomRouter() {
  const { status } = useGame();

  return (
    <>
      <GameAudio />
      <RoomScreen status={status} />
    </>
  );
}

function RoomScreen({ status }: { status: string }) {
  if (status === "lobby") return <Lobby />;
  if (status === "finished") return <Results />;
  if (status === "countdown") return <Countdown />;
  // "playing" and "complete" both use the gameplay shell
  return <GameShell />;
}
