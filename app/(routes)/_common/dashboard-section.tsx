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
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
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

  // When arriving from Mini Tools (?mini=wireframe or ?mini=inspirations), set device type
  React.useEffect(() => {
    const mini = searchParams.get("mini");
    if (mini === "wireframe") setDeviceType("wireframe");
    else if (mini === "inspirations") setDeviceType("inspirations");
  }, [searchParams]);

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

  const handleSubmit = async (promptText: string) => {
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
        {/* <Header /> */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {/* Hero */}
          <div className="relative overflow-hidden py-14 sm:py-20 border-b border-border">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" />
                  {/* <Users className="size-4 -ml-2" /> */}
                </span>
                Join 30,000+ app founders building today
              </p>
              <h1 className="text-center font-bold text-3xl sm:text-4xl md:text-5xl mt-4 mb-10 tracking-tight text-foreground">
                Bring Your <span className="text-foreground/90">Ideas</span> to
                Life
              </h1>
              <div className="w-full flex flex-col items-center gap-6">
              {(deviceType === "wireframe" || deviceType === "inspirations") ? (
                <div className="w-full max-w-156 mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {deviceType === "wireframe" ? "Wireframe" : "Reimagine"}
                    </span>
                    <div className="flex rounded-lg bg-muted p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          deviceType === "wireframe"
                            ? setWireframeKind("web")
                            : setInspirationKind("web")
                        }
                        className={cn(
                          "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                          (deviceType === "wireframe"
                            ? wireframeKind
                            : inspirationKind) === "web"
                            ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Web
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deviceType === "wireframe"
                            ? setWireframeKind("mobile")
                            : setInspirationKind("mobile")
                        }
                        className={cn(
                          "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                          (deviceType === "wireframe"
                            ? wireframeKind
                            : inspirationKind) === "mobile"
                            ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={(e) => {
                      setDeviceType("mobile");
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to main
                  </Link>
                </div>
              ) : (
                <div className="relative flex rounded-lg bg-muted p-0.5">
                  <div
                    className={cn(
                      "absolute inset-y-0.5 w-1/2 rounded-xl bg-foreground dark:bg-primary transition-transform duration-300 ease-in-out",
                      deviceType === "web"
                        ? "translate-x-full"
                        : "translate-x-0"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setDeviceType("mobile")}
                    className={cn(
                      "relative z-10 flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      deviceType === "mobile"
                        ? "text-white dark:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Mobile App
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceType("web")}
                    className={cn(
                      "relative z-10 w-50 flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      deviceType === "web"
                        ? "text-white dark:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Web Platform
                  </button>
                </div>
              )}
              <div className="w-full">
                <PromptInput
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
              <ExploreGrid
                projects={exploreProjects}
                isLoading={exploreLoading}
              />
            </div>
          </div>

          {/* My Projects */}
          <div className="w-full py-10">
            <div className="w-full max-w-6xl mx-auto px-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <h2 className="font-semibold text-2xl tracking-tight text-foreground">
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
                      All Projects
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
                      Favourites
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
                <ProjectShimmerGrid count={4} className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3" />
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
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: Math.min(index * 0.05, 0.3),
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function ProjectShimmerCard() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-neutral-400 dark:bg-neutral-800">
      <div className="h-36 relative overflow-hidden bg-neutral-300 dark:bg-neutral-700">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-3 w-1/2 rounded bg-neutral-800 dark:bg-neutral-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function ProjectShimmerGrid({ count = 10, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <ProjectShimmerCard key={i} />
      ))}
    </div>
  );
}

type ExploreItem = {
  id: string;
  name: string;
  thumbnail: string | null;
  deviceType: string;
  updatedAt: string;
};

const ExploreGrid = memo(function ExploreGrid({
  projects,
  isLoading,
}: {
  projects: ExploreItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <ProjectShimmerGrid
        count={4}
        className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      />
    );
  }
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No explore projects yet. Admins can move projects to Explore from the
          project menu.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/project/${p.id}`}
          className="flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-200 will-change-transform bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
        >
          <div className="h-36 relative overflow-hidden flex items-center justify-center">
            {p.thumbnail ? (
              <img
                src={p.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
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
              {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}{" "}
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
  );
});

const INITIAL_VISIBLE_COUNT = 15; /* at least 3 rows (e.g. 5 cols × 3) */

const ProjectsGridImpl = ({
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
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // ── Shared mutations (called ONCE, not per-card) ────────────────────
  const { mutate: renameProject, isPending: isRenaming } = useRenameProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { mutate: duplicateProject, isPending: isDuplicating } = useDuplicateProject();
  const { mutate: setFavorite, isPending: isTogglingFavorite } = useSetProjectFavorite();

  // ── Shared dialog state (1 rename + 1 delete dialog for ALL cards) ──
  const [dialogProject, setDialogProject] = React.useState<ProjectType | null>(null);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const openRename = React.useCallback((p: ProjectType) => {
    setDialogProject(p);
    setRenameValue(p.name);
    setRenameOpen(true);
  }, []);

  const openDelete = React.useCallback((p: ProjectType) => {
    setDialogProject(p);
    setDeleteOpen(true);
  }, []);

  const handleRenameSubmit = () => {
    if (!dialogProject) return;
    const name = renameValue.trim();
    if (!name) return;
    renameProject(
      { projectId: dialogProject.id, name },
      { onSuccess: () => { setRenameOpen(false); setDialogProject(null); } }
    );
  };

  const handleDeleteConfirm = () => {
    if (!dialogProject) return;
    deleteProject(dialogProject.id, {
      onSuccess: () => { setDeleteOpen(false); setDialogProject(null); },
    });
  };

  return (
    <>
      <div
        ref={ref}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {projects.map((project: ProjectType, index: number) => (
          <motion.div
            key={project.id}
            custom={index}
            initial="hidden"
            animate={index < INITIAL_VISIBLE_COUNT || isInView ? "visible" : "hidden"}
            variants={cardVariants}
          >
            <ProjectCard
              project={project}
              isAdmin={isAdmin}
              onMoveToExplore={onMoveToExplore}
              isMovingToExplore={isMovingToExplore}
              onRename={openRename}
              onDelete={openDelete}
              onDuplicate={duplicateProject}
              isDuplicating={isDuplicating}
              onToggleFavorite={setFavorite}
              isTogglingFavorite={isTogglingFavorite}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Shared Rename Dialog ─────────────────────────────────────── */}
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
            <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={isRenaming}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} disabled={isRenaming || !renameValue.trim()}>
              {isRenaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Shared Delete Dialog ─────────────────────────────────────── */}
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
            Are you sure you want to delete &quot;{dialogProject?.name}&quot;? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ProjectsGrid = memo(ProjectsGridImpl);
ProjectsGrid.displayName = "ProjectsGrid";

// ── Lightweight ProjectCard — no hooks, no dialogs ──────────────────────
export const ProjectCard = memo(
  ({
    project,
    isAdmin,
    onMoveToExplore,
    isMovingToExplore,
    onRename,
    onDelete,
    onDuplicate,
    isDuplicating,
    onToggleFavorite,
    isTogglingFavorite,
  }: {
    project: ProjectType;
    isAdmin?: boolean;
    onMoveToExplore?: (args: { projectId: string; isExplore: boolean }) => void;
    isMovingToExplore?: boolean;
    onRename: (p: ProjectType) => void;
    onDelete: (p: ProjectType) => void;
    onDuplicate: (id: string) => void;
    isDuplicating: boolean;
    onToggleFavorite: (args: { projectId: string; isFavorite: boolean }) => void;
    isTogglingFavorite: boolean;
  }) => {
    const router = useRouter();
    const thumbnail = project.thumbnail || null;

    const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
      addSuffix: true,
    });

    const deviceLabel =
      project.deviceType === "web"
        ? "Web App"
        : project.deviceType === "mobile"
        ? "iOS"
        : project.deviceType === "wireframe"
        ? "Wireframe"
        : "Inspirations";

    return (
      <div
        role="button"
        className="w-full flex flex-col rounded-xl cursor-pointer overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-200 will-change-transform relative bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
        onClick={() => router.push(`/project/${project.id}`)}
      >
        <div className="h-36 relative overflow-hidden flex items-center justify-center">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
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
                    onToggleFavorite({
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
                    onRename(project);
                  }}
                >
                  <Pencil className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onDuplicate(project.id);
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
                    onDelete(project);
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
    );
  }
);
ProjectCard.displayName = "ProjectCard";

export default DashboardSection;
