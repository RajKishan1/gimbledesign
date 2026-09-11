import prisma from "@/lib/prisma";

export const FREE_CREDITS = 100;

/**
 * Make sure the billing row for a better-auth user exists (new users start
 * with FREE_CREDITS). Safe to call repeatedly.
 */
export async function ensureUserRecord(userId: string) {
  return prisma.user.upsert({
    where: { userId },
    update: {},
    create: { userId, credits: FREE_CREDITS },
  });
}

export type ChargeResult =
  | { ok: true; remaining: number }
  | { ok: false; credits: number };

/**
 * Atomically charge `amount` credits. The decrement is conditional on the
 * balance still covering the amount at write time, so two concurrent requests
 * can't both succeed against a balance that only covers one of them (the
 * read-then-write pattern used elsewhere has that race).
 */
export async function chargeCredits(
  userId: string,
  amount: number,
): Promise<ChargeResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("chargeCredits: amount must be a positive number");
  }

  const user = await ensureUserRecord(userId);

  const res = await prisma.user.updateMany({
    where: { userId, credits: { gte: amount } },
    data: {
      credits: { decrement: amount },
      totalCreditsUsed: { increment: amount },
    },
  });

  if (res.count === 0) {
    return { ok: false, credits: user.credits };
  }
  return { ok: true, remaining: Math.max(0, user.credits - amount) };
}

/** Give credits back (e.g. a generation step failed after being charged). */
export async function refundCredits(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  await prisma.user.updateMany({
    where: { userId },
    data: {
      credits: { increment: amount },
      totalCreditsUsed: { decrement: amount },
    },
  });
}
