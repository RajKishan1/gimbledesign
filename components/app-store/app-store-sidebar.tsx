"use client";

import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Palette,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  downloadScreenExport,
  useAppStoreSet,
  useRegenerateScreen,
} from "@/features/use-app-store";
import {
  CREDITS_PER_SCREEN,
  EXPORT_TARGETS,
  EXPORT_TARGET_IDS,
  PLATFORMS,
  QUALITY_OPTIONS,
  type AppStoreScreenDTO,
  type AppStoreSetDTO,
  type ExportTargetId,
} from "@/lib/app-store/specs";

type CanvasImageRow = { id: string; src: string; width: number; height: number };

// ─── Small pieces ─────────────────────────────────────────────────────────────

function SidebarToggleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.33325 8C1.33325 5.54058 1.33325 4.31087 1.8758 3.43918C2.07652 3.11668 2.32586 2.83618 2.61253 2.61036C3.38736 2 4.48043 2 6.66658 2H9.33325C11.5194 2 12.6125 2 13.3873 2.61036C13.674 2.83618 13.9233 3.11668 14.1241 3.43918C14.6666 4.31087 14.6666 5.54058 14.6666 8C14.6666 10.4594 14.6666 11.6891 14.1241 12.5608C13.9233 12.8833 13.674 13.1638 13.3873 13.3897C12.6125 14 11.5194 14 9.33325 14H6.66658C4.48043 14 3.38736 14 2.61253 13.3897C2.32586 13.1638 2.07652 12.8833 1.8758 12.5608C1.33325 11.6891 1.33325 10.4594 1.33325 8Z" stroke="#B5B5B5" strokeWidth="1.24444" />
      <path d="M6.33325 2V14" stroke="#B5B5B5" strokeWidth="1.24444" strokeLinejoin="round" />
      <path d="M3.33325 4.66797H3.99992M3.33325 6.66797H3.99992" stroke="#B5B5B5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBanner({ set }: { set: AppStoreSetDTO }) {
  const total = set.screens.length;
  const done = set.screens.filter((s) => s.status === "done").length;
  const failed = set.screens.filter((s) => s.status === "failed").length;
  const rendering = set.screens.filter((s) => s.status === "generating").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  let tone = "border-primary/20 bg-primary/[0.06] text-primary";
  let iconTone = "bg-primary/10";
  let progressTone = "bg-primary";
  let text = "";
  let spinning = false;

  if (set.status === "planning") {
    text = "Art directing your set — palette, type, device rules…";
    spinning = true;
  } else if (set.status === "generating" || rendering > 0) {
    text = `Rendering screens · ${done}/${total} ready`;
    spinning = true;
  } else if (set.status === "failed") {
    text = set.error || "Generation failed.";
    tone = "border-red-500/20 bg-red-500/[0.06] text-red-600 dark:text-red-400";
    iconTone = "bg-red-500/10";
    progressTone = "bg-red-500";
  } else {
    text = failed > 0 ? `${done} ready · ${failed} failed` : `${done} screens ready`;
    tone = "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400";
    iconTone = "bg-emerald-500/10";
    progressTone = "bg-emerald-500";
  }

  return (
    <div className={cn("rounded-2xl border p-3.5", tone)}>
      <div className="flex items-center gap-3">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", iconTone)}>
          {spinning ? (
            <Spinner className="size-3.5" />
          ) : set.status === "failed" ? (
            <AlertTriangle className="size-3.5" />
          ) : (
            <Check className="size-3.5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug text-foreground">{text}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {set.status === "planning" ? "Preparing the visual system" : `${progress}% complete`}
          </p>
        </div>
        <span className="rounded-lg bg-background/70 px-2 py-1 text-[11px] font-semibold tabular-nums shadow-xs">
          {done}/{total}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", progressTone)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

const StyleGuideCard = memo(function StyleGuideCard({ set }: { set: AppStoreSetDTO }) {
  const [open, setOpen] = useState(false);
  const g = set.styleGuide;
  if (!g) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Palette className="size-3.5" />
          </span>
          Style guide
        </div>
        <div className="mt-3 flex h-8 gap-1 overflow-hidden rounded-lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 bg-muted animate-pulse" />
          ))}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          Being decided by the art director…
        </p>
      </div>
    );
  }

  const swatches = [
    ["Background", g.palette.background],
    ["Secondary", g.palette.backgroundSecondary],
    ["Accent", g.palette.accent],
    ["Headline", g.palette.headline],
    ["Subheadline", g.palette.subheadline],
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 pb-2 pt-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <span className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Palette className="size-3.5" />
          </span>
          Style guide
        </span>
        <span className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      <div className="mx-3.5 flex h-8 gap-1 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10">
        {swatches.map(([label, hex]) => (
          <span
            key={label}
            title={`${label} ${hex}`}
            className="min-w-0 flex-1 first:flex-[1.35]"
            style={{ background: hex }}
          />
        ))}
      </div>

      <p className={cn("mx-3.5 mt-3 text-xs leading-relaxed text-muted-foreground", !open && "line-clamp-2")}>
        {g.concept}
      </p>

      <div className="mx-3.5 mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium capitalize text-muted-foreground">
          {g.palette.deviceFrame} frame
        </span>
        <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          Captions {g.captionPlacement}
        </span>
      </div>

      {open && (
        <dl className="mx-3.5 mt-3 divide-y divide-border/70 border-t border-border/70 text-xs">
          <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5">
            <dt className="font-medium text-muted-foreground">Mood</dt>
            <dd className="text-right leading-relaxed text-foreground">{g.mood}</dd>
          </div>
          <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5">
            <dt className="font-medium text-muted-foreground">Typography</dt>
            <dd className="text-right leading-relaxed text-foreground">{g.typography.family} · {g.typography.textCase} case</dd>
          </div>
          <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5">
            <dt className="font-medium text-muted-foreground">Background</dt>
            <dd className="text-right leading-relaxed text-foreground">{g.backgroundStyle}</dd>
          </div>
          <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5">
            <dt className="font-medium text-muted-foreground">Device</dt>
            <dd className="text-right leading-relaxed text-foreground">{g.deviceTreatment}</dd>
          </div>
          {g.decorativeMotif && g.decorativeMotif.toLowerCase() !== "none" && (
            <div className="grid grid-cols-[76px_1fr] gap-3 py-2.5">
              <dt className="font-medium text-muted-foreground">Motif</dt>
              <dd className="text-right leading-relaxed text-foreground">{g.decorativeMotif}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="h-3.5" />
    </div>
  );
});

function ScreenCard({
  projectId,
  set,
  screen,
  image,
}: {
  projectId: string;
  set: AppStoreSetDTO;
  screen: AppStoreScreenDTO;
  image: CanvasImageRow | undefined;
}) {
  const regenerate = useRegenerateScreen(projectId);
  const [editing, setEditing] = useState(false);
  const [adjustments, setAdjustments] = useState("");
  const [downloading, setDownloading] = useState<ExportTargetId | null>(null);

  const cost = CREDITS_PER_SCREEN[set.quality];
  const busy = screen.status === "generating" || set.status === "planning";
  const platform = PLATFORMS[set.platform];
  const primaryTargets = platform.exportTargets;
  const otherTargets = EXPORT_TARGET_IDS.filter((t) => !primaryTargets.includes(t));

  const handleDownload = async (target: ExportTargetId) => {
    setDownloading(target);
    try {
      await downloadScreenExport(projectId, screen.id, target);
    } catch {
      toast.error("Export failed");
    } finally {
      setDownloading(null);
    }
  };

  const submitRegenerate = () => {
    regenerate.mutate(
      { screenId: screen.id, adjustments: adjustments.trim() || undefined },
      {
        onSuccess: () => {
          setEditing(false);
          setAdjustments("");
        },
      },
    );
  };

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-sm",
        screen.status === "failed" ? "border-red-400/40" : "border-border/80",
      )}
    >
      <div className="flex gap-3.5 p-3">
        {/* Thumbnail */}
        <div
          className="relative shrink-0 overflow-hidden rounded-xl bg-muted shadow-inner ring-1 ring-black/5 dark:ring-white/10"
          style={{ width: 64, height: Math.round(64 / platform.aspect) }}
        >
          {image ? (
            <img src={image.src} alt={screen.headline} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,var(--muted),var(--background))]">
              {busy ? (
                <span className="flex size-8 items-center justify-center rounded-full bg-background/80 shadow-xs">
                  <Spinner className="size-3.5 text-primary" />
                </span>
              ) : screen.status === "failed" ? (
                <span className="flex size-8 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="size-4 text-red-500" />
                </span>
              ) : (
                <span className="text-lg text-muted-foreground/60">·</span>
              )}
            </div>
          )}
          <span className="absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-md bg-black/65 text-[9px] font-semibold tabular-nums text-white shadow-sm backdrop-blur-sm">
            {screen.index + 1}
          </span>
        </div>

        {/* Copy + actions */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground">
                Screen {String(screen.index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-[1.25] text-foreground" title={screen.headline}>
                {screen.headline || <span className="text-muted-foreground">Deciding headline…</span>}
              </p>
              {screen.subheadline && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground" title={screen.subheadline}>
                  {screen.subheadline}
                </p>
              )}
            </div>
            <StatusChip status={screen.status} planning={set.status === "planning"} />
          </div>

          {screen.status === "failed" && screen.error && (
            <p className="mt-2 line-clamp-2 rounded-lg bg-red-500/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-red-600 dark:text-red-400">
              {screen.error}
            </p>
          )}

          <div className="mt-auto flex items-center gap-1.5 pt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1 rounded-lg border-border/80 bg-background px-2 text-[11px] shadow-none"
              disabled={busy || regenerate.isPending}
              onClick={() => setEditing((e) => !e)}
            >
              <RefreshCw className="size-3" />
              {screen.status === "failed" ? "Retry" : "Re-render"}
            </Button>

            {screen.status === "done" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-lg border-border/80 bg-background px-2 text-[11px] shadow-none"
                    disabled={downloading != null}
                  >
                    {downloading ? <Spinner className="size-3" /> : <Download className="size-3" />}
                    Download
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl">
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
                    {platform.store} sizes
                  </DropdownMenuLabel>
                  {primaryTargets.map((t) => (
                    <TargetItem key={t} target={t} onSelect={() => handleDownload(t)} />
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-medium leading-relaxed text-muted-foreground">
                    Other stores (background extended to fit)
                  </DropdownMenuLabel>
                  {otherTargets.map((t) => (
                    <TargetItem key={t} target={t} onSelect={() => handleDownload(t)} />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="border-t border-border/70 bg-muted/30 p-3">
          <p className="mb-1.5 text-[11px] font-semibold text-foreground">Refine this screen</p>
          <Textarea
            value={adjustments}
            onChange={(e) => setAdjustments(e.target.value)}
            placeholder="Optional adjustments, e.g. “make the headline shorter”, “show the dark-mode screenshot”, “less tilt”. Leave empty to simply re-roll."
            className="min-h-20 resize-none rounded-xl border-border/80 bg-card px-3 py-2 text-xs leading-relaxed shadow-none focus-visible:ring-2"
            maxLength={800}
          />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">{cost} credits</span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-3 text-[11px]"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-lg px-3 text-[11px] shadow-sm"
                disabled={regenerate.isPending}
                onClick={submitRegenerate}
              >
                {regenerate.isPending ? <Spinner className="size-3" /> : <Sparkles className="size-3" />}
                Re-render
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetItem({ target, onSelect }: { target: ExportTargetId; onSelect: () => void }) {
  const t = EXPORT_TARGETS[target];
  return (
    <DropdownMenuItem onClick={onSelect} className="cursor-pointer rounded-lg px-2 py-2">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-[11px] font-medium">{t.label}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {t.width}×{t.height}
        </span>
      </div>
    </DropdownMenuItem>
  );
}

function StatusChip({ status, planning }: { status: AppStoreScreenDTO["status"]; planning: boolean }) {
  const map: Record<string, string> = {
    done: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 before:bg-emerald-500 dark:text-emerald-400",
    generating: "border-primary/20 bg-primary/[0.08] text-primary before:bg-primary",
    pending: "border-border bg-muted text-muted-foreground before:bg-muted-foreground/50",
    failed: "border-red-500/20 bg-red-500/[0.08] text-red-600 before:bg-red-500 dark:text-red-400",
  };
  const label =
    status === "done"
      ? "Ready"
      : status === "generating"
        ? "Rendering"
        : status === "failed"
          ? "Failed"
          : planning
            ? "Planning"
            : "Queued";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-1 text-[9px] font-semibold before:size-1 before:rounded-full before:content-['']", map[status])}>
      {label}
    </span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function AppStoreSidebar({ projectId }: { projectId: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { data: set, isPending, isError } = useAppStoreSet(projectId);

  // Same cache key as the canvas so thumbnails come for free.
  const { data: canvasImages = [] } = useQuery<CanvasImageRow[]>({
    queryKey: ["canvasImages", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/project/${projectId}/canvas-image`);
      return res.data.images ?? [];
    },
    enabled: !!projectId,
  });
  const imageById = new Map(canvasImages.map((i) => [i.id, i]));

  const platform = set ? PLATFORMS[set.platform] : null;
  const doneScreens = set?.screens.filter((s) => s.status === "done") ?? [];

  const downloadAll = async () => {
    if (!set || !platform || doneScreens.length === 0) return;
    const target = platform.exportTargets[0];
    setDownloadingAll(true);
    const t = toast.loading(`Exporting ${doneScreens.length} screens at ${EXPORT_TARGETS[target].label}…`);
    try {
      for (const s of doneScreens) {
        await downloadScreenExport(projectId, s.id, target);
      }
      toast.success("All screens downloaded", { id: t });
    } catch {
      toast.error("Some exports failed", { id: t });
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 shrink-0 flex-col border-r border-border/80 bg-card transition-[width] duration-300 ease-out",
        isCollapsed ? "w-14" : "w-[360px]",
      )}
    >
      {isCollapsed && (
        <div className="flex h-full flex-col items-center bg-card pt-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <SidebarToggleIcon />
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold leading-tight tracking-[-0.01em]">App Store screens</h3>
                {set && platform ? (
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {platform.label} · {QUALITY_OPTIONS[set.quality].label} · {set.model}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-muted-foreground">Creative production</p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <SidebarToggleIcon />
            </button>
          </div>

          {/* Body */}
          <div className="scrollbar-hide flex-1 space-y-3.5 overflow-y-auto overflow-x-hidden bg-background/50 px-3.5 pb-7 pt-3.5">
            {isPending && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-card p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-3/5 rounded-full bg-muted animate-pulse" />
                      <div className="h-2 w-2/5 rounded-full bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="h-32 rounded-2xl border border-border/70 bg-card animate-pulse" />
                <div className="h-28 rounded-2xl border border-border/70 bg-card animate-pulse" />
              </div>
            )}
            {isError && (
              <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-3.5 text-red-600 dark:text-red-400">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Set unavailable</p>
                  <p className="mt-1 text-[11px] leading-relaxed">Could not load this App Store set.</p>
                </div>
              </div>
            )}
            {!isPending && !set && !isError && (
              <div className="rounded-2xl border border-dashed border-border bg-card/70 px-5 py-8 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Sparkles className="size-4" />
                </span>
                <p className="mt-3 text-xs font-semibold text-foreground">No screen set yet</p>
                <p className="mx-auto mt-1 max-w-[220px] text-[11px] leading-relaxed text-muted-foreground">
                  This project does not have an App Store set attached.
                </p>
              </div>
            )}

            {set && (
              <>
                <StatusBanner set={set} />
                <StyleGuideCard set={set} />

                <div className="flex items-end justify-between px-0.5 pb-0.5 pt-1.5">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Screens</h4>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {set.screens.length} compositions
                    </p>
                  </div>
                  <span className="rounded-md bg-card px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-border/70">
                    {CREDITS_PER_SCREEN[set.quality]} credits to re-render
                  </span>
                </div>

                <div className="space-y-2.5">
                  {set.screens.map((screen) => (
                    <ScreenCard
                      key={screen.id}
                      projectId={projectId}
                      set={set}
                      screen={screen}
                      image={screen.canvasImageId ? imageById.get(screen.canvasImageId) : undefined}
                    />
                  ))}
                </div>

                <BriefCard set={set} />
              </>
            )}
          </div>

          {/* Footer */}
          {set && platform && (
            <div className="shrink-0 border-t border-border/80 bg-card/95 p-3.5 backdrop-blur-xl">
              <Button
                type="button"
                className="h-10 w-full rounded-xl text-xs font-semibold shadow-md shadow-primary/15"
                disabled={doneScreens.length === 0 || downloadingAll}
                onClick={downloadAll}
              >
                {downloadingAll ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
                Download all
                <span className="ml-auto rounded-md bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-medium">
                  {EXPORT_TARGETS[platform.exportTargets[0]].label}
                </span>
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                {EXPORT_TARGETS[platform.exportTargets[0]].width}×{EXPORT_TARGETS[platform.exportTargets[0]].height} PNG · ready to upload
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefCard({ set }: { set: AppStoreSetDTO }) {
  const [open, setOpen] = useState(false);
  const b = set.brief;
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <span>
          <span className="block text-xs font-semibold text-foreground">Creative brief</span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">{b.appName}</span>
        </span>
        <span className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <p className={cn("border-t border-border/70 px-3.5 pt-3 text-xs leading-relaxed text-muted-foreground", !open && "line-clamp-3")}>
        <span className="font-semibold text-foreground">{b.appName}</span>
        {b.tagline ? ` — ${b.tagline}. ` : ". "}
        {b.description}
      </p>
      {open && (
        <div className="mx-3.5 mt-3 space-y-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2">
            <dt>Category</dt>
            <dd className="text-right font-medium text-foreground">{b.category}</dd>
            <dt>Tone</dt>
            <dd className="text-right font-medium text-foreground">{b.tone}</dd>
            {b.audience && (
              <>
                <dt>Audience</dt>
                <dd className="text-right font-medium text-foreground">{b.audience}</dd>
              </>
            )}
          </dl>
          {b.brandColors.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <span>Brand colours</span>
              <span className="flex overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10">
                {b.brandColors.map((c) => (
                  <span key={c} className="h-5 w-7" style={{ background: c }} title={c} />
                ))}
              </span>
            </div>
          )}
          {b.features.length > 0 && (
            <div>
              <p className="font-medium text-foreground">Key moments</p>
              <ol className="mt-1.5 space-y-1.5">
                {b.features.map((f, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {b.extraInstructions && (
            <p className="rounded-lg bg-muted/70 p-2.5 leading-relaxed">
              <span className="font-medium text-foreground">Instructions:</span> {b.extraInstructions}
            </p>
          )}
        </div>
      )}
      <div className="h-3.5" />
    </div>
  );
}
