"use client";

import { useEffect, useState, useRef } from "react";
import { useGetProjectById } from "@/features/use-project-id";
import { useParams } from "next/navigation";
import Header from "./_common/header";
import Canvas from "@/components/canvas";
import { CanvasProvider } from "@/context/canvas-context";
import { PrototypeProvider } from "@/context/prototype-context";
import DesignSidebar from "@/components/canvas/design-sidebar";
import ProjectsSidebar from "@/components/canvas/projects-sidebar";
import { useGenerateDesignById } from "@/features/use-project-id";
import { PENDING_SETUP_KEY } from "@/features/use-project";
import { getGenerationModel } from "@/constant/models";
import { toast } from "sonner";

const Page = () => {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isPending } = useGetProjectById(id);
  // const frames = project?.frames || [];
  // const themeId = project?.theme || "";

  const hasInitialData = project?.frames.length > 0;

  if (!isPending && !project) {
    return <div>Project not found</div>;
  }

  const isInspirations = project?.deviceType === "inspirations";
  const initialDimensions =
    isInspirations && project?.width != null && project?.height != null
      ? { width: project.width, height: project.height }
      : undefined;

  const initialDeviceType =
    project?.deviceType === "web"
      ? "web"
      : project?.deviceType === "wireframe"
        ? "wireframe"
        : "mobile";

  const initialWireframeKind =
    project?.deviceType === "wireframe" &&
    (project?.wireframeKind === "web" || project?.wireframeKind === "mobile")
      ? project.wireframeKind
      : null;

  return (
    <CanvasProvider
      initialFrames={project?.frames}
      initialThemeId={project?.theme}
      initialDeviceType={initialDeviceType}
      initialDimensions={initialDimensions}
      initialWireframeKind={initialWireframeKind}
      hasInitialData={hasInitialData}
      projectId={project?.id}
    >
      <PrototypeProvider projectId={project?.id || id}>
        <PageContent
          projectId={project?.id || id}
          projectName={project?.name}
          isPending={isPending}
          initialPrompt={project?.initialPrompt ?? undefined}
        />
      </PrototypeProvider>
    </CanvasProvider>
  );
};

type SetupStatus = "reading" | "enhancing" | "generating" | null;

const PageContent = ({
  projectId,
  projectName,
  isPending,
  initialPrompt,
}: {
  projectId: string;
  projectName?: string;
  isPending: boolean;
  initialPrompt?: string | null;
}) => {
  const { mutate: generateDesign, isPending: isGenerating } =
    useGenerateDesignById(projectId);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>(null);
  const setupDoneRef = useRef(false);

  useEffect(() => {
    if (setupDoneRef.current || typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_SETUP_KEY);
    } catch (_) {}
    if (!raw) return;
    let payload: {
      projectId: string;
      prompt: string;
      imageBase64?: string | null;
      mimeType?: string;
      model?: string;
      deviceType?: string;
      wireframeKind?: string;
    };
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      return;
    }
    if (payload.projectId !== projectId) return;
    setupDoneRef.current = true;
    sessionStorage.removeItem(PENDING_SETUP_KEY);

    const deviceType = payload.deviceType ?? "mobile";
    const run = async () => {
      let imageContext: string | undefined;
      if (payload.imageBase64 && payload.mimeType) {
        setSetupStatus("reading");
        try {
          const describeRes = await fetch("/api/describe-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: payload.imageBase64,
              mimeType: payload.mimeType,
            }),
          });
          const describeData = await describeRes.json();
          if (describeRes.ok && describeData?.description)
            imageContext = describeData.description;
        } catch (e) {
          console.error("Describe image error:", e);
        }
      }

      setSetupStatus("enhancing");
      let finalPrompt = payload.prompt;
      try {
        const enhanceRes = await fetch("/api/enhance-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: payload.prompt,
            model: getGenerationModel(payload.model ?? "auto"),
            designType: deviceType,
            ...(imageContext && { imageContext }),
          }),
        });
        const enhanceData = await enhanceRes.json();
        finalPrompt =
          enhanceData.enhancedPrompt ||
          (imageContext
            ? `${imageContext}${payload.prompt ? `\n\n${payload.prompt}` : ""}`
            : payload.prompt);
      } catch (e) {
        console.error("Enhance prompt error:", e);
      }

      setSetupStatus("generating");
      generateDesign(
        {
          prompt: finalPrompt,
          model: getGenerationModel(payload.model ?? "auto"),
        },
        {
          onSettled: () => setSetupStatus(null),
          onError: () => toast.error("Failed to start generation"),
        },
      );
    };
    run();
  }, [projectId, generateDesign]);

  const handleGenerate = (promptText: string) => {
    generateDesign(promptText);
  };

  return (
    <div
      className="relative h-screen w-full
     flex flex-col
    "
    >
      <Header projectName={projectName} />

      <div className="flex flex-1 overflow-hidden">
        <DesignSidebar
          projectId={projectId}
          onGenerate={handleGenerate}
          isPending={isGenerating}
          initialPrompt={initialPrompt ?? undefined}
          setupStatus={setupStatus}
        />
        <div className="relative flex-1">
          <Canvas
            projectId={projectId}
            projectName={projectName || null}
            isPending={isPending}
          />
        </div>

        <ProjectsSidebar />
      </div>
    </div>
  );
};

export default Page;
