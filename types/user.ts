/**
 * User role. Default for all users is "user".
 * "admin" can only be assigned by changing the record at the database level (no app or API can set it).
 */
export type UserRole = "user" | "admin";

export const DEFAULT_USER_ROLE: UserRole = "user";

/** Normalize role from DB (missing or invalid = user). */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "admin") return "admin";
  return "user";
}
