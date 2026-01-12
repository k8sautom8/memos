export const MEMO_CARD_BASE_CLASSES =
  "relative group flex flex-col justify-start items-start bg-card w-full px-4 py-3 mb-2 gap-2 text-card-foreground rounded-lg border border-border transition-all duration-300";

// Colorful gradient classes for memo cards
export const MEMO_CARD_GRADIENTS = [
  "memo-card-gradient-1",
  "memo-card-gradient-2",
  "memo-card-gradient-3",
  "memo-card-gradient-4",
  "memo-card-gradient-5",
] as const;

/**
 * Get a colorful gradient class for a memo card based on its index or ID
 */
export const getMemoCardGradient = (index: number | string): string => {
  const num = typeof index === "string" ? index.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : index;
  return MEMO_CARD_GRADIENTS[num % MEMO_CARD_GRADIENTS.length] || MEMO_CARD_GRADIENTS[0];
};

export const RELATIVE_TIME_THRESHOLD_MS = 1000 * 60 * 60 * 24;
