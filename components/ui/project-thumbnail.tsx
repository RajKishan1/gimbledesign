import * as React from "react";
import { Smartphone, Monitor, LayoutTemplate, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceTypeLike =
  | "mobile"
  | "web"
  | "wireframe"
  | "inspirations"
  | string
  | null
  | undefined;

/** Deterministic 0-based index into an array, derived from a string. */
function hashIndex(input: string, length: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % length + length) % length;
}

/**
 * Curated gradient pairs — vibrant, modern, visually distinct.
 * Each entry is [fromColor, toColor] used in a 135deg linear-gradient.
 */
const GRADIENT_PAIRS: [string, string][] = [
  ["#6366f1", "#a855f7"], // indigo → violet
  ["#0ea5e9", "#6366f1"], // sky → indigo
  ["#f59e0b", "#ef4444"], // amber → red
  ["#10b981", "#0ea5e9"], // emerald → sky
  ["#ec4899", "#8b5cf6"], // pink → purple
  ["#f97316", "#eab308"], // orange → yellow
  ["#14b8a6", "#3b82f6"], // teal → blue
  ["#8b5cf6", "#ec4899"], // purple → pink
];

function pickDeviceIcon(deviceType: DeviceTypeLike) {
  switch (deviceType) {
    case "web":
      return Monitor;
    case "wireframe":
      return LayoutTemplate;
    case "inspirations":
      return Sparkles;
    case "mobile":
    default:
      return Smartphone;
  }
}

/**
 * Shown while a project has no AI-generated thumbnail yet (or generation failed).
 * Pure CSS — costs nothing, paints instantly. Each project gets a stable
 * gradient + device icon based on its id.
 */
export function DefaultProjectThumbnail({
  projectId,
  deviceType,
  className,
}: {
  projectId: string;
  deviceType?: DeviceTypeLike;
  className?: string;
}) {
  const Icon = pickDeviceIcon(deviceType);
  const idx = hashIndex(projectId || "default", GRADIENT_PAIRS.length);
  const [from, to] = GRADIENT_PAIRS[idx];

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
      <Icon
        className="relative size-9 text-white/90 drop-shadow"
        strokeWidth={1.5}
      />
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
