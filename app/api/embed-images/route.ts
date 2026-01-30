import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * POST /api/embed-images
 * Body: { urls: string[] }
 * Returns: { images: Record<string, string> } - URL -> base64 string
 * Used by Figma export to embed image data so the plugin can create IMAGE fills.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ images: {} });
    }

    const images: Record<string, string> = {};
    await Promise.all(
      urls.map(async (url: string) => {
        if (!url || typeof url !== "string") return;
        if (url.startsWith("data:")) {
          const base64 = url.split(",")[1];
          if (base64) images[url] = base64;
          return;
        }
        if (!url.startsWith("http")) return;
        try {
          const res = await fetch(url, {
            headers: { Accept: "image/*" },
            signal: AbortSignal.timeout(15000),
          });
          if (!res.ok) return;
          const buf = await res.arrayBuffer();
          const base64 = Buffer.from(buf).toString("base64");
          images[url] = base64;
        } catch {
          // Skip failed URLs
        }
      }),
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("embed-images error:", error);
    return NextResponse.json(
      { error: "Failed to embed images" },
      { status: 500 },
    );
  }
}
