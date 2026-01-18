import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { prompt: string; model?: string; deviceType?: "mobile" | "web" }) =>
      await axios
        .post("/api/project", {
          prompt: data.prompt,
          model: data.model || "google/gemini-3-pro-preview",
          deviceType: data.deviceType || "mobile",
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
    queryKey: ["projects", limit],
    queryFn: async () => {
      const url = limit ? `/api/project?limit=${limit}` : "/api/project";
      const res = await axios.get(url);
      return res.data.data;
    },
    enabled: !!userId,
  });
};
