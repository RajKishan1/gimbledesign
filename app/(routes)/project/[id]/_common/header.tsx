import React from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CanvasFloatingToolbar from "@/components/canvas/canvas-floating-toolbar";
import ModeToggle from "@/components/canvas/mode-toggle";

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
        className="border-b
    bg-white dark:bg-[#1D1D1D] border-neutral-200 dark:border-[#2b2b2b]  backdrop-blur-sm
    "
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
                <ArrowLeftIcon className="size-4" />
              </button>
              <p className="max-w-[200px] truncate font-medium text-sm">
                {projectName || "Untitled Project"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Toggle (Design/Prototype) */}
            <ModeToggle projectId={projectId} />

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <CanvasFloatingToolbar
              projectId={projectId}
              isScreenshotting={isScreenshotting || false}
              onScreenshot={onScreenshot || (() => {})}
            />
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-lg h-8 w-8"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              <SunIcon
                className={cn(
                  "absolute h-5 w-5 transition",
                  isDark ? "scale-100" : "scale-0"
                )}
              />
              <MoonIcon
                className={cn(
                  "absolute h-5 w-5 transition",
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
