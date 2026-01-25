/**
 * Component Registry - Enhanced Context Management for Multi-Screen Design Consistency
 * 
 * PROBLEM SOLVED:
 * When generating 10-20+ screens, AI loses context after 3-4 screens because:
 * 1. Only last 2 screens are passed in context
 * 2. Component extraction via regex is brittle
 * 3. Design system rules aren't enforced across all screens
 * 
 * SOLUTION:
 * 1. Extract and store EXACT HTML components from first screen (not regex approximations)
 * 2. Create immutable "Component Registry" that's included in EVERY generation
 * 3. Lock navigation items, icons, sidebar links explicitly
 * 4. Detect and enforce design systems (Carbon, Material, etc.) across all screens
 */

import { FrameType } from "@/types/project";

// ============================================================================
// TYPES
// ============================================================================

export interface NavigationSpec {
  type: 'bottom-nav' | 'sidebar' | 'top-nav' | 'tabs';
  items: Array<{
    label: string;
    icon: string;           // Exact icon name e.g., "hugeicons:home-01"
    screenId?: string;      // Which screen this nav item leads to
  }>;
  html: string;             // Exact HTML to copy
  activeStateClass: string; // CSS class for active state
  inactiveStateClass: string;
}

export interface HeaderSpec {
  hasLogo: boolean;
  logoHtml?: string;
  hasSearch: boolean;
  hasNotification: boolean;
  hasUserAvatar: boolean;
  hasBackButton: boolean;
  html: string;
}

export interface DesignSystemSpec {
  name: string | null;  // e.g., "IBM Carbon", "Material Design", "Ant Design"
  detected: boolean;
  rules: string[];      // Specific rules for this design system
}

export interface ComponentRegistry {
  // Source tracking
  sourceScreenId: string;
  sourceScreenTitle: string;
  extractedAt: string;
  
  // Navigation components (IMMUTABLE after extraction)
  navigation: NavigationSpec | null;
  sidebar: NavigationSpec | null;
  header: HeaderSpec | null;
  
  // Design system
  designSystem: DesignSystemSpec;
  
  // Key UI patterns (exact HTML snippets)
  patterns: {
    primaryButton: string;
    secondaryButton: string;
    card: string;
    input: string;
    listItem: string;
  };
  
  // Explicit lock for icons (prevent icon drift)
  iconLock: {
    home: string;
    search: string;
    profile: string;
    settings: string;
    notification: string;
    back: string;
    menu: string;
    add: string;
    [key: string]: string;
  };
  
  // First screen reference (truncated but complete structure)
  firstScreenHtml: string;
}

// ============================================================================
// DESIGN SYSTEM DETECTION
// ============================================================================

