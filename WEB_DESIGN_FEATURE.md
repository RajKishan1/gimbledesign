# Web Design Generation Feature

## Overview
This feature adds support for generating web application designs (1440px width) alongside the existing mobile app design generation (430px width). Users can now choose between mobile and web when creating a new project.

---

## Changes Made

### 1. **Device Type Constants** (`constant/canvas.ts`)
Added new constants for device type support:
- `DEVICE_TYPE_ENUM`: Enum for "mobile" and "web" device types
- `DeviceType`: TypeScript type for device types
- `DEVICE_DIMENSIONS`: Constant defining dimensions for both device types
  - Mobile: 430×932px (iPhone 17 Pro Max)
  - Web: 1440×900px (Desktop)

### 2. **New Inngest Function** (`inngest/functions/generateWebScreens.ts`)
Created a specialized web screen generation function:
- **Event**: `ui/generate.web-screens`
- **Screen Structure**: 8-20 screens (10-15 recommended)
  - 2-3 Authentication screens (Login, Signup, Forgot Password)
  - 6-10 Core feature screens (Dashboard, features, details, analytics)
  - 3-5 Secondary screens (Settings, Profile, Help, Admin, Reports)
- **Key Differences from Mobile**:
  - Uses `WEB_GENERATION_SYSTEM_PROMPT` and `WEB_ANALYSIS_PROMPT`
  - Sets `deviceType: "web"` in project
  - Optimized for 1440px width layouts
  - Focuses on desktop-first patterns (sidebar nav, multi-column layouts)

### 3. **Web-Specific Prompts** (`lib/prompt.ts`)
Added two new comprehensive prompts:

#### `WEB_GENERATION_SYSTEM_PROMPT`
- Desktop-first layout instructions (1440px width)
- Sidebar navigation patterns (240-280px wide fixed left sidebar)
- Multi-column grid layouts (2-col, 3-col, 4-col)
- Desktop-optimized components (data tables, charts, dashboards)
- Proper hover states and interactions
- Avoids mobile-specific patterns (bottom nav, large touch targets)

#### `WEB_ANALYSIS_PROMPT`
- Plans complete web applications (10-15 screens)
- Web-appropriate navigation structure
- Desktop layout planning (sidebar vs top navbar)
- Desktop-optimized screen types (dashboards, analytics, admin panels)

### 4. **API Route Updates** (`app/api/project/route.ts`)
Modified POST endpoint to:
- Accept `deviceType` parameter (defaults to "mobile")
- Route to appropriate Inngest event:
  - `deviceType === "web"` → `ui/generate.web-screens`
  - `deviceType === "mobile"` → `ui/generate.screens`
- Store deviceType in project record

### 5. **Database Schema** (`prisma/schema.prisma`)
Added `deviceType` field to Project model:
```prisma
deviceType String @default("mobile") // "mobile" or "web"
```

### 6. **Device Type Modal Integration** (`app/(routes)/_common/landing-section.tsx`)
Updated landing page flow:
1. User enters prompt and clicks "Design"
2. Shows DeviceTypeModal with two options:
   - **Web Design**: 1440px width - Desktop interface
   - **Mobile Design**: 420px width - Mobile app interface
3. User selects device type
4. Prompt is enhanced (if enhancement enabled)
5. Project created with selected device type

### 7. **Canvas Context** (`context/canvas-context.tsx`)
Added deviceType support:
- New `deviceType` field in context (type: `"mobile" | "web"`)
- Accepts `initialDeviceType` prop in CanvasProvider
- Provides deviceType to all consuming components

### 8. **Device Frame Component** (`components/canvas/device-frame.tsx`)
Updated to support both device types:
- Reads `deviceType` from canvas context
- Dynamic dimensions:
  - Mobile: 430×932px
  - Web: 1440×900px
- Adaptive border radius:
  - Mobile: `rounded-[36px]` (iPhone-style)
  - Web: `rounded-lg` (desktop window-style)
- All operations (screenshot, Figma export) use correct dimensions

### 9. **Canvas Component** (`components/canvas/index.tsx`)
Updated frame positioning:
- Mobile frames: 480px spacing
- Web frames: 1500px spacing
- Reads deviceType from context to calculate proper spacing

### 10. **Project Page** (`app/(routes)/project/[id]/page.tsx`)
Passes deviceType to CanvasProvider:
```tsx
initialDeviceType={project?.deviceType as "mobile" | "web" || "mobile"}
```

### 11. **TypeScript Types** (`types/project.ts`)
Added `deviceType` field to ProjectType:
```typescript
deviceType?: "mobile" | "web";
```

### 12. **Feature Hook** (`features/use-project.ts`)
Updated useCreateProject mutation to accept deviceType parameter:
```typescript
mutationFn: async (data: { 
  prompt: string; 
  model?: string; 
  deviceType?: "mobile" | "web" 
})
```

