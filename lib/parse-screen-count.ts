/**
 * Parse the user or enhanced prompt for an explicit screen count.
 * Returns the number if the user said e.g. "5 screens", "generate 6 screens", "I want 2 screens".
 * Returns null if no explicit count was mentioned (then full app default applies).
 */
export function parseScreenCountFromPrompt(prompt: string): number | null {
  if (!prompt || typeof prompt !== "string") return null;
  const text = prompt.trim().toLowerCase();

  // Patterns that indicate an explicit screen count (order matters: more specific first)
  const patterns = [
    // "exactly 5 screens", "exactly 5 screen"
    /exactly\s+(\d+)\s*screens?/i,
    // "only 5 screens", "only 5 screen"
    /only\s+(\d+)\s*screens?/i,
    // "just 5 screens"
    /just\s+(\d+)\s*screens?/i,
    // "5 screens", "5 screen", "10 screens"
    /\b(\d+)\s*screens?\b/i,
    // "generate 5 screens", "create 6 screens", "design 2 screens"
    /(?:generate|create|design|make|build)\s+(?:only\s+)?(\d+)\s*screens?/i,
    // "I want 5 screens", "we need 6 screens"
    /(?:i\s+want|we\s+need|need\s+)(?:only\s+)?(\d+)\s*screens?/i,
    // "max 5 screens", "maximum 5 screens", "up to 5 screens"
    /(?:max(?:imum)?|up\s+to)\s+(\d+)\s*screens?/i,
    // "5 screens only"
    /\b(\d+)\s*screens?\s+only\b/i,
    // "single screen" or "one screen" -> 1
    /\b(?:single|one)\s+screen\b/i,
    // "two screens", "three screens" (optional, can add more)
    /\b(two)\s+screens?\b/i,
    /\b(three)\s+screens?\b/i,
    /\b(four)\s+screens?\b/i,
    /\b(five)\s+screens?\b/i,
    /\b(six)\s+screens?\b/i,
    /\b(seven)\s+screens?\b/i,
    /\b(eight)\s+screens?\b/i,
    /\b(nine)\s+screens?\b/i,
    /\b(ten)\s+screens?\b/i,
  ];

  const wordToNumber: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let num: number | undefined;
      if (match[1]) {
        num = /^\d+$/.test(match[1])
          ? parseInt(match[1], 10)
          : wordToNumber[match[1].toLowerCase()];
      } else if (/single|one/.test(pattern.source)) {
        num = 1;
      }
      if (num != null && Number.isInteger(num) && num >= 1) return num;
    }
  }

  return null;
}
