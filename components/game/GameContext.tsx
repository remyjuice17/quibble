"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialMessages, type ChatMessage } from "@/lib/mockData";
import { generateBaseWord, scramble } from "@/lib/words";
import { loadDictionary, isValidWord, possibleWords, canFormFromLetters } from "@/lib/dictionary";
import {
  colorForName,
  initialsFor,
  scoreForWord,
  type RoomPlayer,
} from "@/lib/players";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { AVATAR_COUNT, pickAvatar } from "@/lib/avatars";
import {
  createRoomChannel,
  type RoomChannel,
  type StatePayload,
  type Status,
  type WordPayload,
} from "@/lib/room";

const ROUND_SECONDS = 60;
const INTERMISSION_SECONDS = 3;
const COUNTDOWN_SECONDS = 4;
const TOTAL_ROUNDS = 5;
const HEARTBEAT_MS = 2000;
// How long a (re)connecting client waits, with no local state, before it's
// allowed to conclude nobody else has state to share and seed a fresh lobby.
// Must comfortably exceed one heartbeat cycle plus real network round trips.
const REJOIN_GRACE_MS = 3000;
// A player who briefly drops out of presence (connection blip, tab hiccup)
// shouldn't visibly hand the "Host" crown to someone else and back a moment
// later — confusing for real users, even though nothing breaks either way.
// Someone only stops counting toward host election after being genuinely
// absent for this long.
const HOST_GRACE_MS = 3000;

export type { Status };
export type SubmitResult =
  | { ok: true; points: number }
  | { ok: false; error: string };

export type AwardWinner = {
  id: string;
  name: string;
  avatar: number;
};
export type RoundAwards = {
  round: number;
  mvp?: AwardWinner & { points: number };
  longest?: AwardWinner & { word: string };
  fastest?: AwardWinner & { ms: number };
};

type RoundAggEntry = {
  name: string;
  avatar: number;
  points: number;
  words: number;
  longestWord: string;
  fastestMs: number;
};
type RoundAgg = { round: number; byId: Map<string, RoundAggEntry> };

export type ClaimedWord = {
  word: string;
  name: string;
  avatar: number;
  points: number;
  mine: boolean;
};

export type RoundReview = {
  round: number;
  baseWord: string;
  possible: string[];
  found: { word: string; mine: boolean }[];
};

type GameContextValue = {
  // room / players
  roomCode: string;
  messages: ChatMessage[];
  players: RoomPlayer[];
  meId: string;
  connected: boolean;
  multiplayer: boolean;
  isHost: boolean;
  hostId: string | null;
  gameId: number;
  // status machine
  status: Status;
  round: number;
  totalRounds: number;
  baseWord: string;
  scrambled: string[];
  isRoundActive: boolean;
  secondsLeft: number;
  intermissionLeft: number;
  countdownLeft: number;
  roundSeconds: number;
  // lobby
  isReady: boolean;
  readyCount: number;
  toggleReady: () => void;
  startGame: () => void;
  // gameplay
  isValidating: boolean;
  submitWord: (raw: string) => Promise<SubmitResult>;
  combo: number;
  roundAwards: RoundAwards | null;
  myGameAwards: { mvps: number; awards: number };
  claimedWords: ClaimedWord[];
  gameReview: RoundReview[];
  // results
  playAgain: () => void;
  returnToLobby: () => void;
  endGame: () => void;
  leaveRoom: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used within <GameProvider>");
  return value;
}

