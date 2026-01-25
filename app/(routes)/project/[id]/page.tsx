"use client";

import { useGetProjectById } from "@/features/use-project-id";
import { useParams } from "next/navigation";
import Header from "./_common/header";
import Canvas from "@/components/canvas";
import { CanvasProvider } from "@/context/canvas-context";
import { PrototypeProvider } from "@/context/prototype-context";
import DesignSidebar from "@/components/canvas/design-sidebar";
import ProjectsSidebar from "@/components/canvas/projects-sidebar";
import { useGenerateDesignById } from "@/features/use-project-id";

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

  return (
    <CanvasProvider
      initialFrames={project?.frames}
      initialThemeId={project?.theme}
      initialDeviceType={
        (project?.deviceType as "mobile" | "web") || "mobile"
      }
      hasInitialData={hasInitialData}
      projectId={project?.id}
    >
      <PrototypeProvider projectId={project?.id || id}>
        <PageContent
          projectId={project?.id || id}
          projectName={project?.name}
          isPending={isPending}
        />
      </PrototypeProvider>
    </CanvasProvider>
  );
};

const PageContent = ({
  projectId,
  projectName,
  isPending,
}: {
  projectId: string;
  projectName?: string;
  isPending: boolean;
}) => {
  const { mutate: generateDesign, isPending: isGenerating } =
    useGenerateDesignById(projectId);

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
