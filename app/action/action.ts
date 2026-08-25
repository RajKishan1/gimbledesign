"use server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";

export async function generateProjectName(
  prompt: string,
  model: string = "google/gemini-2.5-flash-lite"
) {
  try {
    const { text } = await generateText({
      model: openrouter.chat(model),
      system: `
        You are an AI assistant that generates very very short project names based on the user's prompt.
        - Keep it under 5 words.
        - Capitalize words appropriately.
        - Do not include special characters.
      `,
      prompt: prompt,
    });
    return text?.trim() || fallbackName(prompt);
  } catch (error) {
    console.log(error);
    return fallbackName(prompt);
  }
}

/** Title-cased first words of the prompt — better than "Untitled Project"
 *  when the naming model is unavailable. */
function fallbackName(prompt: string): string {
  const words = prompt
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(" ") || "Untitled Project";
}