const DESIGN_SYSTEMS = [
  {
    name: "IBM Carbon Design",
    keywords: ["carbon", "ibm carbon", "carbon design"],
    rules: [
      "Use 8px grid system (spacing: 8px, 16px, 24px, 32px, 48px)",
      "Typography: IBM Plex Sans, 14px body, 16px base",
      "Buttons: 48px height primary, 40px height secondary",
      "Icons: 16px inline, 20px buttons, 24px navigation (IBM style)",
      "Cards: 1px border, 0px border-radius OR 4px max",
      "Colors: Blue-60 primary, Gray-10/20/30 for backgrounds",
      "Sidebar: 256px width, vertical navigation with icons left",
      "Data tables: Zebra striping optional, 48px row height"
    ]
  },
  {
    name: "Google Material Design",
    keywords: ["material", "material design", "google material", "material ui", "mui"],
    rules: [
      "Use 4px/8px grid system",
      "Typography: Roboto font, 14px body, 16px base",
      "Buttons: 36px height, 4px border-radius, uppercase text",
      "FAB (Floating Action Button): 56px diameter, bottom-right",
      "Cards: 2px elevation shadow, 4px border-radius",
      "Icons: Material Icons, 24px default size",
      "App bar: 64px height desktop, 56px mobile",
      "Navigation drawer: 256px width, rail option 72px",
      "Ripple effects on interactive elements"
    ]
  },
  {
    name: "Ant Design",
    keywords: ["ant design", "antd"],
    rules: [
      "Use 8px grid system",
      "Typography: -apple-system, 14px body",
      "Buttons: 32px height default, 40px large, 4px border-radius",
      "Cards: 1px border, 2px border-radius, 24px padding",
      "Icons: Ant Design Icons, outlined style",
      "Tables: 54px header height, alternating row colors optional",
      "Form items: Label above input, 32px input height"
    ]
  },
  {
    name: "Tailwind UI",
    keywords: ["tailwind ui", "tailwindui"],
    rules: [
      "Use Tailwind spacing scale (4px base)",
      "Typography: Inter or system font, text-sm/base/lg scale",
      "Buttons: px-4 py-2, rounded-md/lg, font-medium",
      "Cards: rounded-lg/xl, shadow-sm/md, p-6",
      "Focus rings: ring-2 ring-offset-2",
      "Icons: Heroicons, 20px for buttons, 24px for UI"
    ]
  },
  {
    name: "Chakra UI",
    keywords: ["chakra", "chakra ui"],
    rules: [
      "Use 4px spacing scale",
      "Typography: Inter, -apple-system fallback",
      "Buttons: colorScheme variants (blue, gray, etc.)",
      "Cards: rounded-lg, boxShadow-md",
      "Focus: box-shadow outline, not ring"
    ]
  },
  {
    name: "Shadcn/UI",
    keywords: ["shadcn", "shadcn/ui", "radix"],
    rules: [
      "Use CSS variables for theming (--primary, --secondary, etc.)",
      "Buttons: rounded-md, font-medium, h-10 px-4",
      "Cards: rounded-lg border, p-6",
      "Inputs: h-10, rounded-md, focus-visible:ring-2",
      "Dialog: rounded-lg, p-6, centered overlay"
    ]
  }
];

/**
 * Detect if user requested a specific design system
 */
export function detectDesignSystem(prompt: string): DesignSystemSpec {
  const lowered = prompt.toLowerCase();
  
  for (const system of DESIGN_SYSTEMS) {
    if (system.keywords.some(kw => lowered.includes(kw))) {
      return {
        name: system.name,
        detected: true,
        rules: system.rules
      };
    }
  }
  
  return {
    name: null,
    detected: false,
    rules: []
  };
}

// ============================================================================
// COMPONENT EXTRACTION (More robust than regex)
// ============================================================================

/**
 * Extract bottom navigation with explicit icon names
 */
function extractBottomNavigation(html: string): NavigationSpec | null {
  // Look for fixed/absolute bottom positioned elements
  const patterns = [
    // Standard floating bottom nav
    /<div[^>]*class="[^"]*(?:fixed|absolute)[^"]*bottom[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<\/div>\s*$)/gi,
    // Nav element with bottom positioning
    /<nav[^>]*(?:fixed|absolute)[^"]*bottom[^>]*>[\s\S]*?<\/nav>/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 5000 && match[0].length > 100) {
      const navHtml = match[0];
      
      // Extract icon names
      const iconMatches = [...navHtml.matchAll(/icon="([^"]+)"/g)];
      const icons = iconMatches.map(m => m[1]);
      
      // Extract labels if present
      const labelMatches = [...navHtml.matchAll(/<span[^>]*>([^<]+)<\/span>/g)];
      const labels = labelMatches.map(m => m[1].trim()).filter(l => l.length < 20);
      
      // Build items array
      const items = icons.map((icon, i) => ({
        label: labels[i] || icon.split(':')[1]?.replace(/-/g, ' ') || `Nav ${i + 1}`,
        icon: icon,
      }));

      if (items.length >= 3 && items.length <= 6) {
        // Extract active/inactive classes
        const activeClass = navHtml.match(/text-\[var\(--primary\)\][^"]*drop-shadow[^"]*/)?.[0] || 
                           'text-[var(--primary)] drop-shadow-[0_0_4px_var(--primary)]';
        const inactiveClass = 'text-[var(--muted-foreground)]';

        return {
          type: 'bottom-nav',
          items,
          html: navHtml,
          activeStateClass: activeClass,
          inactiveStateClass: inactiveClass
        };
      }
    }
  }

  return null;
}

/**
 * Extract sidebar navigation
 */
