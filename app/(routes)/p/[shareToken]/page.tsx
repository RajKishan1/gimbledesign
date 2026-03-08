"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Canvas from "@/components/canvas";
import { CanvasProvider } from "@/context/canvas-context";
import { PrototypeProvider } from "@/context/prototype-context";
import { Spinner } from "@/components/ui/spinner";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ProjectType } from "@/types/project";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon } from "@hugeicons/core-free-icons";

export default function PublicSharePage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  const [project, setProject] = useState<ProjectType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareToken) {
      setLoading(false);
      setError("Invalid link");
      return;
    }
    fetch(`/api/share/${encodeURIComponent(shareToken)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) setError("Project not found or link has been revoked");
          else setError("Failed to load");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setProject(data);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f9f9f9] dark:bg-black">
        <Spinner className="size-10" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#f9f9f9] dark:bg-black px-4">
        <p className="text-muted-foreground text-center">{error || "Project not found"}</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Gimble</Link>
        </Button>
      </div>
    );
  }

  const hasInitialData = project.frames?.length > 0;
  const isInspirations = project.deviceType === "inspirations";
  const initialDimensions =
    isInspirations && project.width != null && project.height != null
      ? { width: project.width, height: project.height }
      : undefined;
  const initialDeviceType =
    project.deviceType === "web"
      ? "web"
      : project.deviceType === "wireframe"
        ? "wireframe"
        : "mobile";
  const initialWireframeKind =
    project.deviceType === "wireframe" &&
    (project.wireframeKind === "web" || project.wireframeKind === "mobile")
      ? project.wireframeKind
      : null;
  const initialAppShell =
    project.appShellHtml != null &&
    project.appShellType != null &&
    project.appShellMeta != null
      ? {
          html: project.appShellHtml,
          type: project.appShellType as "sidebar" | "bottom-nav",
          meta: project.appShellMeta,
        }
      : undefined;

  return (
    <div className="flex h-screen w-full flex-col bg-[#f9f9f9] dark:bg-black">
      {/* Minimal header: logo, project name, Open in Gimble */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1.75} />
            Shared design
          </span>
          <p className="max-w-[200px] truncate text-sm font-medium text-foreground">
            {project.name || "Untitled Project"}
          </p>
        </div>
        <Button asChild size="sm" variant="default">
          <Link href="/dashboard">Open in Gimble</Link>
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        <CanvasProvider
          initialFrames={project.frames ?? []}
          initialThemeId={project.theme}
          initialDeviceType={initialDeviceType}
          initialDimensions={initialDimensions}
          initialWireframeKind={initialWireframeKind}
          initialAppShell={initialAppShell}
          hasInitialData={hasInitialData}
          projectId={project.id}
          readOnly
        >
          <PrototypeProvider projectId={project.id}>
            <Canvas
              projectId={project.id}
              projectName={project.name ?? null}
              isPending={false}
            />
          </PrototypeProvider>
        </CanvasProvider>
      </div>
    </div>
  );
}
