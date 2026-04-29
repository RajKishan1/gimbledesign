import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MagicWand01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type DeviceTypeLike =
  | "mobile"
  | "web"
  | "wireframe"
  | "inspirations"
  | string
  | null
  | undefined;

const DEVICE_THEME: Record<string, { from: string; to: string }> = {
  mobile: { from: "#f97316", to: "#f59e0b" },
  web: { from: "#6366f1", to: "#8b5cf6" },
  wireframe: { from: "#3b82f6", to: "#6366f1" },
  inspirations: { from: "#ec4899", to: "#a855f7" },
};

function resolveTheme(deviceType: DeviceTypeLike) {
  const key = typeof deviceType === "string" ? deviceType : "";
  return DEVICE_THEME[key] ?? DEVICE_THEME.mobile;
}

function MobilePhonesIllustration() {
  return (
    <div className="relative flex items-end gap-2">
      <div className="w-10 h-20 rounded-md border border-white/40 bg-white/10 -rotate-6 flex flex-col items-center pt-1.5">
        <div className="w-3 h-1 rounded-full bg-white/40" />
      </div>
      <div className="w-12 h-24 rounded-md border border-white/45 bg-white/15 z-10 flex flex-col items-center pt-2">
        <div className="w-4 h-1 rounded-full bg-white/50" />
      </div>
      <div className="w-10 h-20 rounded-md border border-white/40 bg-white/10 rotate-6 flex flex-col items-center pt-1.5">
        <div className="w-3 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function WireframeIllustration() {
  return (
    <div className="flex flex-col gap-2 w-[55%]">
      <div className="h-3 rounded-md border border-white/40 bg-white/10" />
      <div className="h-9 rounded-md border border-white/40 bg-white/10" />
      <div className="h-5 rounded-md border border-white/40 bg-white/10" />
    </div>
  );
}

function ReimagineIllustration() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute left-0 top-2 w-16 h-16 rounded-lg border border-white/40 bg-white/10" />
      <div className="absolute right-0 bottom-0 w-16 h-16 rounded-lg border border-white/45 bg-white/15" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-neutral-900 shadow-sm">
        <HugeiconsIcon
          icon={MagicWand01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

function pickIllustration(deviceType: DeviceTypeLike) {
  switch (deviceType) {
    case "mobile":
      return <MobilePhonesIllustration />;
    case "web":
    case "wireframe":
      return <WireframeIllustration />;
    case "inspirations":
      return <ReimagineIllustration />;
    default:
      return <MobilePhonesIllustration />;
  }
}

/**
 * Shown while a project has no AI-generated thumbnail yet (or generation failed).
 * Pure CSS — costs nothing, paints instantly. Each device type gets a stable
 * gradient + matching illustration so cards feel intentional, not empty.
 */
export function DefaultProjectThumbnail({
  projectId: _projectId,
  deviceType,
  className,
}: {
  projectId: string;
  deviceType?: DeviceTypeLike;
  className?: string;
}) {
  const { from, to } = resolveTheme(deviceType);

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-hidden
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-40"
        style={{ background: from }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-30"
        style={{ background: to }}
      />
      <div className="relative flex items-center justify-center h-24">
        {pickIllustration(deviceType)}
      </div>
    </div>
  );
}

/**
 * Renders the project's AI SVG thumbnail when present, otherwise the
 * deterministic placeholder. Single source of truth for project artwork
 * across the dashboard.
 */
export function ProjectThumbnail({
  projectId,
  thumbnail,
  deviceType,
  className,
  imgClassName,
}: {
  projectId: string;
  thumbnail?: string | null;
  deviceType?: DeviceTypeLike;
  className?: string;
  imgClassName?: string;
}) {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("w-full h-full object-cover", imgClassName, className)}
      />
    );
  }
  return (
    <DefaultProjectThumbnail
      projectId={projectId}
      deviceType={deviceType}
      className={className}
    />
  );
}
