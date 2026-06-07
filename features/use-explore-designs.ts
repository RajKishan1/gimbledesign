/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export type ExploreDesign = {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  category: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

/**
 * Public fetch (any authenticated user).
 * Returns admin-curated explore designs, newest first.
 */
export function useExploreDesigns(limit = 24) {
  return useQuery({
    queryKey: ["explore-designs", limit],
    queryFn: async () => {
      const res = await axios.get(`/api/explore-designs?limit=${limit}`);
      return (res.data.data ?? []) as ExploreDesign[];
    },
    staleTime: 60_000,
  });
}

/**
 * Admin-only upload mutation.
 * Pass the raw File from an <input type="file">, plus title, optional link,
 * and category. Invalidates the public list on success.
 */
export function useUploadExploreDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      image: File;
      title: string;
      link?: string;
      category: "mobile" | "web";
    }) => {
      const fd = new FormData();
      fd.append("image", args.image);
      fd.append("title", args.title);
      fd.append("category", args.category);
      if (args.link) fd.append("link", args.link);

      const res = await axios.post("/api/admin/explore-designs", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as ExploreDesign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["explore-designs"] });
      qc.invalidateQueries({ queryKey: ["admin-explore-designs"] });
      toast.success("Design uploaded");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Upload failed";
      toast.error(msg);
    },
  });
}

/**
 * Admin-only delete mutation.
 * Also removes the asset from Cloudinary.
 */
export function useDeleteExploreDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/explore-designs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["explore-designs"] });
      qc.invalidateQueries({ queryKey: ["admin-explore-designs"] });
      toast.success("Design deleted");
    },
    onError: () => {
      toast.error("Delete failed");
    },
  });
}

/**
 * Admin-only list (returns ALL explore designs for the admin management UI).
 */
export function useAdminExploreDesigns() {
  return useQuery({
    queryKey: ["admin-explore-designs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/explore-designs");
      return (res.data.data ?? []) as ExploreDesign[];
    },
    staleTime: 30_000,
  });
}
