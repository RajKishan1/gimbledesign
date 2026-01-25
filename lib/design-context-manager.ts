/**
 * Design Context Manager
 * 
 * Solves the "context drift" problem when generating 20+ screens.
 * Maintains high context fidelity through:
 * 
 * 1. Design DNA - Immutable foundational patterns from first 2-3 screens
 * 2. Component Library - Extracted reusable HTML snippets
 * 3. Screen Graph - Relationships between screens for navigation continuity
 * 4. Hierarchical Context - Global (unchanging) + Recent (last 2 screens)
 */

export interface DesignDNA {
  // Core visual identity (NEVER changes after extraction)
  theme: {
    id: string;
    primaryColor: string;
    accentUsage: string;
    gradientStyle: string | null;
    shadowStyle: string;
    borderRadius: string;
    glassEffect: boolean;
  };

  // Typography system (MUST be consistent)
  typography: {
    headingScale: string[];      // e.g., ["text-3xl font-bold", "text-2xl font-bold", "text-xl font-semibold"]
    bodyText: string;            // e.g., "text-base"
    caption: string;             // e.g., "text-sm text-[var(--muted-foreground)]"
    fontWeights: string[];       // Weights used
  };

  // Spacing system (MUST be consistent)  
  spacing: {
    scale: string[];             // e.g., ["p-2", "p-4", "p-6", "p-8"]
    cardPadding: string;         // e.g., "p-6"
    sectionGap: string;          // e.g., "gap-6"
    itemGap: string;             // e.g., "gap-4"
  };

  // Icon system
  icons: {
    library: string;             // "hugeicons"
    sizes: {
      small: string;             // "w-4 h-4"
      medium: string;            // "w-5 h-5"
      large: string;             // "w-6 h-6"
      hero: string;              // "w-8 h-8"
    };
    activeStyle: string;         // Active icon styling
    inactiveStyle: string;       // Inactive icon styling
  };
}

export interface ComponentLibrary {
  // Navigation components (COPY EXACTLY)
  bottomNavigation: {
    html: string;
    icons: string[];              // List of icon names used
    activeIndex: number;          // Which icon is active
    description: string;          // Brief description for context
  } | null;

  sidebarNavigation: {
    html: string;
    sections: string[];           // Section names
    description: string;
  } | null;

  header: {
    html: string;
    hasBackButton: boolean;
    hasUserAvatar: boolean;
    hasSearchIcon: boolean;
    hasNotificationIcon: boolean;
    description: string;
  } | null;

  // Reusable UI patterns
  cardPatterns: {
    name: string;
    html: string;
    usage: string;                // When to use this card
  }[];

  buttonPatterns: {
    primary: string;
    secondary: string;
    ghost: string;
    destructive: string;
  };

  inputPatterns: {
    default: string;
    withIcon: string;
    searchBar: string;
  };

  listItemPatterns: {
    simple: string;
    withAvatar: string;
    withIcon: string;
  }[];
}

export interface ScreenGraph {
  screens: {
    id: string;
    name: string;
    type: 'onboarding' | 'auth' | 'main' | 'detail' | 'settings' | 'modal';
    hasBottomNav: boolean;
    primaryNavItem: string | null;  // Which nav item this screen corresponds to
  }[];
  
  // Navigation flow
  mainScreens: string[];           // IDs of screens with bottom nav (main app screens)
  authFlow: string[];              // IDs of auth screens (no bottom nav)
  onboardingFlow: string[];        // IDs of onboarding screens (no bottom nav)
}

export interface DesignContext {
  dna: DesignDNA;
  components: ComponentLibrary;
  screenGraph: ScreenGraph;
  isInitialized: boolean;
  sourceScreenCount: number;       // How many screens were used to build this context
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract Design DNA from HTML content
 * This captures the foundational visual identity
 */
function extractDesignDNAFromHTML(html: string, themeId: string): Partial<DesignDNA> {
  // Extract typography patterns
  const headingPatterns = [
    ...new Set(
      (html.match(/text-(?:3xl|2xl|xl)\s+font-(?:bold|semibold|black)/g) || [])
    )
  ].slice(0, 4);

  const bodyPattern = html.match(/text-(?:base|sm)\s+(?:font-normal)?/)?.[0] || 'text-base';
  const captionPattern = html.match(/text-(?:xs|sm)\s+text-\[var\(--muted-foreground\)\]/)?.[0] || 'text-sm text-[var(--muted-foreground)]';
  
  const fontWeights = [...new Set(html.match(/font-(?:normal|medium|semibold|bold|black)/g) || [])];

  // Extract spacing patterns
  const paddingClasses = [...new Set(html.match(/p-\d+/g) || [])].sort();
  const gapClasses = [...new Set(html.match(/gap-\d+/g) || [])].sort();
  
  // Extract card padding (most common)
  const cardPaddingMatch = html.match(/bg-\[var\(--card\)\][^>]*class="[^"]*p-(\d+)/);
  const cardPadding = cardPaddingMatch ? `p-${cardPaddingMatch[1]}` : 'p-6';