function extractSidebarNavigation(html: string): NavigationSpec | null {
  const patterns = [
    /<(?:aside|nav|div)[^>]*class="[^"]*(?:fixed|sticky)?[^"]*(?:w-64|w-60|w-56|left-0)[^"]*"[^>]*>[\s\S]*?<\/(?:aside|nav|div)>/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 8000 && match[0].length > 200) {
      const sidebarHtml = match[0];
      
      // Extract icon names and labels from sidebar
      const iconMatches = [...sidebarHtml.matchAll(/icon="([^"]+)"/g)];
      const icons = iconMatches.map(m => m[1]);
      
      // Look for nav item labels (usually in spans or directly in links)
      const navItemPattern = /<(?:a|button|div)[^>]*class="[^"]*(?:flex|items-center)[^"]*"[^>]*>[\s\S]*?(?:<span[^>]*>([^<]+)<\/span>|>([^<]{2,30})<)/gi;
      const labelMatches = [...sidebarHtml.matchAll(navItemPattern)];
      
      const items = icons.slice(0, 10).map((icon, i) => ({
        label: labelMatches[i]?.[1] || labelMatches[i]?.[2] || icon.split(':')[1]?.replace(/-/g, ' ') || `Item ${i + 1}`,
        icon: icon,
      }));

      if (items.length >= 3) {
        return {
          type: 'sidebar',
          items,
          html: sidebarHtml,
          activeStateClass: 'bg-[var(--accent)] text-[var(--foreground)]',
          inactiveStateClass: 'text-[var(--muted-foreground)]'
        };
      }
    }
  }

  return null;
}

/**
 * Extract header component
 */
function extractHeader(html: string): HeaderSpec | null {
  const patterns = [
    /<(?:header|div)[^>]*class="[^"]*(?:sticky|fixed)[^"]*(?:top-0|z-\d+)[^"]*"[^>]*>[\s\S]*?<\/(?:header|div)>/gi,
    /<header[^>]*>[\s\S]*?<\/header>/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[0].length < 4000 && match[0].length > 100) {
      const headerHtml = match[0];
      
      // Extract logo if present
      const logoMatch = headerHtml.match(/<(?:img|svg|div)[^>]*(?:logo|brand)[^>]*>[\s\S]*?(?:<\/(?:img|svg|div)>)?/i);
      
      return {
        hasLogo: !!logoMatch,
        logoHtml: logoMatch?.[0],
        hasSearch: /search/i.test(headerHtml),
        hasNotification: /notification|bell/i.test(headerHtml),
        hasUserAvatar: /pravatar|avatar|profile/i.test(headerHtml),
        hasBackButton: /arrow-left|chevron-left|back/i.test(headerHtml),
        html: headerHtml
      };
    }
  }

  return null;
}

/**
 * Extract button patterns
 */
function extractButtonPatterns(html: string): { primary: string; secondary: string } {
  const primaryMatch = html.match(/<button[^>]*class="[^"]*bg-\[var\(--primary\)\][^"]*"[^>]*>[\s\S]*?<\/button>/i);
  const secondaryMatch = html.match(/<button[^>]*class="[^"]*(?:bg-\[var\(--secondary\)\]|bg-\[var\(--accent\)\]|border)[^"]*"[^>]*>[\s\S]*?<\/button>/i);
  
  return {
    primary: primaryMatch?.[0] || '<button class="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg font-medium">Button</button>',
    secondary: secondaryMatch?.[0] || '<button class="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg font-medium">Button</button>'
  };
}

/**
 * Extract card pattern
 */
function extractCardPattern(html: string): string {
  const cardMatch = html.match(/<div[^>]*class="[^"]*bg-\[var\(--card\)\][^"]*rounded[^"]*p-[456][^"]*"[^>]*>[\s\S]*?<\/div>/i);
  return cardMatch?.[0]?.substring(0, 1500) || '<div class="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">Card content</div>';
}

/**
 * Extract input pattern
 */
function extractInputPattern(html: string): string {
  const inputMatch = html.match(/<(?:input|div[^>]*class="[^"]*relative)[^>]*>[\s\S]*?(?:<\/div>|\/?>)/i);
  return inputMatch?.[0]?.substring(0, 800) || '<input class="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg" />';
}

