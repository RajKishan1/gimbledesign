/**
 * Theme Matcher
 * 
 * Intelligently matches themes to product types and prompt context.
 * Ensures consistent theme selection based on the product/app type.
 */

import { THEME_LIST, ThemeType } from "./themes";

// Theme characteristics and best use cases
export interface ThemeMetadata {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  vibe: string[];  // Keywords describing the theme vibe
  bestFor: string[];  // Product types this theme excels at
  avoid: string[];  // Product types where this theme shouldn't be used
  primaryColor: string;  // Main color description
  style: string;  // Design style (minimal, bold, glassmorphic, etc.)
}

export const THEME_METADATA: ThemeMetadata[] = [
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    mode: "light",
    vibe: ["clean", "professional", "trustworthy", "calm"],
    bestFor: ["finance", "banking", "healthcare", "corporate", "saas", "productivity", "business"],
    avoid: ["gaming", "entertainment", "music"],
    primaryColor: "blue",
    style: "minimal"
  },
  {
    id: "netflix",
    name: "Netflix",
    mode: "dark",
    vibe: ["entertainment", "dramatic", "bold", "immersive"],
    bestFor: ["streaming", "entertainment", "video", "media", "movies", "tv shows", "content"],
    avoid: ["healthcare", "banking", "corporate"],
    primaryColor: "red",
    style: "bold"
  },
  {
    id: "acid-lime",
    name: "Acid Lime",
    mode: "dark",
    vibe: ["energetic", "modern", "tech", "edgy"],
    bestFor: ["fintech", "crypto", "trading", "tech startup", "developer tools", "ai"],
    avoid: ["healthcare", "children", "traditional"],
    primaryColor: "lime",
    style: "modern"
  },
  {
    id: "purple-yellow",
    name: "Purple & Yellow",
    mode: "light",
    vibe: ["creative", "playful", "premium", "bold"],
    bestFor: ["creative", "design", "marketing", "education", "learning"],
    avoid: ["finance", "healthcare"],
    primaryColor: "purple",
    style: "creative"
  },
  {
    id: "green-lime",
    name: "Green & Lime",
    mode: "light",
    vibe: ["fresh", "natural", "healthy", "eco"],
    bestFor: ["health", "fitness", "wellness", "food", "organic", "sustainability", "nature"],
    avoid: ["luxury", "gaming"],
    primaryColor: "green",
    style: "fresh"
  },
  {
    id: "teal-coral",
    name: "Teal & Coral",
    mode: "light",
    vibe: ["friendly", "warm", "approachable", "social"],
    bestFor: ["social", "dating", "community", "travel", "lifestyle", "vacation"],
    avoid: ["enterprise", "corporate"],
    primaryColor: "teal",
    style: "friendly"
  },
  {
    id: "lilac-teal",
    name: "Lilac & Teal",
    mode: "light",
    vibe: ["elegant", "feminine", "modern", "sophisticated"],
    bestFor: ["beauty", "fashion", "wellness", "meditation", "self-care", "lifestyle"],
    avoid: ["gaming", "sports", "masculine"],
    primaryColor: "purple",
    style: "elegant"
  },
  {
    id: "orange-gray",
    name: "Orange & Gray",
    mode: "light",
    vibe: ["energetic", "confident", "bold", "modern"],
    bestFor: ["sports", "fitness", "delivery", "logistics", "ecommerce", "food delivery"],
    avoid: ["meditation", "healthcare"],
    primaryColor: "orange",
    style: "energetic"
  },
  {
    id: "neo-brutalism",
    name: "Neo-Brutalism",
    mode: "dark",
    vibe: ["bold", "unconventional", "artistic", "striking"],
    bestFor: ["portfolio", "creative agency", "art", "music", "experimental", "design studio"],
    avoid: ["corporate", "healthcare", "finance", "traditional"],
    primaryColor: "coral",
    style: "brutalist"
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    mode: "dark",
    vibe: ["futuristic", "premium", "sleek", "modern"],
    bestFor: ["dashboard", "analytics", "ai", "smart home", "iot", "tech", "futuristic"],
    avoid: ["traditional", "elderly", "accessibility"],
    primaryColor: "gradient",
    style: "glassmorphic"
  },
  {
    id: "swiss-style",
    name: "Swiss Style",
    mode: "light",
    vibe: ["minimal", "clean", "professional", "classic"],
    bestFor: ["news", "magazine", "editorial", "typography", "blog", "reading", "documentation"],
    avoid: ["entertainment", "gaming", "children"],
    primaryColor: "red",
    style: "minimal-classic"
  },
  {
    id: "sunset",
    name: "Sunset",
    mode: "light",
    vibe: ["warm", "inviting", "energetic", "optimistic"],
    bestFor: ["food", "restaurant", "cooking", "recipe", "travel", "photography", "social"],
    avoid: ["corporate", "finance"],
    primaryColor: "orange",
    style: "warm"
  },
  {
    id: "ocean",
    name: "Ocean",
    mode: "light",
    vibe: ["calming", "professional", "trustworthy", "serene"],
    bestFor: ["meditation", "wellness", "spa", "water sports", "maritime", "relaxation"],
    avoid: ["gaming", "entertainment"],
    primaryColor: "cyan",
    style: "calming"
  },
  {
    id: "forest",
    name: "Forest",
    mode: "light",
    vibe: ["natural", "sustainable", "organic", "peaceful"],
    bestFor: ["eco", "sustainability", "nature", "outdoor", "hiking", "camping", "gardening"],
    avoid: ["urban", "nightlife"],
    primaryColor: "emerald",
    style: "natural"
  },
  {
    id: "lavender",
    name: "Lavender",
    mode: "light",
    vibe: ["gentle", "calming", "creative", "dreamy"],
    bestFor: ["sleep", "meditation", "journaling", "mental health", "therapy", "women"],
    avoid: ["sports", "gaming", "masculine"],
    primaryColor: "violet",
    style: "gentle"
  },
  {
    id: "monochrome",
    name: "Monochrome",
    mode: "light",
    vibe: ["sophisticated", "elegant", "timeless", "professional"],
    bestFor: ["portfolio", "photography", "luxury", "fashion", "minimal", "professional"],
    avoid: ["children", "playful"],
    primaryColor: "gray",
    style: "monochrome"
  },
  {
    id: "neon",
    name: "Neon",
    mode: "dark",
    vibe: ["exciting", "nightlife", "gaming", "cyberpunk"],
    bestFor: ["gaming", "esports", "nightclub", "music", "party", "nightlife"],
    avoid: ["healthcare", "corporate", "elderly", "children"],
    primaryColor: "magenta",
    style: "neon"
  },
  {
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    vibe: ["sophisticated", "sleek", "professional", "modern"],
    bestFor: ["saas", "dashboard", "analytics", "developer", "pro tools", "enterprise"],
    avoid: ["children", "playful"],
    primaryColor: "sky",
    style: "dark-professional"
  },
  {
    id: "peach",
    name: "Peach",
    mode: "light",
    vibe: ["soft", "friendly", "warm", "approachable"],
    bestFor: ["social", "dating", "community", "family", "children", "parenting"],
    avoid: ["corporate", "enterprise"],
    primaryColor: "orange",
    style: "soft"
  },
  {
    id: "glacier",
    name: "Glacier",
    mode: "light",
    vibe: ["cool", "refreshing", "clean", "modern"],
    bestFor: ["healthcare", "medical", "dental", "water", "tech", "saas"],
    avoid: ["warm", "cozy"],
    primaryColor: "cyan",
    style: "cool"
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    mode: "light",
    vibe: ["luxurious", "feminine", "elegant", "premium"],
    bestFor: ["beauty", "cosmetics", "jewelry", "wedding", "fashion", "luxury"],
    avoid: ["sports", "gaming", "masculine"],
    primaryColor: "rose",
    style: "luxurious"
  },
  {
    id: "cyber",
    name: "Cyber",
    mode: "dark",
    vibe: ["hacker", "matrix", "tech", "cyberpunk"],
    bestFor: ["security", "hacking", "crypto", "blockchain", "developer", "terminal"],
    avoid: ["healthcare", "children", "elderly"],
    primaryColor: "green-neon",
    style: "cyberpunk"
  }
];

