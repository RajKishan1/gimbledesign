import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

const GPT_VISION_MODEL = "openai/gpt-4o";

/**
 * Describe an image from buffer using GPT vision. Used by describe-image API and inspiration-redesign.
 */
export async function describeImageFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const { text } = await generateText({
    model: openrouter.chat(GPT_VISION_MODEL),
    maxOutputTokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are describing a reference design so it can be re-designed with the same context.

Describe in detail:
1. SCOPE: Is this a single component (e.g. a calendar widget, a card, a form, a set of principle cards) or a full app/screen (e.g. entire dashboard, full page)? Answer with exactly: "component" or "full screen".
2. WHAT IT IS: The exact type of design (e.g. "grid of 16 UI/UX principle cards", "month calendar", "login form", "pricing table").
3. CONTENT & STRUCTURE: Layout (grid, list, sections), number of items, labels/text, hierarchy. List any visible labels or concepts.
4. STYLE: Colors (dominant palette, e.g. purple accents, white background), visual style (minimal, flat, rounded corners, shadows), typography if noticeable.
5. MOOD/THEME: Professional, playful, dark, light, etc.

Be precise so a designer can re-create the same type of thing with four different visual variations without changing what it is.`,
          },
          {
            type: "image",
            image: dataUrl,
            mediaType: mimeType,
          },
        ],
      },
    ],
  });

  return text?.trim() ?? "Could not describe image.";
}
