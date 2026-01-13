# Cursor-Optimized Prompt for Comprehensive Mobile App Design Generation

## Overview
This document outlines the optimized prompt system for generating complete mobile app designs with comprehensive screen coverage, professional aesthetics, and maintained context across all screens.

## Key Requirements

### 1. Complete App Screen Generation (Up to 24 Screens)
- **Onboarding Flow**: 4 screens minimum (Welcome, Features, Permissions, Get Started)
- **Authentication**: Login, Sign-up, Forgot Password, OTP Verification
- **Core Features**: All main feature screens based on app type
- **Secondary Features**: Settings, Profile, Notifications, Search, etc.
- **Maximum**: 24 screens total (prioritize most important screens)

### 2. Context Maintenance Across Screens
- Each screen must reference and maintain consistency with all previously generated screens
- Extract and reuse:
  - Bottom navigation structure (if applicable)
  - Header styles and components
  - Card designs and layouts
  - Button styles and interactions
  - Color schemes and spacing
  - Typography hierarchy
  - Icon styles and sizes

### 3. Professional Design Standards
**AVOID "Vibe Coded UI" (Amateur Design Patterns):**
- ❌ Excessive purple/pink gradients everywhere
- ❌ Overly bright neon colors without purpose
- ❌ Cluttered layouts with too many elements
- ❌ Inconsistent spacing and alignment
- ❌ Generic placeholder content
- ❌ Old-fashioned icon styles

**ENFORCE Senior Designer Quality:**
- ✅ Subtle, purposeful color usage
- ✅ Clean, minimal aesthetics with breathing room
- ✅ Consistent design system (spacing scale: 4px, 8px, 16px, 24px, 32px)
- ✅ Professional typography hierarchy
- ✅ Modern, flat or subtle depth (not over-glossy)
- ✅ Thoughtful use of gradients (subtle, not overwhelming)
- ✅ Proper visual hierarchy and information architecture
- ✅ Accessibility considerations (contrast, touch targets)

### 4. Modern Icon Usage
- Use **Lucide icons** exclusively (modern, clean, consistent)
- Prefer outline style icons over filled
- Use appropriate icon sizes: 16px (small), 20px (medium), 24px (large), 32px (hero)
- Icons should be semantically correct and contextually appropriate
- Avoid outdated icon styles (no Material Design v1, no Font Awesome classic)

### 5. Mobile Navigation Understanding
- **Bottom Navigation**: Standard 5-icon pattern for main app screens
  - Home, Explore/Discover, Create/Action, Messages/Activity, Profile
  - Floating glassmorphic bar with proper spacing
  - Active state clearly indicated
  - NO bottom nav on: Splash, Onboarding, Auth screens
  
- **Top Navigation**: 
  - Sticky headers with glassmorphism
  - Back button on secondary screens
  - Action buttons (search, notifications, menu) properly positioned
  
- **Navigation Patterns**:
  - Tab navigation for categories
  - Drawer navigation for settings (if applicable)
  - Modal overlays for detail views
  - Bottom sheets for actions

### 6. Aesthetics & UX Focus
- **Visual Hierarchy**: Clear primary, secondary, and tertiary actions
- **Spacing**: Generous whitespace, not cramped
- **Typography**: Clear font sizes (14px body, 16px base, 18px subheading, 24px+ headings)
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Feedback**: Visual states for buttons (default, hover, active, disabled)
- **Loading States**: Skeleton screens or subtle loading indicators
- **Error States**: Clear error messages and recovery paths
- **Empty States**: Helpful empty state illustrations/messages

## Implementation Strategy

### Screen Generation Flow
1. **Analysis Phase**: 
   - Understand app type and requirements
   - Plan complete screen architecture (onboarding → auth → features → secondary)
   - Determine navigation structure
   - Select appropriate theme

2. **Generation Phase**:
   - Generate screens sequentially
   - Pass ALL previous screens as context to each new generation
   - Maintain design system consistency
   - Ensure navigation continuity

3. **Context Passing**:
   - Include HTML of all previous screens in each generation prompt
   - Extract common components and patterns
   - Reference specific styling decisions from previous screens
   - Maintain color, spacing, and typography consistency

### Prompt Structure

#### Analysis Prompt Updates
- Change max screens from 4 to 24
- Require comprehensive app structure planning
- Mandate onboarding flow (4 screens minimum)
- Require authentication screens
- Plan all feature screens
- Consider secondary screens (settings, profile, etc.)

#### Generation System Prompt Updates
- Add professional design guidelines
- Explicitly prohibit "vibe coded UI" patterns
- Emphasize modern, clean aesthetics
- Require modern icon usage (Lucide only)
- Add mobile navigation best practices
- Include UX principles (hierarchy, spacing, touch targets)

## Example Screen Structure for Complete App

### E-commerce App (Example)
1. Splash Screen
2. Onboarding 1: Welcome
3. Onboarding 2: Features
4. Onboarding 3: Benefits
5. Onboarding 4: Get Started
6. Login Screen
7. Sign Up Screen
8. Home/Dashboard
9. Product Listing
10. Product Detail
11. Shopping Cart
12. Checkout
13. Order Confirmation
14. Profile
15. Orders History
16. Search
17. Categories
18. Favorites/Wishlist
19. Notifications
20. Settings
21. Payment Methods
22. Addresses
23. Help/Support
24. About/More

### Fitness App (Example)
1. Splash Screen
2. Onboarding 1: Welcome
3. Onboarding 2: Goals
4. Onboarding 3: Permissions
5. Onboarding 4: Get Started
6. Login Screen
7. Sign Up Screen
8. Home Dashboard
9. Workout List
10. Workout Detail
11. Active Workout
12. Progress/Stats
13. Profile
14. Achievements
15. Social/Community
16. Search
17. Programs
18. Nutrition
19. Notifications
20. Settings
21. Premium/Upgrade
22. Help
23. About
24. More

## Quality Checklist

Before generating each screen, verify:
- [ ] Maintains consistency with previous screens
- [ ] Uses professional, clean design (not "vibe coded")
- [ ] Modern icons (Lucide) used appropriately
- [ ] Proper mobile navigation patterns
- [ ] Good visual hierarchy and spacing
- [ ] Appropriate touch targets (44x44px minimum)
- [ ] Clear typography hierarchy
- [ ] Consistent color usage from theme
- [ ] Proper context from previous screens
- [ ] Realistic, contextual data (not placeholders)

## Technical Implementation Notes

1. **Schema Update**: Change `max(4)` to `max(24)` in AnalysisSchema
2. **Context Passing**: Include all previous frames HTML in generation prompt
3. **Component Extraction**: Identify and reuse common patterns
4. **Theme Consistency**: Ensure same theme used across all screens
5. **Navigation Mapping**: Track which screen corresponds to which nav item