/**
 * Build icon lock from extracted navigation
 */
function buildIconLock(nav: NavigationSpec | null, sidebar: NavigationSpec | null): ComponentRegistry['iconLock'] {
  const iconLock: ComponentRegistry['iconLock'] = {
    home: 'hugeicons:home-01',
    search: 'hugeicons:search-01',
    profile: 'hugeicons:user',
    settings: 'hugeicons:settings-01',
    notification: 'hugeicons:notification-02',
    back: 'hugeicons:arrow-left-01',
    menu: 'hugeicons:menu-02',
    add: 'hugeicons:add-01'
  };
  
  // Override with actual icons from navigation
  const allItems = [...(nav?.items || []), ...(sidebar?.items || [])];
  
  for (const item of allItems) {
    const label = item.label.toLowerCase();
    if (label.includes('home') || label.includes('dashboard')) iconLock.home = item.icon;
    if (label.includes('search') || label.includes('explore') || label.includes('discover')) iconLock.search = item.icon;
    if (label.includes('profile') || label.includes('account') || label.includes('user')) iconLock.profile = item.icon;
    if (label.includes('setting')) iconLock.settings = item.icon;
    if (label.includes('notification') || label.includes('bell') || label.includes('alert')) iconLock.notification = item.icon;
    if (label.includes('add') || label.includes('create') || label.includes('new')) iconLock.add = item.icon;
  }
  
  return iconLock;
}

// ============================================================================
// MAIN REGISTRY BUILDER
// ============================================================================

/**
 * Build Component Registry from the first generated screen
 * This should be called ONCE after the first screen is generated
 */
export function buildComponentRegistry(
  firstFrame: FrameType,
  userPrompt: string
): ComponentRegistry {
  const html = firstFrame.htmlContent;
  
  // Detect design system from user prompt
  const designSystem = detectDesignSystem(userPrompt);
  
  // Extract navigation components
  const navigation = extractBottomNavigation(html);
  const sidebar = extractSidebarNavigation(html);
  const header = extractHeader(html);
  
  // Extract UI patterns
  const buttons = extractButtonPatterns(html);
  const card = extractCardPattern(html);
  const input = extractInputPattern(html);
  
  // Build icon lock
  const iconLock = buildIconLock(navigation, sidebar);
  
  // Store first screen HTML (truncated intelligently)
  const firstScreenHtml = html.length > 15000 
    ? truncateHtmlPreservingStructure(html, 15000)
    : html;

  return {
    sourceScreenId: firstFrame.id,
    sourceScreenTitle: firstFrame.title,
    extractedAt: new Date().toISOString(),
    navigation,
    sidebar,
    header,
    designSystem,
    patterns: {
      primaryButton: buttons.primary,
      secondaryButton: buttons.secondary,
      card,
      input,
      listItem: '<div class="flex items-center gap-3 p-3">List item</div>'
    },
    iconLock,
    firstScreenHtml
  };
}

/**
 * Update registry if second screen provides better component examples
 * (Only updates if first screen was missing components)
 */
export function updateRegistryIfNeeded(
  registry: ComponentRegistry,
  newFrame: FrameType
): ComponentRegistry {
  const html = newFrame.htmlContent;
  
  // Only update if components are missing
  const updates: Partial<ComponentRegistry> = {};
  
  if (!registry.navigation) {
    const nav = extractBottomNavigation(html);
    if (nav) updates.navigation = nav;
  }
  
  if (!registry.sidebar) {
    const sidebar = extractSidebarNavigation(html);
    if (sidebar) updates.sidebar = sidebar;
  }
  
  if (!registry.header) {
    const header = extractHeader(html);
    if (header) updates.header = header;
  }
  
  if (Object.keys(updates).length > 0) {
    const updatedRegistry = { ...registry, ...updates };
    updatedRegistry.iconLock = buildIconLock(
      updatedRegistry.navigation, 
      updatedRegistry.sidebar
    );
    return updatedRegistry;
  }
  
  return registry;
}

// ============================================================================
// CONTEXT STRING GENERATION
// ============================================================================

/**
 * Generate the immutable Component Registry context string
 * This should be included in EVERY screen generation prompt
 */
