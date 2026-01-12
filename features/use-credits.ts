import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useGetCredits = (userId?: string) => {
  return useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await axios.get("/api/credits");
      return res.data.data.credits as number;
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
};

export const useDeductCredits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await axios.patch("/api/credits", { amount: -amount });
      return res.data.data.credits as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
};