function clock() {
  const d = new Date();
  return `${d.getMinutes()}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function makeId() {
  return "p-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export function GameProvider({
  roomCode,
  username,
  onLeave,
  rounds = TOTAL_ROUNDS,
  justCreated = false,
  children,
}: {
  roomCode: string;
  username: string;
  onLeave: () => void;
  rounds?: number;
  justCreated?: boolean;
  children: ReactNode;
}) {
  const multiplayer = isSupabaseConfigured();
  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;
  // Captured once; consumed (and cleared) on the very first successful
  // subscribe so it can never bypass the safety wait on a later reconnect.
  const justCreatedRef = useRef(justCreated);

  const meRef = useRef<RoomPlayer>({
    id: makeId(),
    name: username,
    color: colorForName(username),
    avatar: Math.floor(Math.random() * AVATAR_COUNT),
    score: 0,
    joinedAt: Date.now(),
    ready: false,
    wordsSubmitted: 0,
    wordsValid: 0,
    longestWord: "",
    combo: 0,
    bestCombo: 0,
  });

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [players, setPlayers] = useState<RoomPlayer[]>([meRef.current]);
  const [isValidating, setIsValidating] = useState(false);
  const [connected, setConnected] = useState(false);

  const [state, setState] = useState<StatePayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [intermissionLeft, setIntermissionLeft] = useState(INTERMISSION_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_SECONDS);
  const [combo, setCombo] = useState(0);
  const [roundAwards, setRoundAwards] = useState<RoundAwards | null>(null);
  const [myGameAwards, setMyGameAwards] = useState({ mvps: 0, awards: 0 });
  const [claimedWords, setClaimedWords] = useState<ClaimedWord[]>([]);
  const [gameReview, setGameReview] = useState<RoundReview[]>([]);
  const reviewRef = useRef<Map<number, RoundReview>>(new Map());
  const claimedWordsRef = useRef<ClaimedWord[]>([]);

  const channelRef = useRef<RoomChannel | null>(null);
  const subscribedRef = useRef(false);
  // Timestamp of this client's most recent successful subscribe — used to
  // give a (re)connecting client a grace window to hear the room's real
  // current state before it's allowed to conclude "nobody has ever seeded
  // this room" and start a fresh lobby. See REJOIN_GRACE_MS below.
  const subscribedAtRef = useRef<number | null>(null);
  const applyWordRef = useRef<((p: WordPayload) => void) | null>(null);
  const stateRef = useRef<StatePayload | null>(null);
  const clockOffsetRef = useRef(0); // host_time - my_time
  const lastHeartbeatRef = useRef(0);
  const gameIdRef = useRef(0);
  const resetAppliedRef = useRef(-1);
  // Wall-clock time we last actually received a "state" update (from anyone,
  // including our own broadcasts). The host resends at least every
  // HEARTBEAT_MS even with nothing new to say, so under normal conditions
  // this should never go stale for long — if it does, something's wrong
  // (most commonly: a mobile tab was backgrounded and its socket went quiet).
  // Used to detect and recover from that without the player having to reload.
  const lastStateReceivedAtRef = useRef(Date.now());
  // Bumping this forces the connect effect below to tear down and recreate
  // the channel — our one lever for "give up on this socket, reconnect".
  const [reconnectTick, setReconnectTick] = useState(0);
  const playedRef = useRef<Set<string>>(new Set());
  const claimedRef = useRef<Map<string, { id: string; claimedAt: number }>>(
    new Map(),
  );
  const myPendingRef = useRef<Set<string>>(new Set());
  const roundAggRef = useRef<RoundAgg | null>(null);
  const myGameAwardsRef = useRef({ mvps: 0, awards: 0 });
  const announcedStart = useRef<Set<string>>(new Set());
  const announcedEnd = useRef<Set<string>>(new Set());

  // Host election has a short memory (HOST_GRACE_MS): a player who's
  // genuinely still present but momentarily missing from a presence snapshot
  // keeps counting as "here" using their last-known record, so the crown
  // doesn't visibly flip to someone else and back on every small blip. This
  // is the SINGLE source of truth for who's host — exposed via context as
  // `hostId` so every component (the lobby's crown badge, etc.) reads the
  // same debounced answer instead of each re-deriving it independently.
  const lastSeenRef = useRef<Map<string, { player: RoomPlayer; seenAt: number }>>(
    new Map(),
  );
  useEffect(() => {
    const now = Date.now();
    for (const p of players) lastSeenRef.current.set(p.id, { player: p, seenAt: now });
  }, [players]);

  const [hostId, setHostId] = useState<string | null>(null);
  useEffect(() => {
    const recompute = () => {
      const now = Date.now();
      const presentIds = new Set(players.map((p) => p.id));
      const electorate = [
        ...players,
        ...Array.from(lastSeenRef.current.values())
          .filter(({ player, seenAt }) => !presentIds.has(player.id) && now - seenAt < HOST_GRACE_MS)
          .map(({ player }) => player),
      ];
      if (electorate.length === 0) {
        setHostId(null);
        return;
      }
      const winner = [...electorate].sort(
        (a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id),
      )[0];
      setHostId(winner.id);
    };
    recompute();
    const id = setInterval(recompute, 300);
    return () => clearInterval(id);
  }, [players]);

  const isHost = hostId === meRef.current.id;
  const isHostRef = useRef(isHost);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const pushSystem = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: "System",
        initials: "Q",
        color: "#5E6AD2",
        text,
        time: clock(),
        kind: "system",
      },
    ]);
  }, []);

  const track = useCallback(() => {
    channelRef.current?.track(meRef.current);
  }, []);

  const broadcastState = useCallback((payload: StatePayload) => {
    // Optimistic local apply prevents the host re-firing a transition before
    // its own broadcast echoes back.
    stateRef.current = payload;
    gameIdRef.current = payload.gameId;
    clockOffsetRef.current = 0;
    setState(payload);
    lastHeartbeatRef.current = Date.now();
    lastStateReceivedAtRef.current = Date.now();
    channelRef.current?.send({ type: "broadcast", event: "state", payload });
  }, []);

  // Reset local score/stats at the start of a new game (or on returning to
  // the lobby). Keyed by gameId so it runs exactly once per new game.
  const maybeResetForNewGame = useCallback((s: StatePayload) => {
    const isFreshLobby = s.status === "lobby";
    const isGameStart = s.status === "countdown" && s.round === 1;
    if (!isFreshLobby && !isGameStart) return;
    if (resetAppliedRef.current === s.gameId) return;
    resetAppliedRef.current = s.gameId;
    meRef.current = {
      ...meRef.current,
      score: 0,
      wordsSubmitted: 0,
      wordsValid: 0,
      longestWord: "",
      combo: 0,
      bestCombo: 0,
      ready: isFreshLobby ? false : meRef.current.ready,
    };
    track();
    setCombo(0);
    setRoundAwards(null);
    setMyGameAwards({ mvps: 0, awards: 0 });
    myGameAwardsRef.current = { mvps: 0, awards: 0 };
    roundAggRef.current = null;
    claimedRef.current = new Map();
    myPendingRef.current = new Set();
    claimedWordsRef.current = [];
    setClaimedWords([]);
    reviewRef.current = new Map();
    setGameReview([]);
  }, [track]);

  // Preload the local ENABLE dictionary so validation is instant once play
  // begins (no per-submission network requests).
  useEffect(() => {
    loadDictionary().catch(() => {
      /* retried lazily on first submit */
    });
  }, []);

  // --- Connect: presence + broadcast subscriptions ---
  useEffect(() => {
    const supabase = getSupabase();
    const channel = createRoomChannel(supabase, roomCode, meRef.current.id);
    channelRef.current = channel;

    const syncPlayers = () => {
      const st = channel.presenceState();
      const list = Object.values(st).flat().filter(Boolean) as RoomPlayer[];
      const byId = new Map<string, RoomPlayer>();
      for (const p of list) byId.set(p.id, p); // last write wins
      const next = Array.from(byId.values());
      setPlayers(next);

      // Keep avatars unique until all are used.
      const meId = meRef.current.id;
      const others = next.filter((p) => p.id !== meId);
      const mine = meRef.current.avatar;
      if (others.some((o) => o.avatar === mine && o.id < meId)) {
        const taken = new Set(others.map((o) => o.avatar));
        if (taken.size < AVATAR_COUNT) {
          meRef.current = { ...meRef.current, avatar: pickAvatar(taken) };
          channel.track(meRef.current);
        }
      }
    };

    channel.on("presence", { event: "sync" }, syncPlayers);
    channel.on("presence", { event: "join" }, () => {
      syncPlayers();
      // Host re-broadcasts current state so newcomers sync immediately.
      if (isHostRef.current && stateRef.current) {
        broadcastState({ ...stateRef.current, sentAt: Date.now() });
      }
    });
    channel.on("presence", { event: "leave" }, syncPlayers);

    channel.on("broadcast", { event: "state" }, (msg) => {
      const payload = msg.payload as StatePayload;
      clockOffsetRef.current = payload.sentAt - Date.now();
      stateRef.current = payload;
      gameIdRef.current = payload.gameId;
      lastStateReceivedAtRef.current = Date.now();
      setState(payload);
      maybeResetForNewGame(payload);
    });

    const applyWord = (p: WordPayload) => {
      const cur = stateRef.current;
      // Ignore stale broadcasts from a different round.
      if (cur && p.round !== cur.round) return;

      const key = p.word.toLowerCase();
      const existing = claimedRef.current.get(key);

      if (existing) {
        // Word already claimed this round → this submission is a duplicate.
        // First broadcast (server order) wins; a later one scores nothing.
        if (existing.id !== p.id && p.id === meRef.current.id) {
          // I lost the race — roll back my optimistic score for this word.
          meRef.current = {
            ...meRef.current,
            score: Math.max(0, meRef.current.score - p.points),
            wordsValid: Math.max(0, (meRef.current.wordsValid ?? 0) - 1),
          };
          track();
          pushSystem(
            `“${p.word.toUpperCase()}” was already claimed — someone found it first.`,
          );
        }
        return; // no chat, no panel, no double-count
      }

      // First valid claim of this word this round — record the winner.
      claimedRef.current.set(key, { id: p.id, claimedAt: p.claimedAt });

      // Aggregate round stats (every client computes identically).
      let agg = roundAggRef.current;
      if (!agg || agg.round !== p.round) {
        agg = { round: p.round, byId: new Map() };
        roundAggRef.current = agg;
      }
      const entries = Array.from(agg.byId.values());
      const wordsBefore = entries.reduce((s, e) => s + e.words, 0);
      const maxLenBefore = entries.reduce(
        (m, e) => Math.max(m, e.longestWord.length),
        0,
      );
      const isFirst = wordsBefore === 0;
      const isLongest = p.word.length > maxLenBefore;

      const e =
        agg.byId.get(p.id) ??
        {
          name: p.name,
          avatar: p.avatar,
          points: 0,
          words: 0,
          longestWord: "",
          fastestMs: Infinity,
        };
      e.points += p.points;
      e.words += 1;
      if (p.word.length > e.longestWord.length) e.longestWord = p.word;
      e.fastestMs = Math.min(e.fastestMs, p.elapsedMs);
      agg.byId.set(p.id, e);

      // Claimed-words panel (in claim order).
      const claim: ClaimedWord = {
        word: key,
        name: p.name,
        avatar: p.avatar,
        points: p.points,
        mine: p.id === meRef.current.id,
      };
      claimedWordsRef.current = [...claimedWordsRef.current, claim];
      setClaimedWords((prev) => [...prev, claim]);

      setMessages((prev) => [
        ...prev,
        {
          id: `w-${p.id}-${Date.now()}`,
          author: p.name,
          initials: initialsFor(p.name),
          color: p.color,
          avatar: p.avatar,
          text: p.word,
          time: clock(),
          kind: "guess",
          points: p.points,
          combo: p.combo,
          first: isFirst,
          longest: isLongest,
          mine: p.id === meRef.current.id,
        },
      ]);
    };
    applyWordRef.current = applyWord;
    channel.on("broadcast", { event: "word" }, (msg) =>
      applyWord(msg.payload as WordPayload),
    );

    channel.subscribe((sbStatus) => {
      if (sbStatus === "SUBSCRIBED") {
        subscribedRef.current = true;
        // Consume the "I just created this room" signal exactly once — a
        // genuinely brand-new room can seed immediately (nobody else could
        // possibly be in it yet); any later reconnect within this same
        // session goes through the normal grace window like everyone else.
        const bypassGrace = justCreatedRef.current;
        justCreatedRef.current = false;
        subscribedAtRef.current = bypassGrace ? 0 : Date.now();
        setConnected(true);
        const taken = new Set(
          (Object.values(channel.presenceState()).flat() as RoomPlayer[])
            .filter((p) => p && p.id !== meRef.current.id)
            .map((p) => p.avatar),
        );
        meRef.current = { ...meRef.current, avatar: pickAvatar(taken) };
        channel.track(meRef.current);
      }
    });

    return () => {
      subscribedRef.current = false;
      subscribedAtRef.current = null;
      channel.untrack();
      const sb = getSupabase();
      if (sb) sb.removeChannel(channel as never);
      channelRef.current = null;
    };
    // reconnectTick is intentionally a dependency: bumping it is how we force
    // a full reconnect (see the visibility-regain effect below). Everything
    // else this effect reads is either a ref or stable across the room's
    // lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, reconnectTick]);

  // --- Recover from a backgrounded tab going quiet ---
  // Mobile browsers routinely suspend a backgrounded tab's JS and let its
  // WebSocket go idle; nothing about coming back to the tab guarantees the
  // connection resumes on its own. Without this, a player who locks their
  // phone or switches apps mid-game can come back to a frozen round with no
  // way to recover except reloading. On regaining visibility we: (1) nudge —
  // re-track presence, which (via the existing "presence join → host
  // rebroadcasts" behavior above) is usually enough if the socket is still
  // alive; (2) if nothing fresh arrives shortly after, assume the socket
  // actually died and force a full reconnect.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const sinceVisible = Date.now();
      if (subscribedRef.current) channelRef.current?.track(meRef.current);
      setTimeout(() => {
        if (lastStateReceivedAtRef.current < sinceVisible) {
          setReconnectTick((n) => n + 1);
        }
      }, 4000);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // --- Host loop: only the host advances the status machine ---
  useEffect(() => {
    const id = setInterval(() => {
      if (!isHostRef.current || !subscribedRef.current) return;
      const now = Date.now();
      const s = stateRef.current;

      // No state yet → could be a genuinely brand-new room, OR this client
      // just (re)connected to an ONGOING game and simply hasn't heard the
      // current state yet (broadcasts aren't replayed to late subscribers).
      // This loop ticks every 250ms — far faster than the round trip needed
      // for another client to notice our presence "join" and re-broadcast
      // the real state back to us. Self-seeding immediately here would race
      // that round trip and can wipe an in-progress game for everyone the
      // moment any player's connection blips. So: wait a grace period after
      // subscribing — long enough to receive the existing game's state if
      // there is one — before concluding this room has truly never been
      // seeded and it's safe to start a fresh lobby ourselves.
      if (!s) {
        const since = subscribedAtRef.current ?? now;
        if (now - since < REJOIN_GRACE_MS) return;
        broadcastState({
          gameId: gameIdRef.current || now,
          status: "lobby",
          round: 0,
          totalRounds: roundsRef.current,
          baseWord: "",
          scrambled: [],
          endsAt: 0,
          sentAt: now,
        });
        return;
      }

      if (s.status === "lobby" || s.status === "finished") {
        // Idle — wait for a host action. Heartbeat so late joiners sync.
        if (now - lastHeartbeatRef.current > HEARTBEAT_MS) {
          broadcastState({ ...s, sentAt: now });
        }
        return;
      }

      if (s.status === "countdown" && now >= s.endsAt) {
        broadcastState({
          ...s,
          status: "playing",
          endsAt: now + ROUND_SECONDS * 1000,
          sentAt: now,
        });
      } else if (s.status === "playing" && now >= s.endsAt) {
        broadcastState({
          ...s,
          status: "complete",
          endsAt: now + INTERMISSION_SECONDS * 1000,
          sentAt: now,
        });
      } else if (s.status === "complete" && now >= s.endsAt) {
        if (s.round >= s.totalRounds) {
          broadcastState({ ...s, status: "finished", endsAt: 0, sentAt: now });
        } else {
          const w = generateBaseWord(s.baseWord);
          broadcastState({
            ...s,
            status: "countdown",
            round: s.round + 1,
            baseWord: w,
            scrambled: scramble(w),
            endsAt: now + COUNTDOWN_SECONDS * 1000,
            sentAt: now,
          });
        }
      } else if (now - lastHeartbeatRef.current > HEARTBEAT_MS) {
        broadcastState({ ...s, sentAt: now });
      }
    }, 250);
    return () => clearInterval(id);
  }, [broadcastState]);

  // --- Local countdown tick (all clients derive from endsAt + offset) ---
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      const now = Date.now() + clockOffsetRef.current;
      const secs = Math.max(0, Math.ceil((s.endsAt - now) / 1000));
      if (s.status === "playing") setSecondsLeft(secs);
      else if (s.status === "complete") setIntermissionLeft(secs);
      else if (s.status === "countdown") setCountdownLeft(secs);
    }, 150);
    return () => clearInterval(id);
  }, []);

  // --- Status-change side effects: reset dupes, announce round events ---
  useEffect(() => {
    if (!state) return;
    const tag = `${state.gameId}:${state.round}`;
    if (state.status === "playing") {
      playedRef.current = new Set();
      // Fresh, shared claimed-words list for the new round.
      claimedRef.current = new Map();
      myPendingRef.current = new Set();
      claimedWordsRef.current = [];
      setClaimedWords([]);
      // Word Review: compute every possible word for this round once, off the
      // timer path, so the end-of-game review is instant.
      if (!reviewRef.current.has(state.round)) {
        const rnd = state.round;
        const bw = state.baseWord;
        loadDictionary()
          .then(() => {
            if (!reviewRef.current.has(rnd)) {
              reviewRef.current.set(rnd, {
                round: rnd,
                baseWord: bw,
                possible: possibleWords(bw),
                found: [],
              });
            }
          })
          .catch(() => {});
      }
      if (!announcedStart.current.has(tag)) {
        announcedStart.current.add(tag);
        setSecondsLeft(ROUND_SECONDS);
        pushSystem(
          `Round ${state.round} of ${state.totalRounds} — ${state.baseWord.length} letters. Go!`,
        );
      }
    } else if (state.status === "complete") {
      if (!announcedEnd.current.has(tag)) {
        announcedEnd.current.add(tag);
        setIntermissionLeft(INTERMISSION_SECONDS);
        pushSystem(
          `Round ${state.round} complete — the word was “${state.baseWord}”.`,
        );

        // Word Review: record which of the possible words got found this round.
        const rv = reviewRef.current.get(state.round);
        if (rv) {
          rv.found = claimedWordsRef.current.map((c) => ({
            word: c.word,
            mine: c.mine,
          }));
        }
        setGameReview(
          Array.from(reviewRef.current.values()).sort((a, b) => a.round - b.round),
        );

        // Awards for the round just finished.
        const agg = roundAggRef.current;
        if (agg && agg.round === state.round && agg.byId.size > 0) {
          const rows = Array.from(agg.byId.entries());
          const win = <T,>(pick: (e: RoundAggEntry) => number) =>
            rows.reduce((a, b) => (pick(b[1]) > pick(a[1]) ? b : a));
          const mvpR = win((e) => e.points);
          const longR = win((e) => e.longestWord.length);
          const fastR = rows.reduce((a, b) =>
            b[1].fastestMs < a[1].fastestMs ? b : a,
          );
          const meIdNow = meRef.current.id;
          setRoundAwards({
            round: state.round,
            mvp: {
              id: mvpR[0],
              name: mvpR[1].name,
              avatar: mvpR[1].avatar,
              points: mvpR[1].points,
            },
            longest: longR[1].longestWord
              ? {
                  id: longR[0],
                  name: longR[1].name,
                  avatar: longR[1].avatar,
                  word: longR[1].longestWord,
                }
              : undefined,
            fastest: Number.isFinite(fastR[1].fastestMs)
              ? {
                  id: fastR[0],
                  name: fastR[1].name,
                  avatar: fastR[1].avatar,
                  ms: fastR[1].fastestMs,
                }
              : undefined,
          });
          // Tally the local player's awards for end-of-game XP.
          let mvps = 0;
          let awards = 0;
          if (mvpR[0] === meIdNow) mvps += 1;
          if (longR[1].longestWord && longR[0] === meIdNow) awards += 1;
          if (Number.isFinite(fastR[1].fastestMs) && fastR[0] === meIdNow)
            awards += 1;
          if (mvps || awards) {
            myGameAwardsRef.current = {
              mvps: myGameAwardsRef.current.mvps + mvps,
              awards: myGameAwardsRef.current.awards + awards,
            };
            setMyGameAwards(myGameAwardsRef.current);
          }
        } else {
          setRoundAwards({ round: state.round });
        }
      }
    } else if (state.status === "countdown") {
      setCountdownLeft(COUNTDOWN_SECONDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status, state?.round, state?.gameId, pushSystem]);

  // ---------- Host actions ----------
  const startGame = useCallback(() => {
    if (!isHostRef.current) return;
    const now = Date.now();
    const w = generateBaseWord();
    const payload: StatePayload = {
      gameId: now, // new game
      status: "countdown",
      round: 1,
      totalRounds: stateRef.current?.totalRounds ?? roundsRef.current,
      baseWord: w,
      scrambled: scramble(w),
      endsAt: now + COUNTDOWN_SECONDS * 1000,
      sentAt: now,
    };
    broadcastState(payload);
    // Apply the score/claimed-words/review reset locally right away — the
    // receive-side broadcast handler would eventually do this too, but only
    // once its self-echo arrives, which isn't always reliable (the same gap
    // that once made a player's own submitted word vanish). Whoever actually
    // clicks Play Again shouldn't have to wait on that.
    maybeResetForNewGame(payload);
  }, [broadcastState, maybeResetForNewGame]);

  const playAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  const returnToLobby = useCallback(() => {
    if (!isHostRef.current) return;
    const now = Date.now();
    const payload: StatePayload = {
      gameId: now,
      status: "lobby",
      round: 0,
      totalRounds: stateRef.current?.totalRounds ?? roundsRef.current,
      baseWord: "",
      scrambled: [],
      endsAt: 0,
      sentAt: now,
    };
    broadcastState(payload);
    maybeResetForNewGame(payload);
  }, [broadcastState, maybeResetForNewGame]);

  // End the game early (host). Finalizes the current round's Word Review, then
  // jumps everyone to the results screen; the winner is whoever leads on score.
  const endGame = useCallback(() => {
    if (!isHostRef.current) return;
    const now = Date.now();
    const s = stateRef.current;
    const rv = s ? reviewRef.current.get(s.round) : null;
    if (rv) {
      rv.found = claimedWordsRef.current.map((cw) => ({ word: cw.word, mine: cw.mine }));
      setGameReview(
        Array.from(reviewRef.current.values()).sort((a, b) => a.round - b.round),
      );
    }
    broadcastState({
      gameId: s?.gameId ?? now,
      status: "finished",
      round: s?.round ?? 1,
      totalRounds: s?.totalRounds ?? roundsRef.current,
      baseWord: s?.baseWord ?? "",
      scrambled: s?.scrambled ?? [],
      endsAt: 0,
      sentAt: now,
    });
  }, [broadcastState]);

  const toggleReady = useCallback(() => {
    meRef.current = { ...meRef.current, ready: !meRef.current.ready };
    track();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === meRef.current.id ? { ...p, ready: meRef.current.ready } : p,
      ),
    );
  }, [track]);

  // ---------- Gameplay ----------
  const submitWord = useCallback(
    async (raw: string): Promise<SubmitResult> => {
      const word = raw.trim();
      if (!word) return { ok: false, error: "" };

      const s = stateRef.current;
      if (!s || s.status !== "playing") {
        return { ok: false, error: "Round's over — next word coming up." };
      }
      if (!/^[a-zA-Z]+$/.test(word)) {
        return { ok: false, error: "Letters only — no spaces or symbols." };
      }
      const key = word.toLowerCase();

      // Already taken this round (by anyone) → don't rescore or re-broadcast.
      if (claimedRef.current.has(key) || myPendingRef.current.has(key)) {
        return { ok: false, error: "Already claimed — another player found that first." };
      }

      setIsValidating(true);
      try {
        // Local, instant validation against the ENABLE lexicon.
        await loadDictionary(); // resolves immediately once loaded
        const now = stateRef.current;
        if (!now || now.status !== "playing" || now.round !== s.round) {
          return { ok: false, error: "Round ended before that was checked." };
        }

        const attempts = (meRef.current.wordsSubmitted ?? 0) + 1;

        if (!canFormFromLetters(key, now.baseWord)) {
          meRef.current = {
            ...meRef.current,
            wordsSubmitted: attempts,
            combo: 0, // break the streak
          };
          track();
          setCombo(0);
          return { ok: false, error: "Those letters aren't in the word." };
        }

        if (!isValidWord(key)) {
          meRef.current = {
            ...meRef.current,
            wordsSubmitted: attempts,
            combo: 0, // break the streak
          };
          track();
          setCombo(0);
          return { ok: false, error: "Not a valid word." };
        }

        // Re-check the claim gate after validation.
        if (claimedRef.current.has(key)) {
          return { ok: false, error: "Already claimed — another player found that first." };
        }

        // Optimistically claim + score; the broadcast confirms the winner. If
        // another player's broadcast lands first (server order), the handler
        // rolls this back for us.
        myPendingRef.current.add(key);
        const points = scoreForWord(key);
        const combo = (meRef.current.combo ?? 0) + 1;
        const longest =
          key.length > (meRef.current.longestWord?.length ?? 0)
            ? key
            : meRef.current.longestWord ?? "";
        meRef.current = {
          ...meRef.current,
          score: meRef.current.score + points,
          wordsSubmitted: attempts,
          wordsValid: (meRef.current.wordsValid ?? 0) + 1,
          longestWord: longest,
          combo,
          bestCombo: Math.max(meRef.current.bestCombo ?? 0, combo),
        };
        track();
        setCombo(combo);

        const roundStartHost = now.endsAt - ROUND_SECONDS * 1000;
        const hostNow = Date.now() + clockOffsetRef.current;
        const elapsedMs = Math.max(0, hostNow - roundStartHost);

        const payload: WordPayload = {
          id: meRef.current.id,
          name: meRef.current.name,
          color: meRef.current.color,
          avatar: meRef.current.avatar,
          word: key,
          points,
          round: now.round,
          combo,
          elapsedMs,
          claimedAt: hostNow,
        };
        applyWordRef.current?.(payload);
        channelRef.current?.send({ type: "broadcast", event: "word", payload });

        return { ok: true, points };
      } finally {
        setIsValidating(false);
      }
    },
    [track],
  );

  const leaveRoom = useCallback(() => {
    channelRef.current?.untrack();
    const sb = getSupabase();
    if (sb && channelRef.current) sb.removeChannel(channelRef.current as never);
    onLeave();
  }, [onLeave]);

  const status: Status = state?.status ?? "lobby";
  const meNow = players.find((p) => p.id === meRef.current.id);
  const readyCount = players.filter((p) => p.ready).length;

  const value: GameContextValue = {
    roomCode,
    messages,
    players,
    meId: meRef.current.id,
    connected,
    multiplayer,
    isHost,
    hostId,
    gameId: state?.gameId ?? 0,
    status,
    round: state?.round ?? 0,
    totalRounds: state?.totalRounds ?? TOTAL_ROUNDS,
    baseWord: state?.baseWord ?? "",
    scrambled: state?.scrambled ?? [],
    isRoundActive: status === "playing",
    secondsLeft,
    intermissionLeft,
    countdownLeft,
    roundSeconds: ROUND_SECONDS,
    isReady: meNow?.ready ?? meRef.current.ready ?? false,
    readyCount,
    toggleReady,
    startGame,
    isValidating,
    submitWord,
    combo,
    roundAwards,
    myGameAwards,
    claimedWords,
    gameReview,
    playAgain,
    returnToLobby,
    endGame,
    leaveRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
