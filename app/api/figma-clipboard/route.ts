import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * POST /api/figma-clipboard
 * Body: { html: string, width?: number } — full document HTML and optional viewport width (e.g. 1440 for web, 393 for mobile)
 * Calls code.to.design clipboard API and returns Figma clipboard data.
 * Injects viewport width so conversion uses correct dimensions (fixes web vs mobile).
 * @see https://docs-code.to.design/clipboard-mode
 */
export async function POST(req: Request) {
  try {
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.CODE_TO_DESIGN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CODE_TO_DESIGN_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const { html, width } = await req.json();
    if (typeof html !== "string" || !html.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid html" },
        { status: 400 },
      );
    }

    // Viewport width: use sent value (393 mobile, 1440 web) so pasted Figma frame matches device
    const viewportWidth = typeof width === "number" && width > 0 ? width : 393;

    // Keep full HTML with scripts so Tailwind CDN runs and compiles utility classes to CSS.
    // code.to.design needs the resulting styled document; stripping scripts left only raw HTML (no CSS).
    const htmlToSend = html;

    // Inject viewport + root width constraint so conversion and paste use correct width (mobile 393 vs web 1440)
    const viewportMeta = `<meta name="viewport" content="width=${viewportWidth}, initial-scale=1"/>`;
    const rootWidthStyle = `<style id="figma-clipboard-viewport">html,body,#root{width:${viewportWidth}px !important;max-width:${viewportWidth}px !important;}</style>`;
    let htmlWithViewport = htmlToSend.replace(
      /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/i,
      viewportMeta,
    );
    if (htmlWithViewport === htmlToSend && /<head[^>]*>/i.test(htmlToSend)) {
      htmlWithViewport = htmlToSend.replace(
        /(<head[^>]*>)/i,
        `$1\n  ${viewportMeta}\n  ${rootWidthStyle}`,
      );
    } else if (!htmlWithViewport.includes("figma-clipboard-viewport")) {
      htmlWithViewport = htmlWithViewport.replace(
        /(<head[^>]*>)/i,
        `$1\n  ${rootWidthStyle}`,
      );
    }

    const response = await fetch("https://api.to.design/html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ html: htmlWithViewport.trim(), clip: true }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("code.to.design error:", response.status, errText);
      let message = "Figma clipboard conversion failed";
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.message) message = parsed.message;
        else if (parsed?.error)
          message =
            typeof parsed.error === "string" ? parsed.error : String(parsed.error);
      } catch {
        if (errText && errText.length < 200) message = errText;
        else if (errText)
          message = `${response.status}: ${errText.slice(0, 120)}…`;
      }
      return NextResponse.json(
        { error: message, status: response.status },
        { status: 502 },
      );
    }

    const clipboardData = await response.text();
    return new NextResponse(clipboardData, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("figma-clipboard error:", error);
    return NextResponse.json(
      { error: "Failed to prepare Figma clipboard" },
      { status: 500 },
    );
  }
}
