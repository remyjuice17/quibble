// Chat message shape used across the game. In multiplayer these arrive over
// Supabase broadcast; system lines are generated locally on round changes.
export type ChatMessage = {
  id: string;
  author: string;
  initials: string;
  color: string;
  avatar?: number;
  text: string;
  time: string;
  kind: "guess" | "message" | "system" | "correct";
  points?: number;
  combo?: number; // combo count when this word was played
  first?: boolean; // first valid word of the round
  longest?: boolean; // set a new round-longest at submission time
  mine?: boolean; // submitted by the local player
};

// The feed starts empty — real messages come from the room.
export const initialMessages: ChatMessage[] = [];
