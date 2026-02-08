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
- Landing pages
- Websites
- Keywords: "dashboard", "web app", "website", "admin panel", "SaaS", "web design", "desktop", "browser", "landing page"

# RULES
1. Analyze the user's intent carefully
2. If the prompt mentions "app" without "web", default to mobile
3. If the prompt mentions "dashboard", "admin", "SaaS", "website", or "landing page", choose web
4. Generate a concise, descriptive name for the project (3-5 words max)

Analyze the prompt and return the design type and project name.`;

const AnalysisSchema = z.object({
  designType: z.enum(["mobile", "web"]).describe("The type of design the user wants to create"),
  projectName: z.string().describe("A concise, descriptive name for the project (3-5 words)"),
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

    // Set default dimensions based on design type
    const dimensions = object.designType === "web" 
      ? { width: 1440, height: 900 }
      : { width: 393, height: 852 };

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
      dimensions: { width: 393, height: 852 },
      confidence: 0,
      reasoning: "Failed to analyze, defaulting to mobile",
      error: "Failed to analyze prompt",
    });
  }
}