/**
 * Extract keywords from prompt to understand product context
 */
function extractProductKeywords(prompt: string): string[] {
  const lowered = prompt.toLowerCase();
  
  // Product categories
  const categories = [
    // Finance
    { keywords: ["finance", "banking", "bank", "payment", "money", "budget", "invest", "stock", "trading", "crypto", "wallet"], category: "finance" },
    // Health & Fitness
    { keywords: ["health", "fitness", "workout", "gym", "exercise", "medical", "doctor", "hospital", "healthcare", "wellness", "meditation", "yoga", "sleep"], category: "health" },
    // Social & Communication
    { keywords: ["social", "chat", "message", "dating", "community", "friends", "network"], category: "social" },
    // Entertainment
    { keywords: ["entertainment", "music", "video", "streaming", "movie", "tv", "podcast", "gaming", "game"], category: "entertainment" },
    // E-commerce & Shopping
    { keywords: ["shop", "store", "ecommerce", "buy", "sell", "marketplace", "cart", "order"], category: "ecommerce" },
    // Food & Restaurant
    { keywords: ["food", "restaurant", "recipe", "cooking", "delivery", "meal", "diet", "nutrition"], category: "food" },
    // Travel & Transportation
    { keywords: ["travel", "flight", "hotel", "booking", "vacation", "trip", "transport", "ride", "taxi", "uber"], category: "travel" },
    // Productivity & Business
    { keywords: ["productivity", "task", "project", "todo", "note", "calendar", "schedule", "work", "business", "enterprise", "crm", "saas"], category: "productivity" },
    // Education & Learning
    { keywords: ["education", "learn", "course", "study", "school", "university", "tutor", "quiz"], category: "education" },
    // Creative & Design
    { keywords: ["creative", "design", "art", "photo", "camera", "edit", "portfolio"], category: "creative" },
    // News & Content
    { keywords: ["news", "article", "blog", "magazine", "read", "content"], category: "news" },
    // Technology & Developer
    { keywords: ["developer", "code", "programming", "api", "tech", "software", "ai", "machine learning"], category: "tech" },
    // Lifestyle & Fashion
    { keywords: ["fashion", "beauty", "cosmetic", "lifestyle", "style", "luxury"], category: "lifestyle" },
    // Kids & Family
    { keywords: ["kids", "children", "family", "parent", "baby"], category: "kids" },
    // Sports
    { keywords: ["sports", "football", "basketball", "soccer", "tennis", "running", "athlete"], category: "sports" }
  ];

  const found: string[] = [];
  
  for (const cat of categories) {
    if (cat.keywords.some(kw => lowered.includes(kw))) {
      found.push(cat.category);
    }
  }

  // Also extract specific keywords
  const specificKeywords: string[] = [];
  const allKeywords = categories.flatMap(c => c.keywords);
  for (const kw of allKeywords) {
    if (lowered.includes(kw)) {
      specificKeywords.push(kw);
    }
  }

  return [...found, ...specificKeywords];
}

