import { generateText } from "ai";
import { openrouter } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { FAST_MODEL } from "@/constant/models";
import {
  TEMPLATES,
  type TemplateColors,
  pickTemplateIndex,
  renderTemplate,
} from "@/lib/thumbnail-templates";

/**
 * Builds a small, aesthetic SVG thumbnail for a project by combining a
 * curated template (picked deterministically from `lib/thumbnail-templates.ts`)
 * with a 3-color palette extracted from the project idea via a tiny LLM call.
 *
 * Design goals:
 * - Production-grade visuals: hand-crafted templates always look good.
 * - Per-project uniqueness: templates rotate by project id, colors are derived
 *   from the project's prompt/name.
 * - Cheap and fast: the LLM only returns ~30 tokens of JSON, not full SVG.
 * - Resilient: if the LLM call fails or returns garbage, falls back to a
 *   device-typed palette so every project still gets a polished thumbnail.
 *
 * Result is stored as a base64 data URL on `project.thumbnail`. Designed to
 * be invoked fire-and-forget from project-creation hooks.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const COLOR_TIMEOUT_MS = 6000;

/** Saturated, dashboard-friendly fallbacks per device type. */
const DEVICE_FALLBACK: Record<string, TemplateColors> = {
  mobile: { c1: "#f97316", c2: "#f59e0b", c3: "#fde68a" },
  web: { c1: "#6366f1", c2: "#8b5cf6", c3: "#c4b5fd" },
  wireframe: { c1: "#3b82f6", c2: "#6366f1", c3: "#bfdbfe" },
  inspirations: { c1: "#ec4899", c2: "#a855f7", c3: "#fbcfe8" },
};

function fallbackColors(deviceType: string | null | undefined): TemplateColors {
  const key = typeof deviceType === "string" ? deviceType : "";
  return DEVICE_FALLBACK[key] ?? DEVICE_FALLBACK.mobile;
}

const COLOR_SYSTEM_PROMPT = `You pick color palettes for abstract UI thumbnails.

Output ONLY a JSON object with exactly three keys, each a 6-digit hex color:
{"c1":"#xxxxxx","c2":"#xxxxxx","c3":"#xxxxxx"}

Rules:
- c1 = primary background color (rich, saturated).
- c2 = secondary accent (clearly different hue from c1, harmonious).
- c3 = highlight or pop color (lighter or brighter than c1/c2).
- All three must be visually distinct from each other.
- Avoid pure black, pure white, or near-grey colors unless the brief explicitly demands it.
- No commentary, no markdown, no code fences. JSON only.`;

function buildColorPrompt(args: {
  projectName: string | null;
  initialPrompt: string | null;
  deviceType: string | null;
}): string {
  const { projectName, initialPrompt, deviceType } = args;
  const lines: string[] = [];

  if (initialPrompt && initialPrompt.trim()) {
    lines.push(`Project idea: "${initialPrompt.trim().slice(0, 240)}"`);
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
    lines.push("No specific brief — pick a calm, modern, premium palette.");
  }
  lines.push("Return JSON only.");
  return lines.join("\n");
}

/** Strip code fences and extract the first JSON object substring. */
function extractJson(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

function parseColors(raw: string): TemplateColors | null {
  const json = extractJson(raw);
  if (!json) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const c1 = typeof o.c1 === "string" ? o.c1.trim() : "";
  const c2 = typeof o.c2 === "string" ? o.c2.trim() : "";
  const c3 = typeof o.c3 === "string" ? o.c3.trim() : "";
  if (!HEX_RE.test(c1) || !HEX_RE.test(c2) || !HEX_RE.test(c3)) return null;
  return { c1, c2, c3 };
}

async function fetchColorsFromLLM(args: {
  projectName: string | null;
  initialPrompt: string | null;
  deviceType: string | null;
}): Promise<TemplateColors | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COLOR_TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model: openrouter.chat(FAST_MODEL),
      system: COLOR_SYSTEM_PROMPT,
      prompt: buildColorPrompt(args),
      temperature: 0.85,
      maxOutputTokens: 120,
      abortSignal: controller.signal,
    });
    return parseColors(text ?? "");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Lightweight defensive validation before storing the SVG. */
function validateSvg(svg: string): boolean {
  if (!svg) return false;
  if (!svg.startsWith("<svg")) return false;
  if (!svg.trimEnd().endsWith("</svg>")) return false;
  if (/<script\b/i.test(svg)) return false;
  if (/<foreignObject\b/i.test(svg)) return false;
  if (svg.length > 8 * 1024) return false;
  return true;
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
      },
    });
    if (!project) return null;

    const llmColors = await fetchColorsFromLLM({
      projectName: project.name,
      initialPrompt: project.initialPrompt,
      deviceType: project.deviceType,
    });
    const colors = llmColors ?? fallbackColors(project.deviceType);

    const templateIdx = pickTemplateIndex(project.id);
    const template = TEMPLATES[templateIdx];
    const svg = renderTemplate(template, colors);

    if (!validateSvg(svg)) {
      console.warn(
        `[thumbnail] template ${templateIdx} produced invalid SVG for project ${projectId}`,
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
