"use client";

import { memo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useRegenerateScreen } from "@/features/use-app-store";
import {
  slotPosition,
  slotSize,
  type AppStoreScreenDTO,
  type AppStoreSetDTO,
} from "@/lib/app-store/specs";

/**
 * Placeholder slots rendered inside the canvas' transformed layer for every
 * screen that has not landed as a canvas image yet. Positions match exactly
 * where the job will drop the finished image, so the canvas doesn't jump.
 */
export const AppStoreSlotsLayer = memo(function AppStoreSlotsLayer({
  set,
  projectId,
}: {
  set: AppStoreSetDTO | null | undefined;
  projectId: string;
}) {
  const regenerate = useRegenerateScreen(projectId);
  if (!set) return null;

  const dims = slotSize(set.platform);
  const planning = set.status === "planning";
  const pending = set.screens.filter((s) => s.status !== "done");
  if (pending.length === 0) return null;

  return (
    <>
      {pending.map((screen) => {
        const pos = slotPosition(screen.index);
        return (
          <Slot
            key={screen.id}
            screen={screen}
            planning={planning}
            style={{ left: pos.x, top: pos.y, width: dims.width, height: dims.height }}
            onRetry={() => regenerate.mutate({ screenId: screen.id })}
            retrying={regenerate.isPending}
          />
        );
      })}
    </>
  );
});

function Slot({
  screen,
  planning,
  style,
  onRetry,
  retrying,
}: {
  screen: AppStoreScreenDTO;
  planning: boolean;
  style: React.CSSProperties;
  onRetry: () => void;
  retrying: boolean;
}) {
  const failed = screen.status === "failed";
  const generating = screen.status === "generating";

  return (
    <div
      className={cn(
        "absolute z-40 flex flex-col overflow-hidden rounded-[28px] border shadow-sm",
        failed
          ? "border-red-400/40 bg-red-500/5"
          : "border-border/70 bg-card/80 backdrop-blur-sm",
      )}
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {!failed && (
        <div className="absolute inset-0 generating-gradient opacity-60" aria-hidden />
      )}

      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground shadow-sm">
            {String(screen.index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm",
              failed
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-background/80 text-foreground",
            )}
          >
            {failed ? (
              <AlertTriangle className="size-3" />
            ) : (
              <Spinner className="size-3" />
            )}
            {failed
              ? "Failed"
              : planning
                ? "Art directing"
                : generating
                  ? "Rendering"
                  : "Queued"}
          </span>
        </div>

        {/* Faux composition so the slot reads as a screenshot-in-progress */}
        <div className="mt-8 flex flex-1 flex-col items-center">
          <div className="min-h-[3.5rem] w-full px-2 text-center">
            {screen.headline ? (
              <p className="text-balance text-[22px] font-bold leading-tight text-foreground/90">
                {screen.headline}
              </p>
            ) : (
              <div className="mx-auto space-y-2">
                <div className="mx-auto h-5 w-3/4 rounded-full bg-foreground/10 animate-pulse" />
                <div className="mx-auto h-5 w-1/2 rounded-full bg-foreground/10 animate-pulse" />
              </div>
            )}
            {screen.subheadline && (
              <p className="mt-2 text-sm text-muted-foreground">{screen.subheadline}</p>
            )}
          </div>

          <div className="mt-6 w-[72%] flex-1 rounded-[32px] border-[6px] border-foreground/15 bg-background/60 shadow-inner" />
        </div>

        {failed && (
          <div className="relative mt-4 rounded-xl border border-red-400/30 bg-background/80 p-3">
            <p className="line-clamp-3 text-xs text-red-600 dark:text-red-400">
              {screen.error || "The image model could not render this screen."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className="size-3" />
              Retry (credits apply)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Top-center status pill shown while a set is being produced. */
export function AppStoreStatusPill({ set }: { set: AppStoreSetDTO | null | undefined }) {
  if (!set) return null;
  const total = set.screens.length;
  const done = set.screens.filter((s) => s.status === "done").length;
  const rendering = set.screens.filter((s) => s.status === "generating").length;
  const busy = set.status === "planning" || set.status === "generating" || rendering > 0;
  if (!busy) return null;

  const label =
    set.status === "planning"
      ? "Art directing your set…"
      : rendering > 0
        ? `Rendering ${Math.min(done + rendering, total)} of ${total}…`
        : `Rendering ${done} of ${total}…`;

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg">
      <Spinner className="size-3.5" />
      {label}
      <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}
