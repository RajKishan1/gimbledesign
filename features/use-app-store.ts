import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  isActiveSetStatus,
  type AppStoreSetDTO,
  type ExportTargetId,
} from "@/lib/app-store/specs";

export const appStoreSetKey = (projectId: string) => ["appStoreSet", projectId] as const;

function isSetBusy(set: AppStoreSetDTO | null | undefined) {
  if (!set) return false;
  return isActiveSetStatus(set.status) || set.screens.some((s) => s.status === "generating");
}

/**
 * The project's App Store set. Polls every 4 s while anything is rendering so
 * the canvas and sidebar stay live without depending on the realtime socket.
 */
export function useAppStoreSet(projectId: string, enabled = true) {
  return useQuery<AppStoreSetDTO | null>({
    queryKey: appStoreSetKey(projectId),
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/app-store/${projectId}`);
        return (res.data.set as AppStoreSetDTO) ?? null;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!projectId && enabled,
    refetchInterval: (query) => (isSetBusy(query.state.data) ? 4000 : false),
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useCreateAppStoreSet() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await axios.post("/api/app-store", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as { success: boolean; data: { id: string; setId: string; cost: number } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Generating your store screenshots");
      router.push(`/project/${data.data.id}`);
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ error?: string }>;
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Please sign in to generate screenshots.");
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to start generation");
    },
  });
}

export function useRegenerateScreen(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { screenId: string; adjustments?: string }) => {
      const res = await axios.post(`/api/app-store/${projectId}/regenerate`, vars);
      return res.data as { success: boolean; cost: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appStoreSetKey(projectId) });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      toast.success("Re-rendering screen");
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ error?: string }>;
      toast.error(err?.response?.data?.error || "Failed to re-render screen");
    },
  });
}

/** Download one screen resized to an exact store size. */
export async function downloadScreenExport(
  projectId: string,
  screenId: string,
  target: ExportTargetId,
) {
  const res = await axios.post(
    `/api/app-store/${projectId}/export`,
    { screenId, target },
    { responseType: "blob" },
  );
  const disposition: string = res.headers["content-disposition"] ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `screenshot-${target}.png`;
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
