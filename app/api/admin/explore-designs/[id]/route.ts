import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

/**
 * DELETE — remove an explore design.
 * Best-effort Cloudinary cleanup (we still delete the DB row even if the
 * remote delete fails — orphaned Cloudinary assets are recoverable manually).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (gate instanceof NextResponse) return gate;

  try {
    const { id } = await params;

    const design = await prisma.exploreDesign.findUnique({ where: { id } });
    if (!design) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      await cloudinary.uploader.destroy(design.publicId);
    } catch (e) {
      console.warn("[admin/explore-designs DELETE] Cloudinary remove failed", e);
    }

    await prisma.exploreDesign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/explore-designs DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 },
    );
  }
}
