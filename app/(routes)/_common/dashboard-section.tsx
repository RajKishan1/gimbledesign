"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
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
  useSetProjectFavorite,
} from "@/features/use-project";
import {
  useExploreProjects,
  useMoveProjectToExplore,
} from "@/features/use-explore";
import { useGetProfile } from "@/features/use-profile";
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
  Users,
  ArrowRight,
  Compass,
  Star,
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
import { cn } from "@/lib/utils";

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
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
  const [wireframeKind, setWireframeKind] = useState<"web" | "mobile">("web");
  const [inspirationKind, setInspirationKind] = useState<"web" | "mobile">(
    "web"
  );
  const [projectsFilter, setProjectsFilter] = useState<"all" | "favorites">(
    "all"
  );
  const userId = user?.id;

  const {
    data: projects,
    isLoading,
    isError,
  } = useGetProjects(
    userId,
    10,
    projectsFilter === "favorites"
  );
  const { mutate, isPending } = useCreateProject();
  const { data: profile } = useGetProfile();
  const { data: exploreProjects = [], isLoading: exploreLoading } =
    useExploreProjects(8);
  const moveToExplore = useMoveProjectToExplore();
  const isAdmin = profile?.role === "admin";

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
    if (!user) {
      toast.error("Please sign in to create designs.");
      router.push("/login");
      return;
    }
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
        for (let i = 0; i < bytes.byteLength; i++)
          binary += String.fromCharCode(bytes[i]);
        imageBase64 =
          typeof btoa !== "undefined"
            ? btoa(binary)
            : Buffer.from(buffer).toString("base64");
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
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-card">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* Hero */}
          <div className="relative overflow-hidden py-10 sm:py-24 border-b border-border">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 px-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" />
                  <Users className="size-4 -ml-2" />
                </span>
                Join 30,000+ app founders building today
              </p>
              <h1 className="text-center font-bold text-3xl sm:text-4xl md:text-5xl mb-14 tracking-tight text-foreground">
                Bring Your <span className="text-foreground/90">Ideas</span> to
                Life
              </h1>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeviceType("mobile")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    deviceType === "mobile"
                      ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  Mobile App
								</button>
								
                <button
                  type="button"
                  onClick={() => setDeviceType("web")}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    deviceType === "web"
                      ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground bg-accent"
                  )}
                >
                  Web Platform
                </button>
              </div>
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

          {/* Explore — projects moved to explore by admins */}
          <div className="w-full py-12 border-b border-border">
            <div className="w-full max-w-6xl mx-auto px-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-bold text-2xl tracking-tight text-foreground">
                    Explore
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Community designs shared by creators.
                  </p>
                </div>
                <Link
                  href="/explore"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0 flex items-center gap-1"
                >
                  Browse All
                  <Compass className="size-4" />
                </Link>
              </div>
              {exploreLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="size-10" />
                </div>
              ) : exploreProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No explore projects yet. Admins can move projects to Explore
                    from the project menu.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {exploreProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/project/${p.id}`}
                      className="group flex flex-col rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
                    >
                      <div className="h-36 relative overflow-hidden flex items-center justify-center">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-left scale-110 opacity-90"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                            Project
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[15px] leading-[1.4] mb-1 line-clamp-1 text-white">
                          {p.name}
                        </h3>
                        <p className="text-xs text-white/70">
                          {formatDistanceToNow(new Date(p.updatedAt), {
                            addSuffix: true,
                          })}{" "}
                          •{" "}
                          {p.deviceType === "web"
                            ? "Web"
                            : p.deviceType === "mobile"
                            ? "Mobile"
                            : p.deviceType}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Projects */}
          <div className="w-full py-12">
            <div className="w-full max-w-6xl mx-auto px-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <h2 className="font-bold text-2xl tracking-tight text-foreground">
                  My Projects
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setProjectsFilter("all")}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        projectsFilter === "all"
                          ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ALL PROJECTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectsFilter("favorites")}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        projectsFilter === "favorites"
                          ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      FAVORITES
                    </button>
                  </div>
                  <Link
                    href="/projects"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0 flex items-center gap-1"
                  >
                    Browse All
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="size-10" />
                </div>
              ) : (
                <>
                  <div className="mt-3">
                    {(() => {
                      const list = projects ?? [];
                      if (projectsFilter === "favorites" && list.length === 0) {
                        return (
                          <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                              No favorites yet. Star projects to see them here.
                            </p>
                          </div>
                        );
                      }
                      if (list.length === 0) {
                        return (
                          <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                              No projects yet. Create one above.
                            </p>
                          </div>
                        );
                      }
                      return (
                        <ProjectsGrid
                          projects={list}
                          isAdmin={isAdmin}
                          onMoveToExplore={moveToExplore.mutate}
                          isMovingToExplore={moveToExplore.isPending}
                        />
                      );
                    })()}
                  </div>
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

const INITIAL_VISIBLE_COUNT = 15; /* at least 3 rows (e.g. 5 cols × 3) */

export const ProjectsGrid = ({
  projects,
  isAdmin,
  onMoveToExplore,
  isMovingToExplore,
}: {
  projects: ProjectType[];
  isAdmin?: boolean;
  onMoveToExplore?: (args: { projectId: string; isExplore: boolean }) => void;
  isMovingToExplore?: boolean;
}) => {
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
          animate={index < INITIAL_VISIBLE_COUNT || isInView ? "visible" : "hidden"}
          variants={cardVariants}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <ProjectCard
            project={project}
            isAdmin={isAdmin}
            onMoveToExplore={onMoveToExplore}
            isMovingToExplore={isMovingToExplore}
          />
        </motion.div>
      ))}
    </div>
  );
};

export const ProjectCard = memo(
  ({
    project,
    isAdmin,
    onMoveToExplore,
    isMovingToExplore,
  }: {
    project: ProjectType;
    isAdmin?: boolean;
onMoveToExplore?: (args: { projectId: string; isExplore: boolean }) => void;
  isMovingToExplore?: boolean;
  }) => {
  const router = useRouter();
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState(project.name);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { mutate: renameProject, isPending: isRenaming } = useRenameProject();
    const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
    const { mutate: duplicateProject, isPending: isDuplicating } =
      useDuplicateProject();
    const { mutate: setFavorite, isPending: isTogglingFavorite } =
      useSetProjectFavorite();

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

    const deviceLabel =
      project.deviceType === "web"
        ? "Web App"
        : project.deviceType === "mobile"
        ? "iOS"
        : project.deviceType === "wireframe"
        ? "Wireframe"
        : "Inspirations";
    return (
      <>
        <div
          role="button"
          className="w-full flex flex-col rounded-xl cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 relative bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
          onClick={() => router.push(`/project/${project.id}`)}
        >
          <div className="h-36 relative overflow-hidden flex items-center justify-center">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover object-left scale-110 opacity-90"
              />
            ) : (
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Project
              </span>
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
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 shadow-sm"
                    aria-label="Project options"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setFavorite({
                        projectId: project.id,
                        isFavorite: !project.isFavorite,
                      });
                    }}
                    disabled={isTogglingFavorite}
                  >
                    <Star
                      className={cn("size-4", project.isFavorite && "fill-current")}
                    />
                    {project.isFavorite
                      ? "Remove from Favorites"
                      : "Add to Favorites"}
                  </DropdownMenuItem>
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
{isAdmin && onMoveToExplore && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      onMoveToExplore({
                        projectId: project.id,
                        isExplore: !project.isExplore,
                      });
                    }}
                    disabled={isMovingToExplore}
                  >
                    <Compass className="size-4" />
                    {project.isExplore
                      ? "Remove from Explore"
                      : "Move to Explore"}
                  </DropdownMenuItem>
                )}
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

          <div className="w-full p-4 flex flex-col">
            <h3 className="font-semibold text-[15px] leading-[1.4] mb-1 line-clamp-1 text-white">
              {project.name}
            </h3>
            <p className="text-xs text-white/70">
              {timeAgo} • {deviceLabel}
            </p>
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
              <Button
                onClick={handleRenameSubmit}
                disabled={isRenaming || !renameValue.trim()}
              >
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
              Are you sure you want to delete &quot;{project.name}&quot;? This
              cannot be undone.
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
  }
);
ProjectCard.displayName = "ProjectCard";

export default DashboardSection;
