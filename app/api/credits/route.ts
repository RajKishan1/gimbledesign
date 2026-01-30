import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user with default credits
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      // Create user with 10 free credits
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 10.0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        credits: userRecord.credits,
      },
    });
  } catch (error) {
    console.log("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (typeof amount !== "number") {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Find or create user
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 10.0,
        },
      });
    }

    // Update credits (deduct or add)
    const newCredits = Math.max(0, userRecord.credits + amount);

    const updatedUser = await prisma.user.update({
      where: { userId: user.id },
      data: { credits: newCredits },
    });

    return NextResponse.json({
      success: true,
      data: {
        credits: updatedUser.credits,
      },
    });
  } catch (error) {
    console.log("Error updating credits:", error);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 },
    );
  }
}
