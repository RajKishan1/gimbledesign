"use client";

import React, { memo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import PromptInput from "@/components/prompt-input";
import Header from "./header";
import DashboardSidebar from "./dashboard-sidebar";
import {
  useCreateProject,
  useGetProjects,
  useRenameProject,
  useDeleteProject,
  useDuplicateProject,
} from "@/features/use-project";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter } from "next/navigation";
import {
  FolderOpenDotIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView, Variants } from "framer-motion";
import { DeviceType } from "@/components/prompt-input";
import { openSauceOne } from "@/app/fonts";
import { getGenerationModel } from "@/constant/models";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoadingState = "idle" | "enhancing" | "designing";

const getLoadingText = (
  state: LoadingState,
  deviceType: DeviceType
): string | undefined => {
  switch (state) {
    case "enhancing":
      const typeLabel =
        deviceType === "web"
          ? "web app"
          : deviceType === "inspirations"
          ? "inspirations"
          : deviceType === "wireframe"
          ? "wireframe"
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
  const [wireframeKind, setWireframeKind] = useState<"web" | "mobile">("web");
  const [inspirationKind, setInspirationKind] = useState<"web" | "mobile">(
    "web"
  );
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
        formData.append("inspirationKind", inspirationKind);
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

    // For mobile, web, wireframe: prompt is required; image is optional
    if (!hasPrompt) {
      toast.error("Prompt is required. Describe what you want to design.");
      return;
    }
    try {
      setLoadingState("designing");
      let imageBase64: string | null = null;
      let imageMimeType: string | undefined;
      if (hasImage && referenceFile) {
        const buffer = await referenceFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        imageBase64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(buffer).toString("base64");
        imageMimeType = referenceFile.type || "image/png";
      }
      mutate({
        prompt: promptText.trim(),
        initialPrompt: promptText.trim(),
        model: selectedModel,
        deviceType,
        wireframeKind: deviceType === "wireframe" ? wireframeKind : undefined,
        createOnly: true,
        imageBase64: imageBase64 ?? undefined,
        imageMimeType,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      setLoadingState("idle");
      toast.error("Failed to create project");
    }
  };

  return (
    <div
      className={`w-full h-screen overflow-hidden flex ${openSauceOne.className}`}
    >
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
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
                  wireframeKind={wireframeKind}
                  onWireframeKindChange={setWireframeKind}
                  inspirationKind={inspirationKind}
                  onInspirationKindChange={setInspirationKind}
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
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: renameProject, isPending: isRenaming } = useRenameProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: duplicateProject, isPending: isDuplicating } =
    useDuplicateProject();

  const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
    addSuffix: true,
  });
  const thumbnail = project.thumbnail || null;

  const handleRenameSubmit = () => {
    const name = renameValue.trim();
    if (!name) return;
    renameProject(
      { projectId: project.id, name },
      { onSuccess: () => setRenameOpen(false) }
    );
  };

  const handleDeleteConfirm = () => {
    deleteProject(project.id, { onSuccess: () => setDeleteOpen(false) });
  };

  const handleDuplicate = () => {
    duplicateProject(project.id);
  };

  return (
    <>
      <div
        role="button"
        className="w-full flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer overflow-hidden shadow-sm transition-transform hover:shadow-md hover:-translate-y-0.5 relative"
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
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm border-0"
                  aria-label="Project options"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setRenameValue(project.name);
                    setRenameOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicate();
                  }}
                  disabled={isDuplicating}
                >
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="w-full border-t border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 flex flex-col">
          <h3 className="font-semibold text-[15px] leading-[1.5em] tracking-[-0.035em] mb-1.5 line-clamp-1">
            {project.name}
          </h3>
          <p className="text-xs text-black/60 dark:text-zinc-400">{timeAgo}</p>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          className="sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="rename-input">Project name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              placeholder="Project name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={isRenaming || !renameValue.trim()}>
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          className="sm:max-w-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{project.name}&quot;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
ProjectCard.displayName = "ProjectCard";

export default DashboardSection;
