import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { dataUrlToBuffer, fitToStoreSize } from "@/lib/app-store/images";
import { EXPORT_TARGET_IDS, EXPORT_TARGETS } from "@/lib/app-store/specs";

export const maxDuration = 60;

const bodySchema = z.object({
  screenId: z.string().min(1),
  target: z.enum(EXPORT_TARGET_IDS),
});

/** Resize a finished screen to an exact store size and return it as PNG. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "screenId and a valid target are required" }, { status: 400 });
    }
    const { screenId, target } = parsed.data;

    const set = await prisma.appStoreSet.findFirst({
      where: { projectId, userId: user.id },
      select: { id: true, brief: true },
    });
    if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 });

    const screen = await prisma.appStoreScreen.findFirst({
      where: { id: screenId, setId: set.id, status: "done" },
      select: { index: true, canvasImageId: true },
    });
    if (!screen?.canvasImageId) {
      return NextResponse.json({ error: "Screen is not rendered yet" }, { status: 404 });
    }

    const image = await prisma.canvasImage.findFirst({
      where: { id: screen.canvasImageId, projectId },
      select: { src: true },
    });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const { buffer } = dataUrlToBuffer(image.src);
    const spec = EXPORT_TARGETS[target];
    const png = await fitToStoreSize(buffer, { width: spec.width, height: spec.height });

    const appName = ((set.brief as { appName?: string })?.appName ?? "app")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = `${appName || "app"}-${String(screen.index + 1).padStart(2, "0")}-${target}-${spec.width}x${spec.height}.png`;

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[app-store] export failed:", error);
    return NextResponse.json({ error: "Failed to export screen" }, { status: 500 });
  }
}
