import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizeRole } from "@/types/user";

/**
 * Guard for admin-only API routes.
 *
 * Returns `{ user }` when the caller is an admin, or a `NextResponse` error
 * (401 / 403) to short-circuit the handler.
 *
 * Usage:
 *   const gate = await requireAdmin();
 *   if (gate instanceof NextResponse) return gate;
 *   const { user } = gate;
 */
export async function requireAdmin() {
  const session = await getSession(await headers());
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.user.findUnique({
    where: { userId: user.id },
  });
  const role = normalizeRole(record?.role);
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin only." },
      { status: 403 },
    );
  }

  return { user };
}
