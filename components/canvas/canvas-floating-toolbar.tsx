"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, FloppyDiskIcon, Download01Icon } from "@hugeicons/core-free-icons";
import { useCanvas } from "@/context/canvas-context";
import { Button } from "../ui/button";
import { useUpdateProject } from "@/features/use-project-id";
import { Spinner } from "../ui/spinner";
import { ExportModal } from "../export-modal";
import { useState } from "react";

const CanvasFloatingToolbar = ({
  projectId,
  isScreenshotting,
  onScreenshot,
}: {
  projectId: string;
  isScreenshotting: boolean;
  onScreenshot: () => void;
}) => {
  const { theme: currentTheme } = useCanvas();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const update = useUpdateProject(projectId);

  const handleUpdate = () => {
    if (!currentTheme) return;
    update.mutate(currentTheme.id);
  };

  return (
    <div>
      <div
        className="w-full max-w-2xl bg-transparent
    "
      >
        <div className="flex flex-row items-center gap-2 px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-none border-none cursor-pointer"
              disabled={isScreenshotting}
              onClick={onScreenshot}
            >
              {isScreenshotting ? (
                <Spinner />
              ) : (
                <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.75} />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="rounded-none font-normal cursor-pointer"
              onClick={handleUpdate}
            >
              {update.isPending ? (
                <Spinner />
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
              className="rounded-none border-none font-normal cursor-pointer"
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
