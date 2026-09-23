"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

/**
 * Signs the user out and leaves them on the login page. Clearing the session
 * cookie alone isn't enough: the current page (and every React Query cache —
 * profile, credits, projects…) would keep showing the signed-in state until a
 * reload. So after Better Auth confirms, drop all cached data, navigate away
 * and refresh the server components so nothing from the old session survives.
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("[Auth] Sign out failed:", err);
      toast.error("Could not sign out. Please try again.");
      setIsSigningOut(false);
    }
  }, [isSigningOut, queryClient, router]);

  return { signOut, isSigningOut };
}
