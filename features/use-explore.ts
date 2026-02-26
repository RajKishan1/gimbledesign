import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export interface ExploreProject {
  id: string;
  name: string;
  thumbnail: string | null;
  deviceType: string;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useExploreProjects(limit?: number) {
  return useQuery({
    queryKey: ["explore", limit],
    queryFn: async () => {
      const url = limit != null ? `/api/explore?limit=${limit}` : "/api/explore";
      const res = await axios.get(url);
      return (res.data.data ?? []) as ExploreProject[];
    },
  });
}

export function useMoveProjectToExplore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, isExplore }: { projectId: string; isExplore: boolean }) => {
      const res = await axios.patch(`/api/project/${projectId}/explore`, {
        isExplore,
      });
      return res.data;
    },
    onSuccess: (_, { isExplore }) => {
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isExplore ? "Project moved to Explore" : "Project removed from Explore");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ?? "Failed to update explore status";
      toast.error(msg);
    },
  });
}
