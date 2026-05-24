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

const DEVICE_THEME: Record<string, { from: string; to: string; mid: string }> = {
  mobile:       { from: "#f97316", to: "#f59e0b", mid: "#fb923c" },
  web:          { from: "#6366f1", to: "#8b5cf6", mid: "#7c3aed" },
  wireframe:    { from: "#1d4ed8", to: "#4f46e5", mid: "#3b82f6" },
  inspirations: { from: "#db2777", to: "#9333ea", mid: "#ec4899" },
};

function resolveTheme(deviceType: DeviceTypeLike) {
  const key = typeof deviceType === "string" ? deviceType : "";
  return DEVICE_THEME[key] ?? DEVICE_THEME.mobile;
}

/** Mobile — a single detailed phone centred in the card */
function MobileIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* soft glow behind the phone */}
      <div className="absolute w-24 h-32 rounded-3xl bg-white/20 blur-2xl" />

      {/* phone body */}
      <div className="relative w-[68px] h-[116px] rounded-[18px] border border-white/50 bg-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* speaker + dynamic island */}
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-[7px] rounded-full bg-black/50" />
        </div>

        {/* screen content */}
        <div className="flex-1 mx-1.5 mt-1.5 flex flex-col gap-1 overflow-hidden">
          {/* top bar */}
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-10 rounded-full bg-white/40" />
            <div className="flex-1" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
          {/* hero image */}
          <div className="h-8 rounded-md bg-white/20" />
          {/* text lines */}
          <div className="h-1 w-full rounded-full bg-white/35" />
          <div className="h-1 w-3/4 rounded-full bg-white/25" />
          {/* card row */}
          <div className="flex gap-1 mt-0.5">
            <div className="flex-1 h-7 rounded-md bg-white/20" />
            <div className="flex-1 h-7 rounded-md bg-white/25" />
          </div>
          {/* action button */}
          <div className="h-4 rounded-full bg-white/30 mt-0.5" />
        </div>

        {/* bottom nav bar */}
        <div className="h-6 mx-1 mb-1 rounded-lg bg-white/10 border border-white/20 flex items-center justify-around px-2">
          <div className="w-2 h-2 rounded-full bg-white/70" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>

        {/* home indicator */}
        <div className="flex justify-center pb-1.5">
          <div className="w-6 h-0.5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}

/** Web — browser window with sidebar + content grid */
function WebIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* glow */}
      <div className="absolute w-48 h-32 rounded-3xl bg-white/15 blur-2xl" />

      {/* browser window */}
      <div className="relative w-[78%] h-[82%] rounded-xl border border-white/40 bg-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* title bar */}
        <div className="h-6 shrink-0 bg-white/15 border-b border-white/20 flex items-center gap-1.5 px-2.5">
          <div className="w-2 h-2 rounded-full bg-white/70" />
          <div className="w-2 h-2 rounded-full bg-white/45" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          {/* address bar */}
          <div className="flex-1 h-2.5 mx-2 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded bg-white/20" />
        </div>

        {/* page body */}
        <div className="flex flex-1 overflow-hidden">
          {/* sidebar */}
          <div className="w-12 shrink-0 bg-white/8 border-r border-white/15 p-2 flex flex-col gap-1.5">
            <div className="w-6 h-6 rounded-md bg-white/25 mb-1" />
            <div className="h-1.5 rounded-full bg-white/40" />
            <div className="h-1.5 rounded-full bg-white/25" />
            <div className="h-1.5 rounded-full bg-white/25" />
            <div className="h-1.5 rounded-full bg-white/20" />
            <div className="h-1.5 rounded-full bg-white/20" />
          </div>

          {/* main content */}
          <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-hidden">
            {/* top bar with title + button */}
            <div className="flex items-center gap-1">
              <div className="h-2 flex-1 rounded-full bg-white/40" />
              <div className="w-8 h-3 rounded-md bg-white/30" />
            </div>
            {/* hero strip */}
            <div className="h-7 rounded-lg bg-white/20" />
            {/* card grid */}
            <div className="grid grid-cols-3 gap-1 flex-1">
              <div className="rounded-md bg-white/20" />
              <div className="rounded-md bg-white/15" />
              <div className="rounded-md bg-white/20" />
              <div className="rounded-md bg-white/15" />
              <div className="rounded-md bg-white/10" />
              <div className="rounded-md bg-white/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Wireframe — blueprint dot grid with dashed outline components */
