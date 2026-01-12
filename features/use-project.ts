import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { prompt: string; model?: string }) =>
      await axios
        .post("/api/project", {
          prompt: data.prompt,
          model: data.model || "google/gemini-3-pro-preview",
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

export const useGetProjects = (userId?: string) => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axios.get("/api/project");
      return res.data.data;
    },
    enabled: !!userId,
  });
};
