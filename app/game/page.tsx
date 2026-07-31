import { Suspense } from "react";
import { RoomFlow } from "@/components/game/RoomFlow";

export default function GamePage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-background" />}>
      <RoomFlow />
    </Suspense>
  );
}
