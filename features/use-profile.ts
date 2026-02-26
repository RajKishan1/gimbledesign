import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { UserRole } from "@/types/user";

export interface ProfileData {
  id: string;
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  profilePicture: string | null;
  headerImage: string | null;
  credits: number;
  totalCreditsUsed: number;
}

export const useGetProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await axios.get("/api/profile");
      return res.data.data as ProfileData;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name?: string;
      email?: string;
      profilePicture?: string;
      headerImage?: string;
    }) => {
      const res = await axios.patch("/api/profile", data);
      return res.data.data as ProfileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: ["profile"] });
    },
  });
};
