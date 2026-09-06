import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// Credits are read-only from the client. They are deducted server-side by the
// generation routes and granted by the Polar webhook — never by user request.
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
      // Create user with 100 free credits
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 100.0,
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