/**
 * Calculate theme score based on prompt context
 */
function calculateThemeScore(theme: ThemeMetadata, keywords: string[], prompt: string): number {
  let score = 0;
  const loweredPrompt = prompt.toLowerCase();

  // Check bestFor matches
  for (const bestFor of theme.bestFor) {
    if (keywords.includes(bestFor) || loweredPrompt.includes(bestFor)) {
      score += 10;
    }
  }

  // Check vibe matches
  for (const vibe of theme.vibe) {
    if (loweredPrompt.includes(vibe)) {
      score += 5;
    }
  }

  // Check avoid (negative score)
  for (const avoid of theme.avoid) {
    if (keywords.includes(avoid) || loweredPrompt.includes(avoid)) {
      score -= 15;
    }
  }

  // Mode preference based on context
  const wantsDark = loweredPrompt.includes("dark") || loweredPrompt.includes("night") || 
                    loweredPrompt.includes("midnight") || loweredPrompt.includes("gaming") ||
                    loweredPrompt.includes("streaming");
  const wantsLight = loweredPrompt.includes("light") || loweredPrompt.includes("clean") ||
                     loweredPrompt.includes("minimal") || loweredPrompt.includes("bright");

  if (wantsDark && theme.mode === "dark") score += 5;
  if (wantsLight && theme.mode === "light") score += 5;
  if (wantsDark && theme.mode === "light") score -= 3;
  if (wantsLight && theme.mode === "dark") score -= 3;

  return score;
}

