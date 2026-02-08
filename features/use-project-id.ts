import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export const useGetProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/project/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });
};

export const useGenerateDesignById = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: string | { prompt: string; model?: string }
    ) => {
      const prompt =
        typeof payload === "string" ? payload : payload.prompt;
      const model =
        typeof payload === "string" ? undefined : payload.model;
      return axios
        .post(`/api/project/${projectId}`, { prompt, ...(model && { model }) })
        .then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      toast.success("Generation Started");
    },
    onError: (error: any) => {
      console.log("Project failed", error);
      if (error?.response?.status === 402) {
        toast.error(error?.response?.data?.error || "Insufficient credits");
      } else {
        toast.error("Failed to generate screen");
      }
    },
  });
};

export const useUpdateProject = (projectId: string) => {
  return useMutation({
    mutationFn: async (themeId: string) =>
      await axios
        .patch(`/api/project/${projectId}`, {
          themeId,
        })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("Project updated");
    },
    onError: (error) => {
      console.log("Project failed", error);
      toast.error("Failed to update project");
    },
  });
};