  // Extract shadow style
  const shadowMatch = html.match(/shadow-(?:sm|md|lg|xl|2xl)/)?.[0] || 'shadow-lg';
  
  // Extract border radius
  const roundedMatch = html.match(/rounded-(?:lg|xl|2xl|3xl|full)/)?.[0] || 'rounded-xl';

  // Check for glass effect
  const hasGlass = /backdrop-blur/.test(html);

  // Check for gradient style
  const gradientMatch = html.match(/bg-gradient-to-[a-z]+\s+from-[^\s]+\s+to-[^\s]+/)?.[0];

  // Extract icon patterns
  const iconSizes = {
    small: html.match(/w-4\s+h-4/) ? 'w-4 h-4' : 'w-4 h-4',
    medium: html.match(/w-5\s+h-5/) ? 'w-5 h-5' : 'w-5 h-5',
    large: html.match(/w-6\s+h-6/) ? 'w-6 h-6' : 'w-6 h-6',
    hero: html.match(/w-8\s+h-8/) ? 'w-8 h-8' : 'w-8 h-8',
  };

  const activeIconStyle = html.match(/text-\[var\(--primary\)\][^"]*drop-shadow/)?.[0] || 
                          'text-[var(--primary)] drop-shadow-[0_0_4px_var(--primary)]';
  const inactiveIconStyle = 'text-[var(--muted-foreground)]';

  return {
    theme: {
      id: themeId,
      primaryColor: 'var(--primary)',
      accentUsage: 'subtle',
      gradientStyle: gradientMatch || null,
      shadowStyle: shadowMatch,
      borderRadius: roundedMatch,
      glassEffect: hasGlass,
    },
    typography: {
      headingScale: headingPatterns.length > 0 ? headingPatterns : ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-semibold'],
      bodyText: bodyPattern,
      caption: captionPattern,
      fontWeights,
    },
    spacing: {
      scale: paddingClasses.length > 0 ? paddingClasses : ['p-2', 'p-4', 'p-6', 'p-8'],
      cardPadding,
      sectionGap: gapClasses.find(g => parseInt(g.replace('gap-', '')) >= 6) || 'gap-6',
      itemGap: gapClasses.find(g => parseInt(g.replace('gap-', '')) >= 3 && parseInt(g.replace('gap-', '')) <= 4) || 'gap-4',
    },
    icons: {
      library: 'hugeicons',
      sizes: iconSizes,
      activeStyle: activeIconStyle,
      inactiveStyle: inactiveIconStyle,
    },
  };
}

/**
 * Extract bottom navigation component
 */
function extractBottomNav(html: string): ComponentLibrary['bottomNavigation'] {
  // Multiple patterns to catch different bottom nav styles
  const patterns = [
    // Floating bottom nav with fixed/absolute positioning
    /<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*(?:bottom-\d+|bottom-0)[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<\/div>\s*$|\s*$)/i,
    // Nav element at bottom
    /<nav[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom[^"]*"[^>]*>[\s\S]*?<\/nav>/i,
    // Bottom bar pattern
    /<div[^>]*class="[^"]*bottom-(?:bar|nav|navigation)[^"]*"[^>]*>[\s\S]*?<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 4000) {
      const navHtml = match[0];
      
      // Extract icon names from the navigation
      const iconMatches = navHtml.match(/hugeicons:[a-z0-9-]+/gi) || [];
      const icons = iconMatches.map(m => m.replace('hugeicons:', ''));
      
      // Try to determine which icon is active
      const activeIndex = navHtml.indexOf('var(--primary)') > -1 
        ? Math.floor(icons.length / 2) // Default to middle if can't determine
        : 0;

      return {
        html: navHtml,
        icons,
        activeIndex,
        description: `Floating bottom navigation with ${icons.length} items: ${icons.join(', ')}`,
      };
    }
  }

  return null;
}

/**
 * Extract header component
 */
function extractHeader(html: string): ComponentLibrary['header'] {
  const patterns = [
    // Sticky/fixed header
    /<(?:header|div)[^>]*class="[^"]*(?:sticky|fixed)[^"]*(?:top-0|top-\d+)[^"]*"[^>]*>[\s\S]*?<\/(?:header|div)>/i,
    // Header with specific classes
    /<header[^>]*>[\s\S]*?<\/header>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 3000) {
      const headerHtml = match[0];
      
      return {
        html: headerHtml,
        hasBackButton: /arrow-left|chevron-left|back/.test(headerHtml),
        hasUserAvatar: /pravatar\.cc|avatar|profile/.test(headerHtml),
        hasSearchIcon: /search/.test(headerHtml),
        hasNotificationIcon: /notification|bell/.test(headerHtml),
        description: 'Sticky header with glassmorphism effect',
      };
    }
  }

  return null;
}

/**
 * Extract sidebar navigation (for web)
 */
function extractSidebar(html: string): ComponentLibrary['sidebarNavigation'] {
  const pattern = /<(?:aside|nav|div)[^>]*class="[^"]*(?:w-64|w-60|w-56|sidebar|fixed\s+left)[^"]*"[^>]*>[\s\S]*?<\/(?:aside|nav|div)>/i;
  
  const match = html.match(pattern);
  if (match && match[0].length < 6000) {
    // Extract section names
    const sectionMatches = match[0].match(/(?:text-xs|text-sm)[^>]*font-(?:medium|semibold)[^>]*>([^<]+)</gi) || [];
    const sections = sectionMatches.map(s => s.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    
    return {
      html: match[0],
      sections,
      description: `Sidebar navigation with sections: ${sections.join(', ')}`,
    };
  }

  return null;
}

/**
 * Extract card patterns
 */
function extractCardPatterns(html: string): ComponentLibrary['cardPatterns'] {
  const patterns: ComponentLibrary['cardPatterns'] = [];
  
  // Look for card-like elements
  const cardRegex = /<div[^>]*class="[^"]*bg-\[var\(--card\)\][^"]*rounded[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
  const matches = html.match(cardRegex) || [];
  
  // Take unique patterns (by length to approximate uniqueness)
  const seen = new Set<number>();
  for (const match of matches) {
    if (match.length < 2500 && !seen.has(Math.floor(match.length / 100))) {
      seen.add(Math.floor(match.length / 100));
      patterns.push({
        name: `card-${patterns.length + 1}`,
        html: match,
        usage: 'General purpose card component',
      });
      if (patterns.length >= 3) break;
    }
  }

  return patterns;
}

/**
 * Extract button patterns
 */
function extractButtonPatterns(html: string): ComponentLibrary['buttonPatterns'] {
  // Find primary button pattern
  const primaryMatch = html.match(/<button[^>]*class="[^"]*bg-\[var\(--primary\)\][^"]*"[^>]*>[\s\S]*?<\/button>/i);
  const primary = primaryMatch?.[0] || 
    '<button class="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium">Button</button>';

  // Secondary
  const secondaryMatch = html.match(/<button[^>]*class="[^"]*(?:bg-\[var\(--secondary\)\]|bg-\[var\(--accent\)\])[^"]*"[^>]*>[\s\S]*?<\/button>/i);
  const secondary = secondaryMatch?.[0] ||
    '<button class="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg font-medium">Button</button>';

  // Ghost
  const ghostMatch = html.match(/<button[^>]*class="[^"]*(?:bg-transparent|hover:bg)[^"]*"[^>]*>[\s\S]*?<\/button>/i);
  const ghost = ghostMatch?.[0] ||
    '<button class="bg-transparent hover:bg-[var(--accent)] text-[var(--foreground)] px-4 py-2 rounded-lg font-medium">Button</button>';

  return {
    primary,
    secondary,
    ghost,
    destructive: '<button class="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">Delete</button>',
  };
}

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

/**
 * Build Design Context from generated frames
 * Should be called after generating the first 2-3 screens
 */
export function buildDesignContext(
  frames: Array<{ title: string; htmlContent: string; id?: string }>,
  themeId: string
): DesignContext {
  if (frames.length === 0) {
    return createEmptyContext(themeId);
  }

  // Use first 2-3 frames to establish the design DNA
  const sourceFrames = frames.slice(0, Math.min(3, frames.length));
  const combinedHtml = sourceFrames.map(f => f.htmlContent).join('\n');
  const firstFrameHtml = sourceFrames[0].htmlContent;

  // Extract Design DNA
  const partialDNA = extractDesignDNAFromHTML(combinedHtml, themeId);
  const dna: DesignDNA = {
    theme: partialDNA.theme || {
      id: themeId,
      primaryColor: 'var(--primary)',
      accentUsage: 'subtle',
      gradientStyle: null,
      shadowStyle: 'shadow-lg',
      borderRadius: 'rounded-xl',
      glassEffect: true,
    },
    typography: partialDNA.typography || {
      headingScale: ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-semibold'],
      bodyText: 'text-base',
      caption: 'text-sm text-[var(--muted-foreground)]',
      fontWeights: ['font-medium', 'font-semibold', 'font-bold'],
    },
    spacing: partialDNA.spacing || {
      scale: ['p-2', 'p-4', 'p-6', 'p-8'],
      cardPadding: 'p-6',
      sectionGap: 'gap-6',
      itemGap: 'gap-4',
    },
    icons: partialDNA.icons || {
      library: 'hugeicons',
      sizes: { small: 'w-4 h-4', medium: 'w-5 h-5', large: 'w-6 h-6', hero: 'w-8 h-8' },
      activeStyle: 'text-[var(--primary)] drop-shadow-[0_0_4px_var(--primary)]',
      inactiveStyle: 'text-[var(--muted-foreground)]',
    },
  };

  // Extract Component Library
  const components: ComponentLibrary = {
    bottomNavigation: extractBottomNav(firstFrameHtml) || extractBottomNav(combinedHtml),
    sidebarNavigation: extractSidebar(firstFrameHtml) || extractSidebar(combinedHtml),
    header: extractHeader(firstFrameHtml),
    cardPatterns: extractCardPatterns(combinedHtml),
    buttonPatterns: extractButtonPatterns(combinedHtml),
    inputPatterns: {
      default: '<input class="w-full px-4 py-3 bg-[var(--accent)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]" />',
      withIcon: '<div class="relative"><iconify-icon icon="hugeicons:search-01" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"></iconify-icon><input class="w-full pl-10 pr-4 py-3 bg-[var(--accent)] border border-[var(--border)] rounded-xl" /></div>',
      searchBar: '<div class="relative"><iconify-icon icon="hugeicons:search-01" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"></iconify-icon><input class="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-full" placeholder="Search..." /></div>',
    },
    listItemPatterns: [],
  };

  // Build Screen Graph
  const screenGraph: ScreenGraph = {
    screens: frames.map((f, i) => ({
      id: f.id || `screen-${i}`,
      name: f.title,
      type: determineScreenType(f.title, f.htmlContent),
      hasBottomNav: /<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom/.test(f.htmlContent),
      primaryNavItem: null,
    })),
    mainScreens: [],
    authFlow: [],
    onboardingFlow: [],
  };

  // Categorize screens
  screenGraph.screens.forEach(screen => {
    if (screen.type === 'main' && screen.hasBottomNav) {
      screenGraph.mainScreens.push(screen.id);
    } else if (screen.type === 'auth') {
      screenGraph.authFlow.push(screen.id);
    } else if (screen.type === 'onboarding') {
      screenGraph.onboardingFlow.push(screen.id);
    }
  });

  return {
    dna,
    components,
    screenGraph,
    isInitialized: true,
    sourceScreenCount: sourceFrames.length,
  };
}

function determineScreenType(title: string, html: string): ScreenGraph['screens'][0]['type'] {
  const lowerTitle = title.toLowerCase();
  const lowerHtml = html.toLowerCase();

  if (/onboard|welcome|intro|splash|get\s*started/.test(lowerTitle)) return 'onboarding';
  if (/login|signup|sign\s*up|sign\s*in|register|forgot|password|otp|verify/.test(lowerTitle)) return 'auth';
  if (/settings|preferences|account|privacy|notification.*settings/.test(lowerTitle)) return 'settings';
  if (/detail|view|single|profile.*[a-z]/.test(lowerTitle)) return 'detail';
  if (/modal|popup|dialog|sheet/.test(lowerTitle)) return 'modal';
  
  // Check HTML for navigation presence as indicator of main screen
  if (/<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom/.test(html)) return 'main';
  
  return 'main';
}

function createEmptyContext(themeId: string): DesignContext {
  return {
    dna: {
      theme: {
        id: themeId,
        primaryColor: 'var(--primary)',
        accentUsage: 'subtle',
        gradientStyle: null,
        shadowStyle: 'shadow-lg',
        borderRadius: 'rounded-xl',
        glassEffect: true,
      },
      typography: {
        headingScale: ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-semibold'],
        bodyText: 'text-base',
        caption: 'text-sm text-[var(--muted-foreground)]',
        fontWeights: ['font-medium', 'font-semibold', 'font-bold'],
      },
      spacing: {
        scale: ['p-2', 'p-4', 'p-6', 'p-8'],
        cardPadding: 'p-6',
        sectionGap: 'gap-6',
        itemGap: 'gap-4',
      },
      icons: {
        library: 'hugeicons',
        sizes: { small: 'w-4 h-4', medium: 'w-5 h-5', large: 'w-6 h-6', hero: 'w-8 h-8' },
        activeStyle: 'text-[var(--primary)] drop-shadow-[0_0_4px_var(--primary)]',
        inactiveStyle: 'text-[var(--muted-foreground)]',
      },
    },
    components: {
      bottomNavigation: null,
      sidebarNavigation: null,
      header: null,
      cardPatterns: [],
      buttonPatterns: {
        primary: '<button class="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium">Button</button>',
        secondary: '<button class="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg font-medium">Button</button>',
        ghost: '<button class="bg-transparent hover:bg-[var(--accent)] text-[var(--foreground)] px-4 py-2 rounded-lg font-medium">Button</button>',
        destructive: '<button class="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">Delete</button>',
      },
      inputPatterns: {
        default: '<input class="w-full px-4 py-3 bg-[var(--accent)] border border-[var(--border)] rounded-xl" />',
        withIcon: '',
        searchBar: '',
      },
      listItemPatterns: [],
    },
    screenGraph: {
      screens: [],
      mainScreens: [],
      authFlow: [],
      onboardingFlow: [],
    },
    isInitialized: false,
    sourceScreenCount: 0,
  };
}

// ============================================================================
// CONTEXT STRING GENERATION
// ============================================================================

/**
 * Generate the immutable Design DNA context string
 * This should be included in EVERY screen generation prompt
 */
export function generateDesignDNAString(dna: DesignDNA): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
DESIGN DNA (IMMUTABLE - DO NOT DEVIATE FROM THESE PATTERNS)
═══════════════════════════════════════════════════════════════════════════════

THEME IDENTITY:
- Theme: ${dna.theme.id}
- Shadow style: ${dna.theme.shadowStyle}
- Border radius: ${dna.theme.borderRadius}
- Glass effects: ${dna.theme.glassEffect ? 'YES - use backdrop-blur-md/xl where appropriate' : 'NO - use solid backgrounds'}
${dna.theme.gradientStyle ? `- Gradient style: ${dna.theme.gradientStyle}` : '- Gradients: AVOID or use very subtle single-color gradients'}

**CSS VARIABLE ENFORCEMENT (CRITICAL - THEME CONSISTENCY):**
- ALL backgrounds MUST use: bg-[var(--background)], bg-[var(--card)], bg-[var(--primary)], bg-[var(--secondary)], bg-[var(--accent)], bg-[var(--muted)]
- ALL text MUST use: text-[var(--foreground)], text-[var(--primary)], text-[var(--muted-foreground)], text-[var(--primary-foreground)]
- ALL borders MUST use: border-[var(--border)]
- CHARTS use: var(--chart-1) through var(--chart-5)
- ❌ NEVER use hardcoded colors like bg-blue-500, text-gray-700, #3b82f6
- ✅ ONLY exception: Semantic status (text-green-500/10, text-red-500/10 for success/error)

TYPOGRAPHY SYSTEM (USE EXACTLY):
- Headings: ${dna.typography.headingScale.join(' | ')}
- Body: ${dna.typography.bodyText}
- Captions/Labels: ${dna.typography.caption}
- Font weights in use: ${dna.typography.fontWeights.join(', ')}

SPACING SYSTEM (USE EXACTLY):
- Padding scale: ${dna.spacing.scale.join(', ')}
- Card padding: ${dna.spacing.cardPadding}
- Section gaps: ${dna.spacing.sectionGap}
- Item gaps: ${dna.spacing.itemGap}

ICON SYSTEM:
- Library: ${dna.icons.library} (use <iconify-icon icon="hugeicons:NAME">)
- Sizes: small=${dna.icons.sizes.small}, medium=${dna.icons.sizes.medium}, large=${dna.icons.sizes.large}
- Active state: ${dna.icons.activeStyle}
- Inactive state: ${dna.icons.inactiveStyle}

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

/**
 * Generate component library context string
 * Contains exact HTML to copy for consistent navigation and components
 */
export function generateComponentLibraryString(components: ComponentLibrary): string {
  const parts: string[] = [
    `
═══════════════════════════════════════════════════════════════════════════════
COMPONENT LIBRARY (COPY THESE EXACTLY - DO NOT MODIFY)
═══════════════════════════════════════════════════════════════════════════════
`.trim()
  ];

  if (components.bottomNavigation) {
    parts.push(`
[BOTTOM NAVIGATION - COPY EXACTLY for all main app screens]
Description: ${components.bottomNavigation.description}
Icons: ${components.bottomNavigation.icons.join(', ')}

${components.bottomNavigation.html}
`);
  }

  if (components.sidebarNavigation) {
    parts.push(`
[SIDEBAR NAVIGATION - COPY EXACTLY]
Description: ${components.sidebarNavigation.description}

${components.sidebarNavigation.html}
`);
  }

  if (components.header) {
    parts.push(`
[HEADER COMPONENT - Use similar structure]
Features: ${[
      components.header.hasBackButton && 'Back button',
      components.header.hasUserAvatar && 'User avatar',
      components.header.hasSearchIcon && 'Search icon',
      components.header.hasNotificationIcon && 'Notification icon',
    ].filter(Boolean).join(', ') || 'Standard header'}

${components.header.html}
`);
  }

  if (components.cardPatterns.length > 0) {
    parts.push(`
[CARD PATTERNS - Reference for consistent card styling]
${components.cardPatterns.map(c => `
<!-- ${c.name}: ${c.usage} -->
${c.html}
`).join('\n')}
`);
  }

  parts.push(`
[BUTTON PATTERNS]
Primary: ${components.buttonPatterns.primary}
Secondary: ${components.buttonPatterns.secondary}
Ghost: ${components.buttonPatterns.ghost}
`);

  return parts.join('\n');
}

/**
 * Generate screen-specific navigation context
 */
export function generateScreenNavigationContext(
  screenPlan: { id: string; name: string; purpose: string },
  screenGraph: ScreenGraph,
  components: ComponentLibrary
): string {
  const screenType = determineScreenType(screenPlan.name, '');
  
  const needsBottomNav = screenType === 'main' && components.bottomNavigation;
  const isAuthScreen = screenType === 'auth';
  const isOnboardingScreen = screenType === 'onboarding';

  let navContext = '';

  if (needsBottomNav) {
    // Determine which nav item should be active based on screen name
    const activeNavHint = guessActiveNavItem(screenPlan.name, components.bottomNavigation?.icons || []);
    navContext = `
NAVIGATION REQUIREMENT: This is a MAIN APP SCREEN
- MUST include bottom navigation (copy exactly from Component Library)
- Active nav item should be: ${activeNavHint}
- Change ONLY the active icon styling, keep everything else identical
`;
  } else if (isAuthScreen || isOnboardingScreen) {
    navContext = `
NAVIGATION REQUIREMENT: This is a ${isAuthScreen ? 'AUTH' : 'ONBOARDING'} SCREEN
- DO NOT include bottom navigation
- Include back button in header if not the first screen in flow
- Keep navigation minimal and focused on the task
`;
  }

  return navContext;
}

function guessActiveNavItem(screenName: string, icons: string[]): string {
  const name = screenName.toLowerCase();
  
  if (/home|dashboard|overview/.test(name)) return icons[0] || 'home (first icon)';
  if (/explore|discover|search|browse/.test(name)) return icons[1] || 'explore (second icon)';
  if (/create|add|new|compose/.test(name)) return icons[2] || 'add/create (middle icon)';
  if (/activity|notification|message|chat/.test(name)) return icons[3] || 'activity (fourth icon)';
  if (/profile|account|settings|me/.test(name)) return icons[4] || 'profile (last icon)';
  
  return icons[0] || 'first icon (default to home)';
}

/**
 * Generate full hierarchical context for a screen
 * Combines: Design DNA (global) + Component Library (global) + Recent screens (local)
 */
export function generateFullContext(
  context: DesignContext,
  screenPlan: { id: string; name: string; purpose: string; visualDescription: string },
  recentFrames: Array<{ title: string; htmlContent: string }>,
  screenIndex: number,
  totalScreens: number
): string {
  const parts: string[] = [];

  // Part 1: Design DNA (always included)
  parts.push(generateDesignDNAString(context.dna));

  // Part 2: Component Library (always included)
  parts.push(generateComponentLibraryString(context.components));

  // Part 3: Screen-specific navigation context
  parts.push(generateScreenNavigationContext(screenPlan, context.screenGraph, context.components));

  // Part 4: Recent screens for immediate visual continuity (max 2, truncated)
  if (recentFrames.length > 0) {
    parts.push(`
═══════════════════════════════════════════════════════════════════════════════
RECENT SCREENS (for immediate visual continuity - reference styling patterns)
═══════════════════════════════════════════════════════════════════════════════
`);
    
    const framesToInclude = recentFrames.slice(-2);
    for (const frame of framesToInclude) {
      // Truncate long HTML but keep essential structure
      const html = frame.htmlContent.length > 6000
        ? truncateHtmlIntelligently(frame.htmlContent, 6000)
        : frame.htmlContent;
      
      parts.push(`
<!-- ${frame.title} -->
${html}
`);
    }
  }

  // Part 5: Screen position context
  parts.push(`
═══════════════════════════════════════════════════════════════════════════════
CURRENT SCREEN: ${screenIndex + 1} of ${totalScreens}
Screen Name: ${screenPlan.name}
Screen Purpose: ${screenPlan.purpose}
═══════════════════════════════════════════════════════════════════════════════

CRITICAL REMINDER:
1. This screen MUST look like it belongs with the previous ${screenIndex} screens
2. Use the EXACT same Design DNA patterns (typography, spacing, icons, colors)
3. Copy navigation components EXACTLY from the Component Library
4. Only change content - the visual style must be IDENTICAL to other screens
`);

  return parts.join('\n');
}

/**
 * Intelligently truncate HTML while preserving structure
 */
function truncateHtmlIntelligently(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html;

  // Find a good break point (end of a tag)
  let breakPoint = html.lastIndexOf('</div>', maxLength);
  if (breakPoint === -1 || breakPoint < maxLength * 0.6) {
    breakPoint = html.lastIndexOf('>', maxLength);
  }
  if (breakPoint === -1) {
    breakPoint = maxLength;
  }

  return html.substring(0, breakPoint + 1) + '\n<!-- ... content truncated for brevity, maintain same styling patterns ... -->';
}

/**
 * Update context after each screen generation
 * Call this after generating screens 1, 2, 3 to build the Design DNA
 */
export function updateDesignContext(
  existingContext: DesignContext,
  newFrame: { title: string; htmlContent: string; id?: string },
  allFrames: Array<{ title: string; htmlContent: string; id?: string }>
): DesignContext {
  // Only update Design DNA from first 3 screens
  if (existingContext.sourceScreenCount < 3) {
    return buildDesignContext(allFrames.slice(0, 3), existingContext.dna.theme.id);
  }

  // After 3 screens, only update the screen graph
  const newScreen = {
    id: newFrame.id || `screen-${existingContext.screenGraph.screens.length}`,
    name: newFrame.title,
    type: determineScreenType(newFrame.title, newFrame.htmlContent),
    hasBottomNav: /<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom/.test(newFrame.htmlContent),
    primaryNavItem: null as string | null,
  };

  return {
    ...existingContext,
    screenGraph: {
      ...existingContext.screenGraph,
      screens: [...existingContext.screenGraph.screens, newScreen],
      mainScreens: newScreen.type === 'main' && newScreen.hasBottomNav
        ? [...existingContext.screenGraph.mainScreens, newScreen.id]
        : existingContext.screenGraph.mainScreens,
    },
  };
}
