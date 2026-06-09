"use client";

import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { authClient } from "@/lib/auth-client";
import type { ProfileData } from "@/features/use-profile";

/**
 * Shared profile subscription.
 *
 * Before: DashboardSection, DashboardSidebar, and NavBar's ProfileAvatar
 * each called `useGetProfile()`. React Query deduped the network call,
 * but each component still ran its own observer + re-rendered independently
 * on every cache update.
 *
 * Now: `ProfileProvider` calls the query once at the layout level and
 * exposes the result via context. Every consumer reads from a single
 * subscription — one observer, one re-render path.
 *
 * Mount once in `(routes)/layout.tsx`. Components consume via `useProfile()`.
 */

type ProfileContextValue = {
  data: ProfileData | undefined;
  isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Gate the fetch on session presence so we don't fire a 401 on the
  // public landing page. The query key still matches the one used by the
  // page.tsx prefetch + the existing `useGetProfile()` hook, so the cache
  // is shared across both styles of subscription.
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await axios.get("/api/profile");
      return res.data.data as ProfileData;
    },
    enabled: !!session?.user,
  });

  return (
    <ProfileContext.Provider value={{ data, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

/**
 * Consume the shared profile. Returns `{ data: undefined, isLoading: false }`
 * if used outside the provider (e.g. on a public page) so components don't
 * crash; they should treat `data` as optional.
 */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) return { data: undefined, isLoading: false };
  return ctx;
}
