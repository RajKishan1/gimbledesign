"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";
import { SUBSCRIPTION_QUERY_KEY } from "@/features/use-subscription";

type ConfirmStatus = "credited" | "pending" | "failed";

const TOAST_ID = "polar-checkout";
// Polar creates the order a moment after the checkout succeeds, so poll with a
// growing delay (~50s in total) before falling back to the webhook.
const RETRY_DELAYS_MS = [0, 1_500, 3_000, 5_000, 8_000, 12_000, 20_000];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handles the `?checkout=success&checkout_id=…` return from Polar: asks the
 * server to confirm the purchase (which grants the credits), then refreshes
 * billing data. The server decides everything; this only triggers it.
 */
export function CheckoutStatus() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const handled = useRef(new Set<string>());
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (params.get("checkout") !== "success") return;

    const checkoutId = params.get("checkout_id") ?? "";
    // Stripping the query string below updates `params` and reruns this effect,
    // so the confirmation loop is deliberately not tied to the effect lifecycle.
    window.history.replaceState(window.history.state, "", "/dashboard");
    if (handled.current.has(checkoutId)) return;
    handled.current.add(checkoutId);

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    };

    const confirm = async (): Promise<ConfirmStatus> => {
      for (const delay of RETRY_DELAYS_MS) {
        await sleep(delay);
        if (unmounted.current) return "pending";
        try {
          const res = await axios.post<{ status: ConfirmStatus }>(
            "/api/polar/checkout/confirm",
            { checkoutId },
          );
          if (res.data.status !== "pending") return res.data.status;
        } catch (err) {
          // Anything but a transient server/network error won't fix itself.
          const status = isAxiosError(err) ? err.response?.status : undefined;
          if (status && status < 500 && status !== 429) return "failed";
        }
      }
      return "pending";
    };

    if (!UUID_RE.test(checkoutId)) {
      toast.success("Payment received. Your plan and credits will appear in a moment.");
      refresh();
      return;
    }

    toast.loading("Payment received. Adding your credits…", { id: TOAST_ID });
    void confirm().then((status) => {
      refresh();
      if (status === "credited") {
        toast.success("Payment confirmed. Your credits have been added.", { id: TOAST_ID });
      } else if (status === "failed") {
        toast.error("We couldn't confirm this payment. Contact support if you were charged.", {
          id: TOAST_ID,
        });
      } else {
        toast.info("Payment received. Your credits will appear shortly.", { id: TOAST_ID });
      }
    });
  }, [params, queryClient]);

  return null;
}