/**
 * Get recommended themes for a given prompt
 * Returns top 3 themes with scores
 */
export function getRecommendedThemes(prompt: string): Array<{ theme: ThemeMetadata; score: number }> {
  const keywords = extractProductKeywords(prompt);
  
  const scored = THEME_METADATA.map(theme => ({
    theme,
    score: calculateThemeScore(theme, keywords, prompt)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

/**
 * Get the best theme ID for a prompt
 */
export function getBestThemeForPrompt(prompt: string): string {
  const recommendations = getRecommendedThemes(prompt);
  
  if (recommendations.length > 0 && recommendations[0].score > 0) {
    return recommendations[0].theme.id;
  }

  // Default fallbacks based on common patterns
  const lowered = prompt.toLowerCase();
  
  if (lowered.includes("dark") || lowered.includes("night")) return "midnight";
  if (lowered.includes("professional") || lowered.includes("business")) return "ocean-breeze";
  if (lowered.includes("health") || lowered.includes("fitness")) return "green-lime";
  if (lowered.includes("social") || lowered.includes("dating")) return "teal-coral";
  
  // Ultimate fallback - ocean-breeze is a safe, professional choice
  return "ocean-breeze";
}

/**
 * Generate theme selection guidance for the AI analysis prompt
 */
export function generateThemeSelectionGuide(): string {
  const guide = THEME_METADATA.map(theme => {
    return `- **${theme.id}** (${theme.name}): ${theme.mode} mode, ${theme.style} style. Best for: ${theme.bestFor.slice(0, 5).join(", ")}. Avoid for: ${theme.avoid.slice(0, 3).join(", ")}.`;
  }).join("\n");

  return `
## INTELLIGENT THEME SELECTION GUIDE

Match the theme to the product type for authentic, professional results:

${guide}

### THEME SELECTION RULES:
1. **Finance/Banking apps**: Use ocean-breeze, glacier, or midnight (trustworthy blues)
2. **Health/Fitness apps**: Use green-lime, forest, or ocean (natural, healthy colors)
3. **Entertainment/Streaming**: Use netflix or neon (bold, immersive)
4. **Social/Dating apps**: Use teal-coral, peach, or lavender (warm, friendly)
5. **SaaS/Productivity**: Use midnight, ocean-breeze, or monochrome (professional)
6. **Gaming apps**: Use neon or cyber (exciting, energetic)
7. **E-commerce**: Use sunset, orange-gray, or ocean-breeze (trustworthy, inviting)
8. **Beauty/Fashion**: Use rose-gold, lavender, or lilac-teal (elegant, feminine)
9. **Food/Restaurant**: Use sunset or orange-gray (warm, appetizing)
10. **Meditation/Wellness**: Use ocean, lavender, or forest (calming, peaceful)

### CRITICAL: Avoid theme mismatches
- Don't use neon/cyber for healthcare
- Don't use lavender/rose-gold for sports apps
- Don't use netflix theme for banking apps
- Don't use playful themes for enterprise/corporate
`;
}

/**
 * Get the full theme object by ID
 */
export function getThemeById(themeId: string): ThemeType | undefined {
  return THEME_LIST.find(t => t.id === themeId);
}

/**
 * Get theme metadata by ID
 */
export function getThemeMetadata(themeId: string): ThemeMetadata | undefined {
  return THEME_METADATA.find(t => t.id === themeId);
}
