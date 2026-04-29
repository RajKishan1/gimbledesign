import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Camera01Icon, Moon01Icon, Share01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import CanvasFloatingToolbar from "@/components/canvas/canvas-floating-toolbar";
import ModeToggle from "@/components/canvas/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useRenameProject } from "@/features/use-project";

const Header = ({
  projectName,
  isScreenshotting,
  onScreenshot,
}: {
  projectName?: string;
  isScreenshotting?: boolean;
  onScreenshot?: () => void;
}) => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: renameProject } = useRenameProject();

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project/${projectId}/share`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.shareUrl) setShareUrl(data.shareUrl);
      })
      .catch(() => {});
  }, [projectId]);

  const toAbsoluteUrl = useCallback((pathOrUrl: string) => {
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }, []);

  const loadOrCreateShareLink = useCallback(async () => {
    if (!projectId) return null;
    setIsShareLoading(true);
    try {
      const res = await fetch(`/api/project/${projectId}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      const url = data.shareUrl || (data.shareToken ? `/p/${data.shareToken}` : null);
      if (url) setShareUrl(url);
      return url;
    } catch {
      toast.error("Failed to create share link");
      return null;
    } finally {
      setIsShareLoading(false);
    }
  }, [projectId]);

  const copyShareLink = useCallback(async () => {
    let url = shareUrl;
    if (!url) url = await loadOrCreateShareLink();
    if (!url) return;
    const absolute = toAbsoluteUrl(url);
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [shareUrl, loadOrCreateShareLink, toAbsoluteUrl]);

  const revokeShareLink = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}/share`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to revoke");
      setShareUrl(null);
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke link");
    }
  }, [projectId]);

  const startEditing = useCallback(() => {
    setEditValue(projectName || "");
    setIsEditing(true);
    // Focus the input after React renders it
    setTimeout(() => inputRef.current?.select(), 0);
  }, [projectName]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === projectName) return;
    renameProject({ projectId, name: trimmed });
  }, [editValue, projectName, projectId, renameProject]);

  const cancelRename = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  return (
    <div className="sticky top-0 z-30">
      <header
        className="bg-card/60 backdrop-blur-xl shadow-sm"
      >
        <div
          className="flex items-center justify-between px-4
          py-2
        "
        >
          <div className="flex items-center gap-6">
            <Logo />
            <div className="flex items-center gap-2">
              <button
                className="rounded-full cursor-pointer"
                onClick={() => router.push("/")}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="currentColor" strokeWidth={1.75} />
              </button>
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                    if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
                  }}
                  className="max-w-[200px] truncate font-medium text-sm bg-transparent border-b border-border outline-none px-0"
                  autoFocus
                />
              ) : (
                <button
                  onClick={startEditing}
                  title="Click to rename"
                  className="max-w-[200px] truncate font-medium text-sm hover:opacity-70 transition-opacity cursor-text text-left"
                >
                  {projectName || "Untitled Project"}
                </button>
              )}
            </div>
          </div>
          <ModeToggle projectId={projectId} />
          <div className="flex items-center gap-4">
            <CanvasFloatingToolbar
              projectId={projectId}
              isScreenshotting={isScreenshotting || false}
              onScreenshot={onScreenshot || (() => {})}
              showScreenshotButton={false}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-none rounded-none h-8 w-8"
                  aria-label="More actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  disabled={isScreenshotting}
                  onClick={() => onScreenshot?.()}
                  className="cursor-pointer gap-2"
                >
                  <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  Screenshot
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isShareLoading}
                  onClick={copyShareLink}
                  className="cursor-pointer gap-2"
                >
                  <HugeiconsIcon icon={Share01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  {shareUrl ? "Copy share link" : "Create & copy share link"}
                </DropdownMenuItem>
                {shareUrl && (
                  <DropdownMenuItem
                    disabled={isShareLoading}
                    onClick={revokeShareLink}
                    className="cursor-pointer text-muted-foreground"
                  >
                    Revoke share link
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="cursor-pointer gap-2"
                >
                  <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                    <HugeiconsIcon
                      icon={Sun01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                      className={cn("absolute transition", isDark ? "scale-100" : "scale-0")}
                    />
                    <HugeiconsIcon
                      icon={Moon01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                      className={cn("absolute transition", isDark ? "scale-0" : "scale-100")}
                    />
                  </span>
                  Theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
