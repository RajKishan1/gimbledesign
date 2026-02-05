import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getGenerationModel } from "@/constant/models";

export type DeviceType = "mobile" | "web" | "inspirations" | "wireframe";

export interface CreateProjectData {
  prompt: string;
  model?: string;
  deviceType?: DeviceType;
  /** When deviceType is "wireframe": "web" (responsive) or "mobile". Default "web". */
  wireframeKind?: "web" | "mobile";
  dimensions?: {
    width: number;
    height: number;
  };
}

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProjectData) =>
      await axios
        .post("/api/project", {
          prompt: data.prompt,
          model:
            getGenerationModel(data.model) || "google/gemini-3-pro-preview",
          deviceType: data.deviceType || "mobile",
          wireframeKind:
            data.deviceType === "wireframe"
              ? data.wireframeKind ?? "web"
              : undefined,
          dimensions: data.dimensions,
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      router.push(`/project/${data.data.id}`);
    },
    onError: (error: any) => {
      console.log("Project failed", error);
      if (error?.response?.status === 402) {
        toast.error(error?.response?.data?.error || "Insufficient credits");
      } else {
        toast.error("Failed to create project");
      }
    },
  });
};

export const useGetProjects = (userId?: string, limit?: number) => {
  return useQuery({
    queryKey: ["projects", limit ?? "all"],
    queryFn: async () => {
      const url = limit ? `/api/project?limit=${limit}` : "/api/project";
      const res = await axios.get(url);
      return res.data.data;
    },
    enabled: !!userId,
    retry: 1,
  });
};

export const useRenameProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      name,
    }: {
      projectId: string;
      name: string;
    }) => {
      const res = await axios.patch(`/api/project/${projectId}`, { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project renamed");
    },
    onError: () => {
      toast.error("Failed to rename project");
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await axios.delete(`/api/project/${projectId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });
};

export const useDuplicateProject = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await axios.post(`/api/project/${projectId}/duplicate`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project duplicated");
      const newId = data?.data?.id;
      if (newId) router.push(`/project/${newId}`);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error || "Failed to duplicate project";
      toast.error(msg);
    },
  });
};
