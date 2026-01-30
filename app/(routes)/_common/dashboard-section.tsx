"use client";

import React, { memo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import PromptInput from "@/components/prompt-input";
import Header from "./header";
import DashboardSidebar from "./dashboard-sidebar";
import { useCreateProject, useGetProjects } from "@/features/use-project";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter } from "next/navigation";
import { FolderOpenDotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView, Variants } from "framer-motion";
import { DeviceType } from "@/components/prompt-input";
import { openSauceOne } from "@/app/fonts";
import { getGenerationModel } from "@/constant/models";

type LoadingState = "idle" | "enhancing" | "designing";

const getLoadingText = (
  state: LoadingState,
  deviceType: DeviceType,
): string | undefined => {
  switch (state) {
    case "enhancing":
      const typeLabel =
        deviceType === "web"
          ? "web app"
          : deviceType === "inspirations"
            ? "inspirations"
            : "mobile app";
      return `Enhancing for ${typeLabel}...`;
    case "designing":
      return "Generating designs...";
    default:
      return undefined;
  }
};

const DashboardSection = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const [promptText, setPromptText] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
  const userId = user?.id;

  const {
    data: projects,
    isLoading,
    isError,
  } = useGetProjects(userId, showAllProjects ? undefined : 10);
  const { mutate, isPending } = useCreateProject();

  React.useEffect(() => {
    if (!isPending && loadingState === "designing") {
      const timeout = setTimeout(() => setLoadingState("idle"), 500);
      return () => clearTimeout(timeout);
    }
  }, [isPending, loadingState]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("selectedModel");
      if (savedModel) setSelectedModel(savedModel);
    }
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", modelId);
    }
  };

  const handleSubmit = async () => {
    const hasPrompt = !!promptText?.trim();
    const hasImage = !!referenceFile;

    if (deviceType === "inspirations") {
      if (!hasPrompt && !hasImage) return;
      try {
        setLoadingState("designing");
        const formData = new FormData();
        if (hasPrompt) formData.append("prompt", promptText.trim());
        if (hasImage && referenceFile) formData.append("image", referenceFile);
        formData.append("model", selectedModel);
        const res = await fetch("/api/inspiration-redesign", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(data.error ?? data);
          setLoadingState("idle");
          return;
        }
        if (data?.data?.id) {
          router.push(`/project/${data.data.id}`);
          // Keep loading/shimmer until navigation unmounts this page
        }
      } catch (error) {
        console.error("Inspiration redesign error:", error);
        setLoadingState("idle");
      }
      return;
    }

    if (!hasPrompt) return;
    try {
      setLoadingState("enhancing");
      const enhanceResponse = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          model: getGenerationModel(selectedModel),
          designType: deviceType,
        }),
      });
      const enhanceData = await enhanceResponse.json();
      const finalPrompt = enhanceData.enhancedPrompt || promptText;
      setLoadingState("designing");
      mutate({
        prompt: finalPrompt,
        model: getGenerationModel(selectedModel),
        deviceType,
      });
    } catch (error) {
      console.error("Error in design process:", error);
      setLoadingState("designing");
      mutate({
        prompt: promptText,
        model: getGenerationModel(selectedModel),
        deviceType,
      });
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col ${openSauceOne.className}`}>
      <Header />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="relative overflow-hidden py-12 border-b border-zinc-50 dark:border-zinc-900">
            <div className="w-full flex flex-col items-center justify-center gap-8 px-6">
              <h1 className="text-center font-bold text-3xl sm:text-4xl tracking-tight text-foreground">
                What should we design?
              </h1>
              <div className="w-full">
                <PromptInput
                  promptText={promptText}
                  setPromptText={setPromptText}
                  isLoading={loadingState !== "idle" || isPending}
                  loadingText={getLoadingText(loadingState, deviceType)}
                  onSubmit={handleSubmit}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  deviceType={deviceType}
                  onDeviceTypeChange={setDeviceType}
                  referenceFile={referenceFile}
                  onReferenceChange={setReferenceFile}
                />
              </div>
            </div>
          </div>

          <div className="w-full py-10 border-b border-zinc-50 dark:border-zinc-900">
            <div className="w-full px-6">
              <h2 className="font-medium text-xl tracking-tight mb-4">
                Recent Projects
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="size-10" />
                </div>
              ) : (
                <>
                  <div className="mt-3">
                    {projects && projects.length <= 10 ? (
                      <ProjectsGrid projects={projects} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto max-h-[80vh]">
                        {projects?.map((project: ProjectType) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    )}
                  </div>
                  {!showAllProjects && projects && projects.length >= 9 && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllProjects(true)}
                        className="px-6 rounded-lg"
                      >
                        Show All Projects
                      </Button>
                    </div>
                  )}
                </>
              )}
              {isError && (
                <p className="text-destructive text-sm">
                  Failed to load projects
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: index * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const ProjectsGrid = ({ projects }: { projects: ProjectType[] }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
    >
      {projects.map((project: ProjectType, index: number) => (
        <motion.div
          key={project.id}
          custom={index}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={cardVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </div>
  );
};

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
  });
  const thumbnail = project.thumbnail || null;

  return (
    <div
      role="button"
      className="w-full flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:shadow-md overflow-hidden transition-shadow"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover object-left scale-110"
          />
        ) : (
          <FolderOpenDotIcon className="text-muted-foreground" size={36} />
        )}
      </div>
      <div className="p-4 flex flex-col">
        <h3 className="font-medium text-sm truncate w-full mb-1 line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
});
ProjectCard.displayName = "ProjectCard";

export default DashboardSection;
