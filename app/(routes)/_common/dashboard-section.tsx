"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import PromptInput from "@/components/prompt-input";
import Header from "./header";
import DashboardSidebar from "./dashboard-sidebar";
import {
  useCreateProject,
  useRenameProject,
  useDeleteProject,
  useDuplicateProject,
  useSetProjectFavorite,
} from "@/features/use-project";
import { useProfile } from "@/context/profile-provider";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  CompassIcon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  SmartPhone01Icon,
  StarIcon,
  WebDesign01Icon,
  Layout01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { motion, useInView, Variants } from "framer-motion";
import { DeviceType } from "@/components/prompt-input";
import { openSauceOne, instrumentSerif } from "@/app/fonts";
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
import { ProjectThumbnail } from "@/components/ui/project-thumbnail";
import NavBar from "@/components/dashboard/NavBar";
import ToolsSection from "@/components/dashboard/tools/ToolsSection";
import NewModel from "@/components/dashboard/NewModel";
import ExploreDesign from "@/components/dashboard/ExploreDesign";

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
    "web",
  );

  // When arriving from Mini Tools (?mini=wireframe or ?mini=inspirations), set device type.
  // The navbar's Mobile App / Web Platform tabs use ?type= and jump to the prompt.
  React.useEffect(() => {
    const mini = searchParams.get("mini");
    if (mini === "wireframe") setDeviceType("wireframe");
    else if (mini === "inspirations") setDeviceType("inspirations");
    const type = searchParams.get("type");
    if (type === "web" || type === "mobile") {
      setDeviceType(type);
      document
        .getElementById("new-design")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchParams]);

  const { mutate, isPending } = useCreateProject();
  const { data: profile } = useProfile();

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
          {/* NavBar lives inside <main> as a sticky top-0 element so the
              backdrop-blur "frosted glass" effect actually sees content
              scrolling underneath it. */}
          <NavBar />

          {/* Explore designs — first thing on the page, like the reference. */}
          {/* <ExploreDesign /> */}

          {/* Hero — id anchors the NewModel banner's "Try" CTA. */}
          <div
            id="new-design"
            className={`relative overflow-hidden py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-10 ${instrumentSerif.variable}`}
          >
            {/* Quiet sky wash behind the prompt area — ties to the landing. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-200 -translate-x-1/2 rounded-full bg-sky-100/60 blur-[100px] dark:bg-sky-500/8"
            />
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
              <p className="mb-2.5 text-sm font-medium text-muted-foreground">
                Welcome back,{" "}
                {(profile?.name || user?.name || "")
                  .toString()
                  .trim()
                  .split(" ")[0] || "there"}
              </p>
              <h1 className="font-display mb-7 text-center text-[38px] leading-[1.08] text-foreground sm:text-5xl md:text-[56px]">
                What will you design{" "}
                <em className="italic text-sky-600 dark:text-sky-400">
                  today
                </em>
                ?
              </h1>

              <div className="w-full flex flex-col items-center gap-6">
                {deviceType === "wireframe" || deviceType === "inspirations" ? (
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
                              ? "bg-sky-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
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
                              ? "bg-sky-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
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
                  <div
                    role="group"
                    aria-label="Design type"
                    className="relative grid grid-cols-2 rounded-full border border-border/60 bg-muted p-1"
                  >
                    {/* Sliding thumb — exactly one grid cell wide, so it
                        always matches the segment above it. */}
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-card shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/4 transition-transform duration-300 ease-out dark:ring-white/10",
                        deviceType === "web"
                          ? "translate-x-full"
                          : "translate-x-0",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setDeviceType("mobile")}
                      aria-pressed={deviceType === "mobile"}
                      className={cn(
                        "relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors",
                        deviceType === "mobile"
                          ? "font-semibold text-sky-600 dark:text-sky-400"
                          : "font-medium text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <HugeiconsIcon
                        icon={SmartPhone01Icon}
                        size={15}
                        color="currentColor"
                        strokeWidth={deviceType === "mobile" ? 2 : 1.75}
                      />
                      Mobile App
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceType("web")}
                      aria-pressed={deviceType === "web"}
                      className={cn(
                        "relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors",
                        deviceType === "web"
                          ? "font-semibold text-sky-600 dark:text-sky-400"
                          : "font-medium text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <HugeiconsIcon
                        icon={WebDesign01Icon}
                        size={15}
                        color="currentColor"
                        strokeWidth={deviceType === "web" ? 2 : 1.75}
                      />
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
          {/* <div className="w-full py-12">
            <div className="w-full max-w-7xl mx-auto px-6">
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
          </div> */}

          {/* TOOLS */}
          <ToolsSection />

          {/* New Model — banner needs its own breathing room and the
              standard horizontal padding so its outer edges line up with
              the other sections (NewModel itself has no outer padding). */}
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
            <NewModel />
          </div>

          <ExploreDesign />
          {/* My Projects */}
          {/* <div className="w-full py-10 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  My Projects
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-full border border-border bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setProjectsFilter("all")}
                      aria-pressed={projectsFilter === "all"}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                        projectsFilter === "all"
                          ? "bg-sky-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      All Projects
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectsFilter("favorites")}
                      aria-pressed={projectsFilter === "favorites"}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                        projectsFilter === "favorites"
                          ? "bg-sky-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Favorites
                    </button>
                  </div>
                  <Link
                    href="/projects"
                    className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                  >
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
              {isLoading ? (
                <ProjectShimmerGrid
                  count={4}
                  className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-3"
                />
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
          </div> */}
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
    <div className="flex flex-col rounded-xl overflow-hidden bg-muted border border-border">
      <div className="h-44 relative overflow-hidden bg-muted-foreground/10">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-muted-foreground/10 to-transparent" />
      </div>
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-muted-foreground/15 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-muted-foreground/15 to-transparent" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted-foreground/10 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-muted-foreground/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function ProjectShimmerGrid({
  count = 10,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
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
        className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/project/${p.id}`}
          className="flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-200 will-change-transform bg-card border border-border"
        >
          <div className="h-44 relative overflow-hidden">
            <ProjectThumbnail projectId={p.id} deviceType={p.deviceType} />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-[15px] leading-[1.4] mb-1 line-clamp-1 text-card-foreground">
              {p.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}{" "}
              •{" "}
              {p.deviceType === "web"
                ? "Web"
                : p.deviceType === "mobile"
                  ? "Mobile"
                  : p.deviceType === "app-store"
                    ? "App Store"
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
  const { mutate: duplicateProject, isPending: isDuplicating } =
    useDuplicateProject();
  const { mutate: setFavorite, isPending: isTogglingFavorite } =
    useSetProjectFavorite();

  // ── Shared dialog state (1 rename + 1 delete dialog for ALL cards) ──
  const [dialogProject, setDialogProject] = React.useState<ProjectType | null>(
    null,
  );
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
      {
        onSuccess: () => {
          setRenameOpen(false);
          setDialogProject(null);
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!dialogProject) return;
    deleteProject(dialogProject.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDialogProject(null);
      },
    });
  };

  return (
    <>
      <div
        ref={ref}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {projects.map((project: ProjectType, index: number) => (
          <motion.div
            key={project.id}
            custom={index}
            initial="hidden"
            animate={
              index < INITIAL_VISIBLE_COUNT || isInView ? "visible" : "hidden"
            }
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
            Are you sure you want to delete &quot;{dialogProject?.name}&quot;?
            This cannot be undone.
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
    onToggleFavorite: (args: {
      projectId: string;
      isFavorite: boolean;
    }) => void;
    isTogglingFavorite: boolean;
  }) => {
    const router = useRouter();

    const timeAgo = formatDistanceToNow(new Date(project.createdAt), {
      addSuffix: true,
    });

    const device =
      project.deviceType === "web"
        ? { label: "Web", icon: WebDesign01Icon }
        : project.deviceType === "mobile"
          ? { label: "Mobile", icon: SmartPhone01Icon }
          : project.deviceType === "wireframe"
            ? { label: "Wireframe", icon: Layout01Icon }
            : project.deviceType === "app-store"
              ? { label: "App Store", icon: SmartPhone01Icon }
              : { label: "Inspirations", icon: Image01Icon };

    return (
      <div
        role="button"
        className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:border-sky-300/60 hover:shadow-lg dark:hover:border-sky-500/30"
        onClick={() => router.push(`/project/${project.id}`)}
      >
        <div className="h-44 relative overflow-hidden">
          <ProjectThumbnail
            projectId={project.id}
            deviceType={project.deviceType}
          />

          {/* Favorite marker — only when set, quiet amber. */}
          {project.isFavorite && (
            <span
              className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/45 text-amber-300 backdrop-blur-sm"
              title="Favorite"
            >
              <HugeiconsIcon
                icon={StarIcon}
                size={14}
                color="currentColor"
                strokeWidth={2}
                fill="currentColor"
              />
            </span>
          )}

          {/* Options — revealed on hover/focus so cards stay quiet at rest. */}
          <div
            className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full border-0 bg-black/45 text-white shadow-sm backdrop-blur-sm hover:bg-black/60"
                  aria-label="Project options"
                >
                  <HugeiconsIcon
                    icon={MoreVerticalIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={2}
                  />
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
                  <HugeiconsIcon
                    icon={StarIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                    fill={project.isFavorite ? "currentColor" : "none"}
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
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onDuplicate(project.id);
                  }}
                  disabled={isDuplicating}
                >
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
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
                    <HugeiconsIcon
                      icon={CompassIcon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
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
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="mb-1 line-clamp-1 text-[15px] font-semibold leading-[1.4] text-card-foreground">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <HugeiconsIcon
              icon={device.icon}
              size={13}
              color="currentColor"
              strokeWidth={1.75}
            />
            {device.label}
          </span>
        </div>
      </div>
    );
  },
);
ProjectCard.displayName = "ProjectCard";

export default DashboardSection;
