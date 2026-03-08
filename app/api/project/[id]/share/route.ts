import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function generateShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * GET: return current share status (shareUrl if shared, else null).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      select: { shareToken: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const shareUrl = project.shareToken
      ? (baseUrl ? `${baseUrl}/p/${project.shareToken}` : `/p/${project.shareToken}`)
      : null;

    return NextResponse.json({
      shared: !!project.shareToken,
      shareToken: project.shareToken ?? null,
      shareUrl,
    });
  } catch (error) {
    console.error("[project share] GET error:", error);
    return NextResponse.json(
      { error: "Failed to get share status" },
      { status: 500 }
    );
  }
}

/**
 * POST: enable sharing (create share link if not already shared).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      select: { id: true, shareToken: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let token = project.shareToken;
    if (!token) {
      let candidate = generateShareToken();
      let exists = await prisma.project.findUnique({
        where: { shareToken: candidate },
        select: { id: true },
      });
      while (exists) {
        candidate = generateShareToken();
        exists = await prisma.project.findUnique({
          where: { shareToken: candidate },
          select: { id: true },
        });
      }
      await prisma.project.update({
        where: { id: project.id },
        data: { shareToken: candidate },
      });
      token = candidate;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const shareUrl = baseUrl ? `${baseUrl}/p/${token}` : `/p/${token}`;

    return NextResponse.json({
      shareToken: token,
      shareUrl,
      shared: true,
    });
  } catch (error) {
    console.error("[project share] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: revoke share link (set shareToken to null).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await headers());
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { shareToken: null },
    });

    return NextResponse.json({ shared: false, shareUrl: null });
  } catch (error) {
    console.error("[project share] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
