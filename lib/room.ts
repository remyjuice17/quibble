import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoomPlayer } from "./players";

// Each room is its own realtime channel, keyed by a short join code.
export const ROOM_PREFIX = "quibble:room:";
export function roomChannelName(code: string): string {
  return ROOM_PREFIX + code.toUpperCase();
}

// Unambiguous alphabet (no 0/O, 1/I) for readable, shareable codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export type Status =
  | "lobby"
  | "countdown"
  | "playing"
  | "complete"
  | "finished";

// The single source of truth the host broadcasts to everyone.
export type StatePayload = {
  gameId: number; // bumps each new game so clients can reset scores
  status: Status;
  round: number;
  totalRounds: number;
  baseWord: string;
  scrambled: string[];
  endsAt: number; // host-clock timestamp when the current phase ends
  sentAt: number; // host Date.now() at broadcast (for clock-offset correction)
};

export type WordPayload = {
  id: string;
  name: string;
  color: string;
  avatar: number;
  word: string;
  points: number;
  round: number;
  combo: number; // submitter's combo count for this word
  elapsedMs: number; // ms from round start to submission (for fastest award)
  claimedAt: number; // host-clock timestamp of the claim (first wins)
};

// The subset of the Supabase channel API this app uses. The real Supabase
// channel already satisfies this; the LocalChannel below mimics it so the
// same game code runs in solo mode with no network.
export interface RoomChannel {
  on(
    type: "presence" | "broadcast",
    filter: { event: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb: (payload: any) => void,
  ): RoomChannel;
  subscribe(cb: (status: string) => void): RoomChannel;
  track(state: RoomPlayer): Promise<unknown>;
  untrack(): Promise<unknown>;
  send(msg: {
    type: "broadcast";
    event: string;
    payload: unknown;
  }): Promise<unknown> | void;
  presenceState(): Record<string, RoomPlayer[]>;
}

/** In-memory channel used when Supabase isn't configured (solo mode). */
class LocalChannel implements RoomChannel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Record<string, ((arg: any) => void)[]> = {};
  private me: RoomPlayer | null = null;
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  on(
    type: "presence" | "broadcast",
    filter: { event: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb: (payload: any) => void,
  ) {
    const k = `${type}:${filter.event}`;
    (this.handlers[k] ||= []).push(cb);
    return this;
  }

  subscribe(cb: (status: string) => void) {
    setTimeout(() => cb("SUBSCRIBED"), 0);
    return this;
  }

  async track(state: RoomPlayer) {
    this.me = state;
    (this.handlers["presence:sync"] || []).forEach((cb) => cb(undefined));
  }

  async untrack() {
    this.me = null;
  }

  send(msg: { type: "broadcast"; event: string; payload: unknown }) {
    // self:true behaviour — loop the broadcast straight back.
    (this.handlers[`broadcast:${msg.event}`] || []).forEach((cb) =>
      cb({ payload: msg.payload }),
    );
  }

  presenceState(): Record<string, RoomPlayer[]> {
    return this.me ? { [this.key]: [this.me] } : {};
  }
}

export function createRoomChannel(
  supabase: SupabaseClient | null,
  code: string,
  presenceKey: string,
): RoomChannel {
  if (!supabase) return new LocalChannel(presenceKey);
  return supabase.channel(roomChannelName(code), {
    config: {
      presence: { key: presenceKey },
      broadcast: { self: true },
    },
  }) as unknown as RoomChannel;
}
