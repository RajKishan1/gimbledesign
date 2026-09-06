import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetCredits = (userId?: string) => {
  return useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await axios.get("/api/credits");
      return res.data.data.credits as number;
    },
    enabled: !!userId,
  });
};
