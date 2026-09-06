"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";
import type { PaidPlanId, PlanId } from "@/lib/plans";

export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const;

export interface SubscriptionSummary {
  planId: PlanId;
  planName: string;
  status: string | null;
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  credits: number;
  hasBillingAccount: boolean;
}

export type SubscriptionAction =
  | { action: "cancel" }
  | { action: "resume" }
  | { action: "portal" }
  | { action: "change"; planId: PaidPlanId };

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** Billing state for the signed-in user. Pass `enabled: false` when logged out. */
export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      const res = await axios.get<{ data: SubscriptionSummary }>("/api/polar/subscription");
      return res.data.data;
    },
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Starts a Polar checkout and navigates to it. Handles the two expected
 * non-success outcomes: not signed in (→ login) and already subscribed (→ billing).
 */
export function useStartCheckout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (planId: PaidPlanId) => {
      const res = await axios.post<{ url: string }>("/api/polar/checkout", { planId });
      return res.data.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        if (err.response?.status === 409) {
          toast.info(getApiErrorMessage(err, "You already have a subscription."));
          router.push("/profile#billing");
          return;
        }
      }
      toast.error(getApiErrorMessage(err, "Could not start checkout. Please try again."));
    },
  });
}

/** Cancel / resume / change plan / open the customer portal. */
export function useSubscriptionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: SubscriptionAction) => {
      const res = await axios.post<{ message?: string; url?: string }>(
        "/api/polar/subscription",
        body,
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.action === "portal" && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        return;
      }
      if (data.message) toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Something went wrong. Please try again."));
    },
  });
}
