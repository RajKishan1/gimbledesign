import "server-only";

export type PrefetchedImage = { query: string; url: string; width: number; height: number };

/**
 * Resolve image queries to URLs *before* generation so the model never has to
 * make a tool round-trip. With an Unsplash key, real photos; without one, a
 * seeded picsum.photos URL (stable per query, always resolves). Failures are
 * swallowed: an image is never worth failing a screen over.
 */
export async function prefetchImages(
  queries: Array<{ query: string; orientation?: "landscape" | "portrait" | "squarish" }>,
): Promise<PrefetchedImage[]> {
  const unique = new Map<string, { query: string; orientation: "landscape" | "portrait" | "squarish" }>();
  for (const q of queries) {
    const query = q.query.trim().toLowerCase();
    if (query && !unique.has(query)) unique.set(query, { query, orientation: q.orientation ?? "landscape" });
  }
  if (unique.size === 0) return [];

  const key = process.env.UNSPLASH_ACCESS_KEY;
  const dims = (o: string) =>
    o === "portrait" ? { width: 600, height: 800 } : o === "squarish" ? { width: 600, height: 600 } : { width: 800, height: 500 };

  const fallback = ({ query, orientation }: { query: string; orientation: string }): PrefetchedImage => {
    const { width, height } = dims(orientation);
    const seed = query.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
    return { query, url: `https://picsum.photos/seed/${seed}/${width}/${height}`, width, height };
  };

  if (!key) return [...unique.values()].map(fallback);

  return Promise.all(
    [...unique.values()].map(async (q) => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q.query)}&orientation=${q.orientation}&per_page=1&client_id=${key}`,
          { signal: AbortSignal.timeout(4000) },
        );
        const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string }; width?: number; height?: number }> };
        const hit = data.results?.[0];
        if (hit?.urls?.regular) {
          return { query: q.query, url: hit.urls.regular, width: hit.width ?? 800, height: hit.height ?? 500 };
        }
      } catch {
        /* fall through */
      }
      return fallback(q);
    }),
  );
}

/** Prompt block listing the images a screen may use. */
export function availableImagesBlock(images: PrefetchedImage[]): string {
  if (images.length === 0) return "";
  return `AVAILABLE IMAGES (use these exact URLs for photos on this screen — do not invent others):
${images.map((i) => `- ${i.query}: ${i.url}`).join("\n")}`;
}
