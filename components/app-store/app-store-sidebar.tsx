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

  let tone = "bg-primary/10 text-primary border-primary/20";
  let text = "";
  let spinning = false;

  if (set.status === "planning") {
    text = "Art directing your set — palette, type, device rules…";
    spinning = true;
  } else if (set.status === "generating" || rendering > 0) {
    text = `Rendering screens · ${done}/${total} ready`;
    tone = "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
    spinning = true;
  } else if (set.status === "failed") {
    text = set.error || "Generation failed.";
    tone = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  } else {
    text = failed > 0 ? `${done} ready · ${failed} failed` : `${done} screens ready`;
    tone = "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  }

  return (
    <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium", tone)}>
      {spinning ? (
        <Spinner className="mt-0.5 size-3.5 shrink-0" />
      ) : set.status === "failed" ? (
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      ) : (
        <Check className="mt-0.5 size-3.5 shrink-0" />
      )}
      <span className="leading-snug">{text}</span>
    </div>
  );
}

const StyleGuideCard = memo(function StyleGuideCard({ set }: { set: AppStoreSetDTO }) {
  const [open, setOpen] = useState(false);
  const g = set.styleGuide;
  if (!g) {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Palette className="size-3.5" /> Style guide
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="size-6 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Being decided by the art director…</p>
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
    <div className="rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Palette className="size-3.5" /> Style guide
        </span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <div className="mt-3 flex items-center gap-1.5">
        {swatches.map(([label, hex]) => (
          <span
            key={label}
            title={`${label} ${hex}`}
            className="size-6 rounded-full ring-1 ring-black/10 dark:ring-white/15"
            style={{ background: hex }}
          />
        ))}
        <span className="ml-auto text-[11px] capitalize text-muted-foreground">
          {g.palette.deviceFrame} frame · captions {g.captionPlacement}
        </span>
      </div>

      <p className={cn("mt-2.5 text-xs leading-relaxed text-muted-foreground", !open && "line-clamp-2")}>
        {g.concept}
      </p>

      {open && (
        <dl className="mt-3 space-y-2 text-xs">
          <div>
            <dt className="font-medium text-foreground">Mood</dt>
            <dd className="text-muted-foreground">{g.mood}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Typography</dt>
            <dd className="text-muted-foreground">{g.typography.family} · {g.typography.textCase} case</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Background</dt>
            <dd className="text-muted-foreground">{g.backgroundStyle}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Device</dt>
            <dd className="text-muted-foreground">{g.deviceTreatment}</dd>
          </div>
          {g.decorativeMotif && g.decorativeMotif.toLowerCase() !== "none" && (
            <div>
              <dt className="font-medium text-foreground">Motif</dt>
              <dd className="text-muted-foreground">{g.decorativeMotif}</dd>
            </div>
          )}
        </dl>
      )}
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
        "rounded-xl border bg-card p-2.5 transition-colors",
        screen.status === "failed" ? "border-red-400/40" : "border-border",
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="relative shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/5 dark:ring-white/10"
          style={{ width: 56, height: Math.round(56 / platform.aspect) }}
        >
          {image ? (
            <img src={image.src} alt={screen.headline} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {busy ? (
                <Spinner className="size-3.5 text-muted-foreground" />
              ) : screen.status === "failed" ? (
                <AlertTriangle className="size-4 text-red-500" />
              ) : (
                <span className="text-[10px] text-muted-foreground">…</span>
              )}
            </div>
          )}
        </div>

        {/* Copy + actions */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                Screen {screen.index + 1}
              </p>
              <p className="truncate text-sm font-semibold text-foreground" title={screen.headline}>
                {screen.headline || <span className="text-muted-foreground">Deciding headline…</span>}
              </p>
              {screen.subheadline && (
                <p className="truncate text-xs text-muted-foreground" title={screen.subheadline}>
                  {screen.subheadline}
                </p>
              )}
            </div>
            <StatusChip status={screen.status} planning={set.status === "planning"} />
          </div>

          {screen.status === "failed" && screen.error && (
            <p className="mt-1.5 line-clamp-2 text-[11px] text-red-600 dark:text-red-400">
              {screen.error}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-xs"
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
                    className="h-7 rounded-full px-2.5 text-xs"
                    disabled={downloading != null}
                  >
                    {downloading ? <Spinner className="size-3" /> : <Download className="size-3" />}
                    Download
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-xl">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                    {platform.store} sizes
                  </DropdownMenuLabel>
                  {primaryTargets.map((t) => (
                    <TargetItem key={t} target={t} onSelect={() => handleDownload(t)} />
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">
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
        <div className="mt-2.5 rounded-lg border border-border bg-background p-2">
          <Textarea
            value={adjustments}
            onChange={(e) => setAdjustments(e.target.value)}
            placeholder="Optional adjustments, e.g. “make the headline shorter”, “show the dark-mode screenshot”, “less tilt”. Leave empty to simply re-roll."
            className="min-h-16 resize-none border-0 bg-transparent p-1 text-xs shadow-none focus-visible:ring-0"
            maxLength={800}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Costs {cost} credits</span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-full text-xs"
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
    <DropdownMenuItem onClick={onSelect} className="cursor-pointer rounded-lg">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-xs font-medium">{t.label}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {t.width}×{t.height}
        </span>
      </div>
    </DropdownMenuItem>
  );
}

function StatusChip({ status, planning }: { status: AppStoreScreenDTO["status"]; planning: boolean }) {
  const map: Record<string, string> = {
    done: "bg-green-500/10 text-green-700 dark:text-green-400",
    generating: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400",
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
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", map[status])}>
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
        "relative flex h-full min-h-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-[340px]",
      )}
    >
      {isCollapsed && (
        <div className="flex flex-col items-center pt-3">
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
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
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">App Store Screens</h3>
              {set && platform && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {platform.label} · {QUALITY_OPTIONS[set.quality].label} · {set.model}
                </p>
              )}
            </div>
            <button
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <SidebarToggleIcon />
            </button>
          </div>

          {/* Body */}
          <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-3">
            {isPending && (
              <div className="space-y-2">
                <div className="h-9 rounded-xl bg-muted animate-pulse" />
                <div className="h-24 rounded-xl bg-muted animate-pulse" />
                <div className="h-20 rounded-xl bg-muted animate-pulse" />
              </div>
            )}
            {isError && (
              <p className="text-xs text-red-600">Could not load this set.</p>
            )}
            {!isPending && !set && !isError && (
              <p className="text-xs text-muted-foreground">No App Store set is attached to this project.</p>
            )}

            {set && (
              <>
                <StatusBanner set={set} />
                <StyleGuideCard set={set} />

                <div className="flex items-center justify-between pt-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    Screens <span className="text-muted-foreground">({set.screens.length})</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {CREDITS_PER_SCREEN[set.quality]} credits / re-render
                  </span>
                </div>

                <div className="space-y-2">
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
            <div className="shrink-0 border-t border-border p-3">
              <Button
                type="button"
                className="w-full rounded-full"
                disabled={doneScreens.length === 0 || downloadingAll}
                onClick={downloadAll}
              >
                {downloadingAll ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
                Download all · {EXPORT_TARGETS[platform.exportTargets[0]].label}
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                {EXPORT_TARGETS[platform.exportTargets[0]].width}×{EXPORT_TARGETS[platform.exportTargets[0]].height} PNG, ready to upload
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
    <div className="rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-xs font-medium text-foreground">Brief</span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <p className={cn("mt-2 text-xs leading-relaxed text-muted-foreground", !open && "line-clamp-2")}>
        <span className="font-medium text-foreground">{b.appName}</span>
        {b.tagline ? ` — ${b.tagline}. ` : ". "}
        {b.description}
      </p>
      {open && (
        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <p><span className="text-foreground">Category:</span> {b.category}</p>
          <p><span className="text-foreground">Tone:</span> {b.tone}</p>
          {b.audience && <p><span className="text-foreground">Audience:</span> {b.audience}</p>}
          {b.brandColors.length > 0 && (
            <p className="flex items-center gap-1.5">
              <span className="text-foreground">Brand colours:</span>
              {b.brandColors.map((c) => (
                <span key={c} className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} title={c} />
              ))}
            </p>
          )}
          {b.features.length > 0 && (
            <div>
              <p className="text-foreground">Key moments:</p>
              <ol className="ml-4 list-decimal">
                {b.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ol>
            </div>
          )}
          {b.extraInstructions && (
            <p><span className="text-foreground">Instructions:</span> {b.extraInstructions}</p>
          )}
        </div>
      )}
    </div>
  );
}
