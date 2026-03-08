"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ShareButton({ projectId }: { projectId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project/${projectId}/share`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.shareUrl) setShareUrl(data.shareUrl);
      })
      .catch(() => {});
  }, [projectId]);

  const loadOrCreateLink = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/project/${projectId}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      const url = data.shareUrl || (data.shareToken ? `/p/${data.shareToken}` : null);
      if (url) setShareUrl(url);
      return url;
    } catch (e) {
      toast.error("Failed to create share link");
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const toAbsoluteUrl = useCallback((pathOrUrl: string) => {
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }, []);

  const copyLink = useCallback(async () => {
    let url = shareUrl;
    if (!url) url = await loadOrCreateLink();
    if (!url) return;
    const absolute = toAbsoluteUrl(url);
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [shareUrl, loadOrCreateLink, toAbsoluteUrl]);

  const revokeLink = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/share`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to revoke");
      setShareUrl(null);
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke link");
    }
  }, [projectId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-none rounded-none h-8 w-8"
          disabled={loading}
        >
          <HugeiconsIcon icon={Share01Icon} size={18} color="currentColor" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copyLink}>
          {shareUrl ? "Copy share link" : "Create & copy share link"}
        </DropdownMenuItem>
        {shareUrl && (
          <DropdownMenuItem onClick={revokeLink} className="text-muted-foreground">
            Revoke share link
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