function WireframeIllustration() {
  return (
    <div className="absolute inset-0">
      {/* dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wf-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wf-dots)" />
      </svg>

      {/* wireframe layout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[72%] h-[78%] flex flex-col gap-1.5">
          {/* nav bar */}
          <div className="h-5 rounded border border-dashed border-white/55 bg-white/5 flex items-center px-2 gap-1.5">
            <div className="w-5 h-1.5 rounded border border-white/40" />
            <div className="flex-1" />
            <div className="w-4 h-1.5 rounded border border-white/35" />
            <div className="w-4 h-1.5 rounded border border-white/35" />
            <div className="w-4 h-1.5 rounded border border-white/35" />
          </div>

          {/* hero */}
          <div className="h-12 rounded border border-dashed border-white/55 bg-white/5 flex flex-col items-center justify-center gap-1.5">
            {/* X cross mark (placeholder image convention) */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="opacity-40">
              <rect x="0.5" y="0.5" width="17" height="11" rx="1" stroke="white" strokeWidth="1"/>
              <line x1="0" y1="0" x2="18" y2="12" stroke="white" strokeWidth="0.8"/>
              <line x1="18" y1="0" x2="0" y2="12" stroke="white" strokeWidth="0.8"/>
            </svg>
            <div className="w-14 h-1 rounded-full bg-white/30" />
          </div>

          {/* card row */}
          <div className="flex gap-1.5 flex-1">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 rounded border border-dashed border-white/45 bg-white/5 flex flex-col p-1.5 gap-1">
                <div className="flex-1 rounded border border-white/25 border-dashed" />
                <div className="h-1 w-full rounded-full bg-white/30" />
                <div className="h-1 w-2/3 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inspirations — overlapping screens at angles with magic-wand badge */
function InspirationIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* glow orb */}
      <div className="absolute w-24 h-24 rounded-full bg-white/20 blur-2xl" />

      {/* back-left card */}
      <div className="absolute w-[56px] h-[76px] rounded-xl border border-white/30 bg-white/10 -rotate-[16deg] -translate-x-9 translate-y-3 shadow-lg overflow-hidden">
        <div className="h-3 bg-white/20 m-1.5 rounded" />
        <div className="mx-1.5 flex flex-col gap-1 mt-1">
          <div className="h-1 rounded-full bg-white/30 w-full" />
          <div className="h-1 rounded-full bg-white/20 w-3/4" />
          <div className="h-6 rounded bg-white/15 mt-0.5" />
        </div>
      </div>

      {/* back-right card */}
      <div className="absolute w-[56px] h-[76px] rounded-xl border border-white/30 bg-white/10 rotate-[16deg] translate-x-9 translate-y-3 shadow-lg overflow-hidden">
        <div className="h-7 bg-white/20 m-1.5 rounded" />
        <div className="mx-1.5 flex flex-col gap-1 mt-1">
          <div className="h-1 rounded-full bg-white/30 w-full" />
          <div className="h-1 rounded-full bg-white/20 w-1/2" />
        </div>
      </div>

      {/* front card */}
      <div className="relative w-[60px] h-[82px] rounded-xl border border-white/55 bg-white/20 shadow-2xl z-10 overflow-hidden">
        <div className="h-9 bg-white/25 m-1.5 rounded-lg" />
        <div className="mx-1.5 flex flex-col gap-1 mt-1">
          <div className="h-1.5 rounded-full bg-white/50 w-full" />
          <div className="h-1 rounded-full bg-white/30 w-3/4" />
          <div className="h-1 rounded-full bg-white/25 w-1/2" />
        </div>
      </div>

      {/* magic-wand badge */}
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg z-20">
        <HugeiconsIcon
          icon={MagicWand01Icon}
          size={15}
          color="#9333ea"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}

function pickIllustration(deviceType: DeviceTypeLike) {
  switch (deviceType) {
    case "mobile":       return <MobileIllustration />;
    case "web":          return <WebIllustration />;
    case "wireframe":    return <WireframeIllustration />;
    case "inspirations": return <InspirationIllustration />;
    default:             return <MobileIllustration />;
  }
}

export function DefaultProjectThumbnail({
  projectId: _projectId,
  deviceType,
  className,
}: {
  projectId: string;
  deviceType?: DeviceTypeLike;
  className?: string;
}) {
  const { from, to, mid } = resolveTheme(deviceType);

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        className,
      )}
      style={{ background: `linear-gradient(140deg, ${from} 0%, ${mid} 50%, ${to} 100%)` }}
      aria-hidden
    >
      {/* ambient glow blobs */}
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-50"
        style={{ background: from }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-40"
        style={{ background: to }}
      />
      {/* noise texture overlay for depth */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />

      {pickIllustration(deviceType)}
    </div>
  );
}

export function ProjectThumbnail({
  projectId,
  deviceType,
  className,
}: {
  projectId: string;
  thumbnail?: string | null;
  deviceType?: DeviceTypeLike;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <DefaultProjectThumbnail
      projectId={projectId}
      deviceType={deviceType}
      className={className}
    />
  );
}
