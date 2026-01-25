/**
 * Design System Extractor
 * 
 * Extracts key design patterns from generated HTML to create a compact
 * context summary instead of passing full HTML of all previous screens.
 * This reduces prompt size by ~90% while maintaining design consistency.
 */

export interface DesignSystemSummary {
  // Navigation patterns
  bottomNavigation?: string;
  sidebarNavigation?: string;
  headerPattern?: string;
  
  // Key component patterns (extracted snippets)
  cardPattern?: string;
  buttonPattern?: string;
  
  // Typography and spacing observations
  spacingScale: string;
  typographyNotes: string;
  
  // Color usage notes
  colorUsageNotes: string;
}

/**
 * Extracts the bottom navigation HTML from a screen if present
 */
function extractBottomNavigation(html: string): string | undefined {
  // Look for bottom navigation patterns (floating nav at bottom)
  const bottomNavPatterns = [
    // Floating bottom nav pattern
    /<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom[^"]*"[^>]*>[\s\S]*?(?:home|compass|user|profile|menu)[\s\S]*?<\/div>/gi,
    // Bottom navigation with specific classes
    /<(?:nav|div)[^>]*class="[^"]*(?:bottom-nav|bottom-bar|floating.*nav)[^"]*"[^>]*>[\s\S]*?<\/(?:nav|div)>/gi,
  ];

  for (const pattern of bottomNavPatterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 3000) { // Sanity check on size
      return match[0];
    }
  }
  
  return undefined;
}

/**
 * Extracts the sidebar navigation HTML from a screen if present
 */
function extractSidebarNavigation(html: string): string | undefined {
  // Look for sidebar patterns
  const sidebarPatterns = [
    /<(?:aside|nav|div)[^>]*class="[^"]*(?:fixed|sticky)[^"]*(?:left|w-64|w-60|w-56|sidebar)[^"]*"[^>]*>[\s\S]*?<\/(?:aside|nav|div)>/gi,
  ];

  for (const pattern of sidebarPatterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 5000) {
      return match[0];
    }
  }
  
  return undefined;
}

/**
 * Extracts header pattern from HTML
 */
function extractHeaderPattern(html: string): string | undefined {
  const headerPatterns = [
    /<(?:header|div)[^>]*class="[^"]*(?:sticky|fixed)[^"]*(?:top|header)[^"]*"[^>]*>[\s\S]*?<\/(?:header|div)>/gi,
  ];

  for (const pattern of headerPatterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 2000) {
      return match[0];
    }
  }
  
  return undefined;
}

/**
 * Extracts a representative card pattern
 */
function extractCardPattern(html: string): string | undefined {
  const cardPatterns = [
    /<div[^>]*class="[^"]*(?:bg-\[var\(--card\)\]|rounded-xl|rounded-2xl|shadow)[^"]*p-[46][^"]*"[^>]*>[\s\S]*?<\/div>/gi,
  ];

  for (const pattern of cardPatterns) {
    const matches = html.match(pattern);
    if (matches && matches[0] && matches[0].length < 1500) {
      return matches[0];
    }
  }
  
  return undefined;
}

/**
 * Analyzes spacing patterns used in the HTML
 */
function analyzeSpacing(html: string): string {
  const spacingClasses = html.match(/(?:p|m|gap|space)-(?:\d+|x|y)/g) || [];
  const uniqueSpacing = [...new Set(spacingClasses)].slice(0, 15);
  
  if (uniqueSpacing.length === 0) {
    return "Standard 4px scale: p-4, p-6, gap-4, gap-6";
  }
  
  return `Spacing classes used: ${uniqueSpacing.join(', ')}`;
}

/**
 * Analyzes typography patterns
 */
function analyzeTypography(html: string): string {
  const textClasses = html.match(/text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)/g) || [];
  const fontWeights = html.match(/font-(?:normal|medium|semibold|bold|black)/g) || [];
  
  const uniqueText = [...new Set(textClasses)].slice(0, 8);
  const uniqueWeights = [...new Set(fontWeights)].slice(0, 5);
  
  return `Typography: ${uniqueText.join(', ')}. Weights: ${uniqueWeights.join(', ')}`;
}

/**
 * Analyzes color usage patterns
 */