### 13. **Inngest Route** (`app/api/inngest/route.ts`)
Registered new web generation function:
```typescript
functions: [
  helloWorld,
  generateScreens,      // Mobile
  generateWebScreens,   // Web (NEW)
  regenerateFrame,
]
```

### 14. **Landing Page Copy** (`app/(routes)/_common/landing-section.tsx`)
Updated hero section:
- Heading: "Design mobile **& web apps** in minutes"
- Description: "Go from idea to beautiful **mobile or web** mockups..."

---

## Key Design Principles

### Web-Specific UI Patterns
1. **Sidebar Navigation**: Fixed left sidebar (240-280px) with vertical menu
2. **Multi-Column Layouts**: Grid systems (grid-cols-2, grid-cols-3, grid-cols-4)
3. **Top Navbar**: Alternative to sidebar with horizontal menu
4. **Desktop-Optimized Components**:
   - Data tables with proper structure
   - Dashboard cards in grid layouts
   - Large charts and visualizations
   - Breadcrumbs and page titles
5. **Hover States**: All interactive elements have hover feedback
6. **Spacing**: Generous whitespace (16px, 24px, 32px, 48px scale)

### Mobile-Specific UI Patterns (Existing)
1. **Bottom Navigation**: Floating, rounded-full, glassmorphic
2. **Single Column Layouts**: Optimized for narrow screens
3. **Large Touch Targets**: Minimum 44×44px
4. **Vertical Scrolling**: Primary navigation pattern

---

## Screen Structure Comparison

### Mobile Apps (18-20 screens)
1. Onboarding (4 screens): Splash, Feature Intro 1, Feature Intro 2, Get Started
2. Authentication (3 screens): Login, Sign Up, Forgot Password
3. Core Features (8-10 screens): Home, primary features
4. Secondary (4-5 screens): Profile, Settings, Search, Notifications, Help

### Web Apps (10-15 screens)
1. Authentication (2-3 screens): Login, Sign Up, Forgot Password
2. Core Features (6-10 screens): Dashboard, primary features, analytics
3. Secondary (3-5 screens): Settings, Profile, Help, Admin, Reports

*Web apps typically need fewer screens than mobile apps because:*
- More information can fit per screen
- Navigation is more compact (sidebar vs bottom nav)
- Less need for onboarding flow
- Combine multiple mobile screens into one web screen

---

## Usage Flow

1. **User lands on homepage**
2. **Enters prompt**: "Create a project management dashboard"
3. **Clicks "Design" button**
4. **Modal appears**: "Select Design Type"
   - Option 1: Web Design (1440px width - Desktop interface)
   - Option 2: Mobile Design (420px width - Mobile app interface)
5. **User selects device type**
6. **System enhances prompt** (optional)
7. **Creates project** with selected device type
8. **Triggers appropriate Inngest function**:
   - Web → `generateWebScreens`
   - Mobile → `generateScreens`
9. **AI generates 10-15 screens** (web) or **18-20 screens** (mobile)
10. **Renders frames** with correct dimensions in canvas

---

## Testing Checklist

- [ ] Create new mobile project - verify 430×932px frames
- [ ] Create new web project - verify 1440×900px frames
- [ ] Web projects show sidebar navigation patterns
- [ ] Mobile projects show bottom navigation patterns
- [ ] Frame spacing is correct (480px mobile, 1500px web)
- [ ] Screenshot export works for both device types
- [ ] Figma export works for both device types
- [ ] Device type persists when reopening project
- [ ] Regenerate frame works for both device types
- [ ] Real-time updates work for both device types
- [ ] Theme switching works for both device types
- [ ] Font switching works for both device types

---

## Database Migration

After updating the Prisma schema, run:

```bash
# Generate Prisma client
npx prisma generate

# If needed, push schema changes (for development)
npx prisma db push

# Or create migration (for production)
npx prisma migrate dev --name add_device_type_to_project
```

---

## Future Enhancements

1. **Tablet Support**: Add 768px or 1024px width option
2. **Custom Dimensions**: Allow users to specify custom width/height
3. **Responsive Preview**: Toggle between mobile/tablet/desktop views
4. **Device Templates**: Pre-built device frames (iPhone, MacBook, etc.)
5. **Export Options**: Export as responsive HTML/CSS
6. **Component Library**: Extract reusable components from generated designs
7. **Design Systems**: Create and apply design system rules
8. **Collaboration**: Multi-user editing and commenting

---

## Notes

- Web generation uses the same theme system as mobile
- All 22 themes work for both device types
- Font system is shared between mobile and web
- Context maintenance works across both device types
- Prototype mode works for both device types
- Export features (PNG, Figma, HTML) support both device types

---

## Credits Cost

- Both mobile and web project creation cost **1 credit**
- No difference in cost between device types
- Regeneration of individual frames is free (no additional credit cost)
