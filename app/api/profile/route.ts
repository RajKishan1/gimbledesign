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

    // Find or create user
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      // Create user with default credits
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 10.0,
          totalCreditsUsed: 0.0,
          name: user.name ?? null,
          email: user.email ?? null,
          profilePicture: user.image ?? null,
        },
      });
    } else {
      if (!userRecord.name || !userRecord.email || !userRecord.profilePicture) {
        userRecord = await prisma.user.update({
          where: { userId: user.id },
          data: {
            name: userRecord.name || user.name || null,
            email: userRecord.email || user.email || null,
            profilePicture: userRecord.profilePicture || user.image || null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userRecord.id,
        userId: userRecord.userId,
        name: userRecord.name || user.name || "",
        email: userRecord.email || user.email || "",
        profilePicture: userRecord.profilePicture || user.image || null,
        headerImage: userRecord.headerImage,
        credits: userRecord.credits,
        totalCreditsUsed: userRecord.totalCreditsUsed || 0,
      },
    });
  } catch (error) {
    console.log("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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

    const body = await request.json();
    const { name, email, profilePicture, headerImage } = body;

    // Find or create user
    let userRecord = await prisma.user.findUnique({
      where: { userId: user.id },
    });

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          userId: user.id,
          credits: 10.0,
          totalCreditsUsed: 0.0,
          name: name || user.name || null,
          email: email || user.email || null,
          profilePicture: profilePicture || user.image || null,
          headerImage: headerImage || null,
        },
      });
    } else {
      // Update only provided fields
      const updateData: {
        name?: string;
        email?: string;
        profilePicture?: string;
        headerImage?: string;
      } = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (profilePicture !== undefined)
        updateData.profilePicture = profilePicture;
      if (headerImage !== undefined) updateData.headerImage = headerImage;

      userRecord = await prisma.user.update({
        where: { userId: user.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userRecord.id,
        userId: userRecord.userId,
        name: userRecord.name || user.name || "",
        email: userRecord.email || user.email || "",
        profilePicture: userRecord.profilePicture || user.image || null,
        headerImage: userRecord.headerImage,
        credits: userRecord.credits,
        totalCreditsUsed: userRecord.totalCreditsUsed || 0,
      },
    });
  } catch (error) {
    console.log("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
