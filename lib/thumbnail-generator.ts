import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { FAST_MODEL } from "@/constant/models";

/**
 * Generates a small, aesthetic SVG thumbnail for a project using an existing
 * text LLM (Gemini Flash via OpenRouter), then stores it as a base64 data URL
 * in `project.thumbnail`.
 *
 * Designed to be cheap (one short prompt → ~1–4KB of SVG) and fast (Flash
 * tier model). Returns the data URL on success, or `null` on any failure.
 *
 * Intended to be called fire-and-forget from project-creation hooks.
 */

const SYSTEM_PROMPT = `You design tiny, abstract SVG thumbnails for a UI-design product gallery.

Strict requirements:
- Output ONLY raw SVG markup. No markdown fences, no commentary, no <?xml prolog.
- Use exactly viewBox="0 0 400 300" and preserveAspectRatio="xMidYMid slice".
- Keep the file tiny: under 2KB, no more than ~12 elements total.
- Visual style: minimal, modern, soft, professional. Abstract shapes only.
  Use 2–4 harmonious colors picked to match the project's vibe. Prefer soft
  gradients (linearGradient or radialGradient) for the background.
- Composition: a colored gradient background covering the whole canvas, then
  1–6 overlapping shapes (circles, rounded rects, soft blobs, simple curves).
  Use translucent fills (opacity 0.4–0.85) for layered depth.
- NO text, NO words, NO letters, NO logos, NO emoji, NO photographic detail,
  NO icons of devices/people. Pure abstract geometry only.
- Do NOT include <script>, <foreignObject>, or external references.
- The entire output must start with "<svg" and end with "</svg>".`;

function buildUserPrompt(args: {
  projectName: string | null;
  initialPrompt: string | null;
  deviceType: string | null;
}): string {
  const { projectName, initialPrompt, deviceType } = args;

  const lines: string[] = [];
  if (initialPrompt && initialPrompt.trim()) {
    lines.push(`User's idea: "${initialPrompt.trim().slice(0, 240)}"`);
  }
  if (
    projectName &&
    projectName.trim() &&
    !/^untitled/i.test(projectName.trim())
  ) {
    lines.push(`Project name: "${projectName.trim()}"`);
  }
  if (deviceType) {
    const surface =
      deviceType === "web"
        ? "web app"
        : deviceType === "mobile"
          ? "mobile app"
          : deviceType === "wireframe"
            ? "wireframe"
            : "design";
    lines.push(`Surface: ${surface}`);
  }
  if (lines.length === 0) {
    lines.push("No specific idea — produce a generic, calm, modern thumbnail.");
  }
  lines.push("Generate the SVG thumbnail now. SVG only.");
  return lines.join("\n");
}

/** Strips wrapping fences/whitespace and validates the output is an SVG document. */
function sanitizeSvg(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  // Strip ```svg ... ``` or ``` ... ``` if the model misbehaves.
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:svg|xml)?\s*/i, "").replace(/```\s*$/i, "");
    s = s.trim();
  }
  // Strip optional XML prolog.
  s = s.replace(/^<\?xml[^?]*\?>\s*/i, "");
  // Cut off anything after the closing tag (model commentary etc.).
  const closeIdx = s.lastIndexOf("</svg>");
  if (closeIdx === -1) return null;
  s = s.slice(0, closeIdx + "</svg>".length);
  if (!/^<svg[\s>]/i.test(s)) return null;
  // Block obviously dangerous content.
  if (/<script\b/i.test(s) || /<foreignObject\b/i.test(s)) return null;
  // Hard size cap (defensive): 8KB raw SVG.
  if (s.length > 8 * 1024) return null;
  // Inject xmlns if missing — required for base64 data URLs rendered in <img> tags.
  if (!/\bxmlns\s*=/i.test(s)) {
    s = s.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return s;
}

function toDataUrl(svg: string): string {
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

export async function generateProjectThumbnail(
  projectId: string,
): Promise<string | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        initialPrompt: true,
        deviceType: true,
        thumbnail: true,
      },
    });
    if (!project) return null;

    const userPrompt = buildUserPrompt({
      projectName: project.name,
      initialPrompt: project.initialPrompt,
      deviceType: project.deviceType,
    });

    const { text } = await generateText({
      model: openrouter.chat(FAST_MODEL),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.9,
      maxOutputTokens: 2000,
    });

    const svg = sanitizeSvg(text ?? "");
    if (!svg) {
      console.warn(
        `[thumbnail] model returned invalid SVG for project ${projectId}`,
      );
      return null;
    }

    const dataUrl = toDataUrl(svg);

    await prisma.project.update({
      where: { id: projectId },
      data: { thumbnail: dataUrl },
    });

    return dataUrl;
  } catch (error) {
    console.error(
      `[thumbnail] failed to generate for project ${projectId}:`,
      error,
    );
    return null;
  }
}
