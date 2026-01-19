import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateObject } from "ai";
import { z } from "zod";

const ANALYZE_PROMPT_SYSTEM = `You are an expert design intent analyzer. Your job is to understand what type of design the user wants to create based on their prompt.

# DESIGN TYPES

## 1. MOBILE APP DESIGN (type: "mobile")
Choose this when the user wants to create:
- Mobile application screens (iOS, Android apps)
- Mobile app UI/UX designs
- Phone app interfaces
- Mobile-first experiences
- Keywords: "app", "mobile app", "iOS app", "Android app", "phone app", "mobile design"

## 2. WEB APP DESIGN (type: "web")
Choose this when the user wants to create:
- Desktop web applications
- SaaS dashboards
- Admin panels
- Web-based software
- Browser-based tools
- Keywords: "dashboard", "web app", "website", "admin panel", "SaaS", "web design", "desktop", "browser"

## 3. CREATIVE DESIGN (type: "creative")
Choose this when the user wants to create:
- App Store preview screenshots
- Play Store screenshots
- Marketing materials
- Social media graphics
- Presentation slides
- Promotional banners
- Landing page hero sections
- Product mockups
- Portfolio showcases
- Brand identity visuals
- Keywords: "screenshot", "app store", "play store", "marketing", "promotional", "social media", "banner", "mockup", "preview"

# RULES
1. Analyze the user's intent carefully
2. If the prompt mentions "app" without "web", default to mobile
3. If the prompt mentions "dashboard", "admin", or "SaaS", choose web
4. If the prompt mentions "screenshots", "app store", "marketing", or "promotional", choose creative
5. Generate a concise, descriptive name for the project (3-5 words max)
6. For creative designs, also determine the appropriate dimensions based on context

# DIMENSION GUIDELINES FOR CREATIVE
- App Store Screenshots (iPhone): 1290x2796px (portrait) or 2796x1290px (landscape)
- App Store Screenshots (iPad): 2048x2732px
- Play Store Screenshots: 1080x1920px
- Social Media (Instagram): 1080x1080px (square) or 1080x1350px (portrait)
- Banner/Header: 1440x400px
- Presentation Slide: 1920x1080px
- Default creative: 1440x900px

Analyze the prompt and return the design type, project name, and dimensions (for creative).`;

const AnalysisSchema = z.object({
  designType: z.enum(["mobile", "web", "creative"]).describe("The type of design the user wants to create"),
  projectName: z.string().describe("A concise, descriptive name for the project (3-5 words)"),
  dimensions: z.object({
    width: z.number().describe("Width in pixels"),
    height: z.number().describe("Height in pixels"),
  }).optional().describe("Dimensions for creative designs"),
  confidence: z.number().min(0).max(1).describe("Confidence score for the detection (0-1)"),
  reasoning: z.string().describe("Brief explanation of why this design type was chosen"),
});

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    const selectedModel = model || "google/gemini-2.0-flash-001";

    const { object } = await generateObject({
      model: openrouter.chat(selectedModel),
      system: ANALYZE_PROMPT_SYSTEM,
      prompt: `Analyze this design prompt and determine what type of design the user wants to create:\n\n"${prompt}"`,
      schema: AnalysisSchema,
      temperature: 0.3,
    });

    // Set default dimensions based on design type if not provided
    let dimensions = object.dimensions;
    if (!dimensions) {
      switch (object.designType) {
        case "mobile":
          dimensions = { width: 430, height: 932 };
          break;
        case "web":
          dimensions = { width: 1440, height: 900 };
          break;
        case "creative":
          dimensions = { width: 1290, height: 2796 }; // Default to App Store iPhone
          break;
      }
    }

    return NextResponse.json({
      success: true,
      designType: object.designType,
      projectName: object.projectName,
      dimensions,
      confidence: object.confidence,
      reasoning: object.reasoning,
    });
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    // Default to mobile if analysis fails
    return NextResponse.json({
      success: false,
      designType: "mobile",
      projectName: "New Project",
      dimensions: { width: 430, height: 932 },
      confidence: 0,
      reasoning: "Failed to analyze, defaulting to mobile",
      error: "Failed to analyze prompt",
    });
  }
}
