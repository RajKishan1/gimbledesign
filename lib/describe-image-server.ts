import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

const GPT_VISION_MODEL = "openai/gpt-5.4-mini";

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
3. LAYOUT STRUCTURE (top to bottom, in order): every section with its arrangement — exact grid column counts, which cards span wider, list vs grid vs horizontal scroll, navigation type and item count (bottom tabs / sidebar / top tabs), header composition (back button? avatar? actions?).
4. CONTENT: visible labels, headings, numbers, and button text exactly as shown; item counts (e.g. "list of 4 sessions").
5. STYLE: dominant palette with approximate hex values, where the accent color is used, corner radius scale, shadow/border treatment, spacing density (compact/comfortable/airy), typography patterns (weights, all-caps labels, oversized numerals).
6. MOOD/THEME: Professional, playful, dark, light, etc.

Be precise so a designer can re-create the same structure with different visual variations without changing what it is or how it is arranged.`,
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
