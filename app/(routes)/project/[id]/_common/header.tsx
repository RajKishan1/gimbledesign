import React from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import CanvasFloatingToolbar from "@/components/canvas/canvas-floating-toolbar";
import ModeToggle from "@/components/canvas/mode-toggle";
import { ShareButton } from "@/components/canvas/share-button";

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

  return (
    <div className="sticky top-0">
      <header
        className="border-b border-border bg-card backdrop-blur-sm"
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
              <p className="max-w-[200px] truncate font-medium text-sm">
                {projectName || "Untitled Project"}
              </p>
            </div>
          </div>
          <ModeToggle projectId={projectId} />
          <div className="flex items-center gap-4">
            <ShareButton projectId={projectId} />
            <CanvasFloatingToolbar
              projectId={projectId}
              isScreenshotting={isScreenshotting || false}
              onScreenshot={onScreenshot || (() => {})}
            />
            <Button
              variant="outline"
              size="icon"
              className="relative border-none rounded-none h-8 w-8"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              <HugeiconsIcon
                icon={Sun01Icon}
                size={20}
                color="currentColor"
                strokeWidth={1.75}
                className={cn(
                  "absolute transition",
                  isDark ? "scale-100" : "scale-0"
                )}
              />
              <HugeiconsIcon
                icon={Moon01Icon}
                size={20}
                color="currentColor"
                strokeWidth={1.75}
                className={cn(
                  "absolute transition",
                  isDark ? "scale-0" : "scale-100"
                )}
              />
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