export function generateRegistryContextString(
  registry: ComponentRegistry,
  currentScreenIndex: number,
  currentScreenName: string
): string {
  const parts: string[] = [];

  parts.push(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPONENT REGISTRY (IMMUTABLE - COPY EXACTLY)             ║
╚══════════════════════════════════════════════════════════════════════════════╝

This registry was extracted from "${registry.sourceScreenTitle}" and MUST be 
followed EXACTLY on ALL subsequent screens. DO NOT DEVIATE.
`);

  // Design System Enforcement
  if (registry.designSystem.detected && registry.designSystem.name) {
    parts.push(`
════════════════════════════════════════════════════════════════════════════════
DESIGN SYSTEM: ${registry.designSystem.name.toUpperCase()} (MANDATORY COMPLIANCE)
════════════════════════════════════════════════════════════════════════════════

YOU MUST FOLLOW THESE RULES ON EVERY SCREEN:
${registry.designSystem.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

⚠️  VIOLATION OF THESE RULES WILL BREAK DESIGN CONSISTENCY
`);
  }

  // Icon Lock
  parts.push(`
════════════════════════════════════════════════════════════════════════════════
ICON LOCK (USE THESE EXACT ICONS - NO SUBSTITUTIONS)
════════════════════════════════════════════════════════════════════════════════

${Object.entries(registry.iconLock).map(([key, icon]) => `- ${key}: ${icon}`).join('\n')}

⚠️  DO NOT use different icons for these purposes. The icon set is LOCKED.
`);

  // Navigation Component
  if (registry.navigation) {
    const isMainScreen = !currentScreenName.toLowerCase().match(/login|signup|sign up|register|onboard|welcome|splash|forgot|otp|verify/);
    
    parts.push(`
════════════════════════════════════════════════════════════════════════════════
BOTTOM NAVIGATION (${isMainScreen ? 'REQUIRED FOR THIS SCREEN' : 'DO NOT INCLUDE - This is an auth/onboarding screen'})
════════════════════════════════════════════════════════════════════════════════

Navigation Items (EXACT ORDER - DO NOT CHANGE):
${registry.navigation.items.map((item, i) => `${i + 1}. ${item.label} → ${item.icon}`).join('\n')}

Active State: ${registry.navigation.activeStateClass}
Inactive State: ${registry.navigation.inactiveStateClass}

${isMainScreen ? `
COPY THIS HTML EXACTLY (only change which item is active):
${registry.navigation.html}
` : 'DO NOT include bottom navigation on auth/onboarding screens.'}
`);
  }

  // Sidebar Navigation (for web)
  if (registry.sidebar) {
    parts.push(`
════════════════════════════════════════════════════════════════════════════════
SIDEBAR NAVIGATION (COPY EXACTLY ON ALL SCREENS)
════════════════════════════════════════════════════════════════════════════════

Sidebar Items (EXACT ORDER - DO NOT CHANGE):
${registry.sidebar.items.map((item, i) => `${i + 1}. ${item.label} → ${item.icon}`).join('\n')}

COPY THIS HTML EXACTLY (only change which item is active for current screen):
${registry.sidebar.html}
`);
  }

  // Header
  if (registry.header) {
    parts.push(`
════════════════════════════════════════════════════════════════════════════════
HEADER COMPONENT (USE SAME STRUCTURE)
════════════════════════════════════════════════════════════════════════════════

Header Features:
- Logo: ${registry.header.hasLogo ? 'YES' : 'NO'}
- Search: ${registry.header.hasSearch ? 'YES' : 'NO'}
- Notifications: ${registry.header.hasNotification ? 'YES' : 'NO'}
- User Avatar: ${registry.header.hasUserAvatar ? 'YES' : 'NO'}

Reference HTML:
${registry.header.html}
`);
  }

  // UI Patterns
  parts.push(`
════════════════════════════════════════════════════════════════════════════════
UI PATTERNS (USE CONSISTENT STYLING)
════════════════════════════════════════════════════════════════════════════════

PRIMARY BUTTON:
${registry.patterns.primaryButton}

SECONDARY BUTTON:
${registry.patterns.secondaryButton}

CARD PATTERN:
${registry.patterns.card}

INPUT PATTERN:
${registry.patterns.input}
`);

  // Critical reminder
  parts.push(`
════════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL CONSISTENCY RULES (VIOLATING THESE BREAKS THE APP)
════════════════════════════════════════════════════════════════════════════════

1. NAVIGATION: Use EXACT same icons, order, and styling as Component Registry
2. SIDEBAR: Copy VERBATIM - only highlight active item for current screen
3. ICONS: Only use icons from Icon Lock - NO SUBSTITUTIONS
4. BUTTONS: Use exact same button styling patterns
5. SPACING: Maintain consistent padding/margin scale
6. THIS IS SCREEN ${currentScreenIndex + 1}: "${currentScreenName}"

The user is paying for a COHESIVE app design. Every screen must look like it 
belongs to the same application with identical navigation, icons, and styling.
`);

  return parts.join('\n');
}

/**
 * Generate context for subsequent screens
 * Includes: Registry + Recent screen for flow continuity
 */
export function generateFullScreenContext(
  registry: ComponentRegistry,
  recentFrame: FrameType | null,
  screenIndex: number,
  screenName: string,
  totalScreens: number
): string {
  let context = generateRegistryContextString(registry, screenIndex, screenName);
  
  // Add recent screen for flow continuity (just one, truncated)
  if (recentFrame && screenIndex > 0) {
    const recentHtml = recentFrame.htmlContent.length > 8000
      ? truncateHtmlPreservingStructure(recentFrame.htmlContent, 8000)
      : recentFrame.htmlContent;
    
    context += `

════════════════════════════════════════════════════════════════════════════════
PREVIOUS SCREEN: "${recentFrame.title}" (for flow continuity)
════════════════════════════════════════════════════════════════════════════════

${recentHtml}

Use this as reference for immediate visual continuity. The navigation, sidebar,
and icon patterns should match the Component Registry above EXACTLY.
`;
  }

  // For first few screens, include reference to first screen
  if (screenIndex >= 1 && screenIndex <= 3) {
    context += `

════════════════════════════════════════════════════════════════════════════════
REFERENCE SCREEN (First screen - establishes design DNA)
════════════════════════════════════════════════════════════════════════════════

${registry.firstScreenHtml}

This screen established the design system. All screens must match its visual style.
`;
  }

  return context;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Truncate HTML while preserving important structure
 */
function truncateHtmlPreservingStructure(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html;
  
  // Find a good break point (end of a major div)
  let breakPoint = maxLength;
  
  // Try to find </div> near the cutoff
  const searchStart = Math.max(0, maxLength - 500);
  const searchEnd = Math.min(html.length, maxLength + 200);
  const searchArea = html.substring(searchStart, searchEnd);
  
  const lastDivClose = searchArea.lastIndexOf('</div>');
  if (lastDivClose !== -1) {
    breakPoint = searchStart + lastDivClose + 6;
  }
  
  return html.substring(0, breakPoint) + '\n<!-- ... content continues, maintain same patterns ... -->';
}

/**
 * Determine which navigation item should be active for a given screen
 */
export function getActiveNavItem(
  screenName: string,
  navigation: NavigationSpec | null
): string | null {
  if (!navigation) return null;
  
  const name = screenName.toLowerCase();
  
  for (const item of navigation.items) {
    const label = item.label.toLowerCase();
    
    if (name.includes('home') || name.includes('dashboard')) {
      if (label.includes('home') || label.includes('dashboard')) return item.icon;
    }
    if (name.includes('search') || name.includes('explore') || name.includes('discover')) {
      if (label.includes('search') || label.includes('explore') || label.includes('discover') || label.includes('compass')) return item.icon;
    }
    if (name.includes('profile') || name.includes('account') || name.includes('me')) {
      if (label.includes('profile') || label.includes('account') || label.includes('user')) return item.icon;
    }
    if (name.includes('message') || name.includes('chat') || name.includes('notification')) {
      if (label.includes('message') || label.includes('chat') || label.includes('notification')) return item.icon;
    }
    if (name.includes('add') || name.includes('create') || name.includes('new')) {
      if (label.includes('add') || label.includes('create') || label.includes('plus')) return item.icon;
    }
  }
  
  // Default to first item
  return navigation.items[0]?.icon || null;
}
