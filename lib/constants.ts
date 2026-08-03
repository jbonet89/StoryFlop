export const AVATARS = ["🦊", "🐼", "🐙", "🦁", "🐸", "🦄", "🐧", "🐨"] as const;
export const DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?", "☕"] as const;
export const REACTIONS = [
  { emoji: "😂", label: "laugh" }, { emoji: "🔥", label: "fire" }, { emoji: "👏", label: "applause" },
  { emoji: "🤔", label: "thinking" }, { emoji: "🎯", label: "target" }, { emoji: "☕", label: "coffee" },
  { emoji: "💩", label: "poop" }, { emoji: "🫏", label: "donkey" }, { emoji: "🐔", label: "chicken" },
  { emoji: "🧠", label: "brain" }, { emoji: "🏆", label: "trophy" }, { emoji: "🐸", label: "frog" },
  { emoji: "🦄", label: "unicorn" }, { emoji: "🍌", label: "banana" },
] as const;
export type VoteValue = (typeof DECK)[number];
