"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, FloppyDiskIcon, Download01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useCanvas } from "@/context/canvas-context";
import { Button } from "../ui/button";
import { useUpdateProject } from "@/features/use-project-id";
import { Spinner } from "../ui/spinner";
import { ExportModal } from "../export-modal";

const CanvasFloatingToolbar = ({
  projectId,
  isScreenshotting,
  onScreenshot,
  showScreenshotButton = true,
}: {
  projectId: string;
  isScreenshotting: boolean;
  onScreenshot: () => void;
  showScreenshotButton?: boolean;
}) => {
  // Export modal open state lives in canvas context so frame-level menus
  // (More → Export) can open the same panel.
  const { theme: currentTheme, exportOpen: isExportModalOpen, setExportOpen: setIsExportModalOpen } = useCanvas();

  const update = useUpdateProject(projectId);

  // Optimistic save: show "Saved ✓" immediately — the mutation continues in
  // the background and toasts on failure (useUpdateProject handles errors).
  const [savedFlash, setSavedFlash] = useState(false);
  const handleUpdate = () => {
    if (!currentTheme) return;
    update.mutate(currentTheme.id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div>
      <div
        className="w-full max-w-2xl bg-transparent
    "
      >
        <div className="flex flex-row items-center gap-2 px-3">
          <div className="flex items-center gap-2">
            {showScreenshotButton && (
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-xl border-border bg-card cursor-pointer shadow-sm"
                disabled={isScreenshotting}
                onClick={onScreenshot}
              >
                {isScreenshotting ? (
                  <Spinner />
                ) : (
                  <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                )}
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="rounded-xl bg-[#53f22b] font-semibold text-black shadow-sm cursor-pointer hover:bg-[#47dd21]"
              onClick={handleUpdate}
            >
              {savedFlash ? (
                <>
                  <HugeiconsIcon icon={Tick02Icon} size={16} color="currentColor" strokeWidth={2} />
                  Saved
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={FloppyDiskIcon} size={16} color="currentColor" strokeWidth={1.75} />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border bg-card font-medium shadow-sm cursor-pointer"
              onClick={() => setIsExportModalOpen(true)}
            >
              <HugeiconsIcon icon={Download01Icon} size={16} color="currentColor" strokeWidth={1.75} />
              Export
            </Button>
          </div>
        </div>
      </div>
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        projectId={projectId}
      />
    </div>
  );
};

export default CanvasFloatingToolbar;
