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
    maxTokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe what is in this image in detail. Include the main subject, layout, colors, style, and any text or notable elements. Focus on what kind of design or content it is (e.g. calendar, card, dashboard, poster).",
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
