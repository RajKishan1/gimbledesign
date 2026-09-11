import { jsonSchema, tool, type ToolSet } from "ai";

type UnsplashInput = {
  query: string;
  orientation?: "landscape" | "portrait" | "squarish";
};

export const hasUnsplashKey = () => Boolean(process.env.UNSPLASH_ACCESS_KEY);

export const unsplashTool = tool({
  description:
    "Search for high-quality images from Unsplash.  Use this when you need to add an <img> tag.",
  // Hand-written schema: providers such as Google Vertex (reached through
  // Runware) reject the zod-generated schema's `$schema`, `additionalProperties`
  // and `default` keys with a 400. Keep this to the plain OpenAPI subset.
  inputSchema: jsonSchema<UnsplashInput>({
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Image search query (e.g. 'modern loft', 'finance graph')",
      },
      orientation: {
        type: "string",
        enum: ["landscape", "portrait", "squarish"],
        description: "Image orientation. Defaults to landscape.",
      },
    },
    required: ["query"],
  }),
  execute: async ({ query, orientation = "landscape" }) => {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&orientation=${orientation}&per_page=1&client_id=${
          process.env.UNSPLASH_ACCESS_KEY
        }`
      );
      const { results } = await res.json();
      return results?.[0]?.urls?.regular || ``;
    } catch {
      return ``;
    }
  },
});

/**
 * Tools to offer a generation call. Without an Unsplash key the tool can only
 * ever return an empty string, so offering it just adds a wasted round-trip
 * (and on some providers a failing one). The prompts fall back to seeded
 * picsum.photos URLs in that case.
 */
export function imageTools(): ToolSet {
  return hasUnsplashKey() ? { searchUnsplash: unsplashTool } : {};
}
