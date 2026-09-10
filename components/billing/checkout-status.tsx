"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SUBSCRIPTION_QUERY_KEY } from "@/features/use-subscription";

/**
 * Handles the `?checkout=success` return from Polar: confirms to the user,
 * strips the query param, and re-fetches billing data a couple of times
 * because the webhook that activates the plan can land a few seconds later.
 */
export function CheckoutStatus() {
  const params = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (params.get("checkout") !== "success") return;

    toast.success("Payment received. Your plan and credits will appear in a moment.");
    // Updating the Next router here reruns this effect and immediately clears
    // the retry timers below. Strip the query string without a navigation so
    // webhook-lag retries remain active.
    window.history.replaceState(window.history.state, "", "/dashboard");

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    };
    const timers = [2_000, 6_000, 12_000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
  }, [params, queryClient]);

  return null;
}
