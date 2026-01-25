import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Retrieve chat messages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get chat messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get chat messages error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat messages" },
      { status: 500 }
    );
  }
}

// POST - Create a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, frameId, role = "user" } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If frameId is provided, verify it belongs to the project
    if (frameId) {
      const frame = await prisma.frame.findFirst({
        where: {
          id: frameId,
          projectId: projectId,
        },
      });

      if (!frame) {
        return NextResponse.json({ error: "Frame not found" }, { status: 404 });
      }
    }

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        projectId: projectId,
        frameId: frameId || null,
        message: message,
        role: role,
      },
    });

    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error("Create chat message error:", error);
    return NextResponse.json(
      { error: "Failed to create chat message" },
      { status: 500 }
    );
  }
}