function analyzeColorUsage(html: string): string {
  const cssVarColors = html.match(/var\(--[a-z-]+\)/g) || [];
  const uniqueColors = [...new Set(cssVarColors)].slice(0, 10);
  
  return `CSS variables used: ${uniqueColors.join(', ')}`;
}

/**
 * Creates a compact design system summary from generated frames
 * This is used instead of full HTML context to reduce prompt size
 */
export function extractDesignSystem(frames: Array<{ title: string; htmlContent: string }>): DesignSystemSummary {
  if (frames.length === 0) {
    return {
      spacingScale: "Standard 4px scale",
      typographyNotes: "Standard typography hierarchy",
      colorUsageNotes: "Using theme CSS variables",
    };
  }

  // Extract patterns from the first few frames (they establish the design system)
  const firstFrame = frames[0];
  const secondFrame = frames[1];
  
  return {
    bottomNavigation: extractBottomNavigation(firstFrame.htmlContent) || 
                      (secondFrame && extractBottomNavigation(secondFrame.htmlContent)),
    sidebarNavigation: extractSidebarNavigation(firstFrame.htmlContent) ||
                       (secondFrame && extractSidebarNavigation(secondFrame.htmlContent)),
    headerPattern: extractHeaderPattern(firstFrame.htmlContent),
    cardPattern: extractCardPattern(firstFrame.htmlContent),
    spacingScale: analyzeSpacing(firstFrame.htmlContent),
    typographyNotes: analyzeTypography(firstFrame.htmlContent),
    colorUsageNotes: analyzeColorUsage(firstFrame.htmlContent),
  };
}

/**
 * Creates a compact context string for the LLM prompt
 * This replaces the full HTML of all previous screens
 */
export function createCompactContext(
  designSystem: DesignSystemSummary,
  recentFrames: Array<{ title: string; htmlContent: string }>,
  maxRecentFrames: number = 2
): string {
  const parts: string[] = [];
  
  // Add design system patterns
  parts.push("=== DESIGN SYSTEM PATTERNS (MUST REUSE EXACTLY) ===");
  
  if (designSystem.bottomNavigation) {
    parts.push("\n[BOTTOM NAVIGATION - Copy exactly for main app screens]:");
    parts.push(designSystem.bottomNavigation);
  }
  
  if (designSystem.sidebarNavigation) {
    parts.push("\n[SIDEBAR NAVIGATION - Copy exactly for all screens]:");
    parts.push(designSystem.sidebarNavigation);
  }
  
  if (designSystem.headerPattern) {
    parts.push("\n[HEADER PATTERN - Use similar structure]:");
    parts.push(designSystem.headerPattern);
  }
  
  parts.push(`\n[DESIGN TOKENS]:`);
  parts.push(`- ${designSystem.spacingScale}`);
  parts.push(`- ${designSystem.typographyNotes}`);
  parts.push(`- ${designSystem.colorUsageNotes}`);
  
  // Add only the most recent frames for immediate context
  if (recentFrames.length > 0) {
    const framesToInclude = recentFrames.slice(-maxRecentFrames);
    parts.push("\n=== RECENT SCREENS (for reference) ===");
    
    for (const frame of framesToInclude) {
      parts.push(`\n<!-- ${frame.title} -->`);
      // Truncate very long HTML to avoid bloating context
      const html = frame.htmlContent.length > 8000 
        ? frame.htmlContent.substring(0, 8000) + "\n<!-- ... truncated for brevity -->"
        : frame.htmlContent;
      parts.push(html);
    }
  }
  
  return parts.join("\n");
}

/**
 * Determines optimal batch size based on total screen count
 */
export function getOptimalBatchSize(totalScreens: number): number {
  if (totalScreens <= 3) return totalScreens;
  if (totalScreens <= 8) return 3;
  if (totalScreens <= 15) return 4;
  return 5; // For 15+ screens, use batches of 5
}

/**
 * Creates batches for parallel generation
 * First batch has no context, subsequent batches use design system context
 */
export function createGenerationBatches<T>(
  screens: T[],
  batchSize: number
): T[][] {
  const batches: T[][] = [];
  
  for (let i = 0; i < screens.length; i += batchSize) {
    batches.push(screens.slice(i, i + batchSize));
  }
  
  return batches;
}
