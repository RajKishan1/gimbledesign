"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import {
  Check,
  CircleCheck,
  ImagePlus,
  Minus,
  Palette,
  Plus,
  Sparkles,
  Tablet,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DashboardSidebar from "../../_common/dashboard-sidebar";
import NavBar from "@/components/dashboard/NavBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useGetCredits } from "@/features/use-credits";
import { useCreateAppStoreSet } from "@/features/use-app-store";
import {
  ACCEPTED_IMAGE_TYPES,
  CATEGORIES,
  CREDITS_PER_SCREEN,
  LIMITS,
  PLATFORMS,
  PLATFORM_IDS,
  QUALITY_IDS,
  QUALITY_OPTIONS,
  TONES,
  type AppStoreBrief,
  type PlatformId,
  type QualityId,
  type Tone,
} from "@/lib/app-store/specs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HEX_RE = /^#?([0-9a-fA-F]{6})$/;
const CONTROL_CLASS =
  "h-10 rounded-xl border-border bg-background/60 px-3.5 shadow-none focus-visible:bg-card";
const TEXTAREA_CLASS =
  "rounded-xl border-border bg-background/60 px-3.5 py-3 shadow-none focus-visible:bg-card";
const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-border bg-background/60 px-3.5 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50";

function normalizeHex(v: string): string | null {
  const m = v.trim().match(HEX_RE);
  return m ? `#${m[1].toUpperCase()}` : null;
}

function isAcceptedImage(file: File) {
  return (
    (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) &&
    file.size > 0 &&
    file.size <= LIMITS.maxUploadBytes
  );
}

/** Object URL for a File, revoked when the file changes or the component unmounts. */
function usePreviewUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="flex items-start gap-3 border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {hint && <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SingleImageDrop({
  label,
  file,
  onChange,
  hint,
  compact,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = usePreviewUrl(file);
  const [dragging, setDragging] = useState(false);

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!isAcceptedImage(f)) {
      toast.error("Use a PNG, JPG or WebP under 10MB");
      return;
    }
    onChange(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border border-dashed bg-background/60 p-3 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-primary/3",
        compact ? "h-20" : "h-24",
      )}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Upload ${label}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {file ? file.name : hint ?? "PNG, JPG or WebP · drag & drop or click"}
        </p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            {file ? "Replace" : "Choose file"}
          </button>
          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ScreenshotTile({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
  const url = usePreviewUrl(file);
  return (
    <div className="group relative aspect-[9/19] overflow-hidden rounded-xl border border-border bg-muted">
      {url && <img src={url} alt={file.name} className="h-full w-full object-cover" />}
      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        aria-label="Remove screenshot"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function SetPreview({
  appName,
  tagline,
  platform,
  quality,
  screenCount,
  brandColors,
  logo,
  screenshots,
  credits,
  cost,
  submitting,
  validationError,
  hasEnoughCredits,
  onSubmit,
}: {
  appName: string;
  tagline: string;
  platform: PlatformId;
  quality: QualityId;
  screenCount: number;
  brandColors: string[];
  logo: File | null;
  screenshots: File[];
  credits: number | undefined;
  cost: number;
  submitting: boolean;
  validationError: string | null;
  hasEnoughCredits: boolean;
  onSubmit: () => void;
}) {
  const accent = brandColors[0] ?? "#0284C7";
  const logoPreview = usePreviewUrl(logo);
  const screenshotPreview = usePreviewUrl(screenshots[0] ?? null);
  const output = PLATFORMS[platform].generate[quality];
  const frameClass = platform === "ipad" ? "aspect-[3/4] w-30 sm:w-34" : "aspect-[9/19] w-22 sm:w-24";

  return (
    <aside className="lg:sticky lg:top-23 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your screenshot set</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">A live preview of the creative direction</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {PLATFORMS[platform].store}
          </span>
        </div>

        <div className="p-3">
          <div className="relative h-88 overflow-hidden rounded-xl bg-neutral-950 text-white">
            <div
              className="absolute left-0 top-0 h-1 w-full"
              style={{ backgroundColor: accent }}
            />
            <div className="relative z-10 px-5 pt-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/15">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="size-full object-cover" />
                  ) : (
                    <Sparkles className="size-3.5 text-white/80" />
                  )}
                </span>
                <p className="truncate text-xs font-medium text-white/60">
                  {appName.trim() || "Your app"}
                </p>
              </div>
              <h3 className="mt-4 max-w-64 text-[22px] font-semibold leading-tight tracking-tight">
                {tagline.trim() || "Turn your product story into a scroll-stopping set."}
              </h3>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex h-52 items-end justify-center gap-2 overflow-hidden px-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-t-[18px] border-[3px] border-neutral-700 bg-white shadow-2xl",
                    frameClass,
                    index === 0 && "-rotate-3 translate-y-7 opacity-70",
                    index === 1 && "z-10",
                    index === 2 && "rotate-3 translate-y-7 opacity-70",
                  )}
                >
                  {screenshotPreview && index === 1 ? (
                    <img src={screenshotPreview} alt="First uploaded app screen" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full flex-col bg-white p-2">
                      <div className="mb-2 h-[38%] rounded-md" style={{ backgroundColor: accent }} />
                      <div className="h-1.5 w-2/3 rounded-full bg-neutral-900" />
                      <div className="mt-1 h-1 w-full rounded-full bg-neutral-200" />
                      <div className="mt-1 h-1 w-4/5 rounded-full bg-neutral-200" />
                      <div className="mt-auto grid grid-cols-2 gap-1">
                        <div className="aspect-square rounded bg-neutral-100" />
                        <div className="aspect-square rounded bg-neutral-100" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-y border-border/60 bg-muted/20">
          <div className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Format</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-foreground">{PLATFORMS[platform].short}</p>
          </div>
          <div className="border-x border-border/60 px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Output</p>
            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-foreground">
              {output.width}×{output.height}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Set</p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">{screenCount} screens</p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CircleCheck className={cn("size-4", appName.trim() ? "text-primary" : "text-muted-foreground/50")} />
              App story
            </span>
            <span className="font-medium text-foreground">{appName.trim() ? "Started" : "Required"}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Palette className={cn("size-4", logo || brandColors.length ? "text-primary" : "text-muted-foreground/50")} />
              Brand direction
            </span>
            <span className="font-medium text-foreground">{logo || brandColors.length ? "Added" : "Auto"}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ImagePlus className={cn("size-4", screenshots.length ? "text-primary" : "text-muted-foreground/50")} />
              Product screens
            </span>
            <span className="font-medium text-foreground">{screenshots.length ? `${screenshots.length} added` : "Optional"}</span>
          </div>
        </div>

        <div className="border-t border-border/60 p-4">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[11px] text-muted-foreground">Generation cost</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{cost} credits</p>
            </div>
            <p className="pb-0.5 text-right text-[11px] text-muted-foreground">
              {credits != null ? `${Math.floor(credits)} available` : "Balance shown after sign in"}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-xl shadow-sm"
            disabled={submitting || !!validationError || !hasEnoughCredits}
            onClick={onSubmit}
            title={validationError ?? undefined}
          >
            {submitting ? <Spinner className="size-4" /> : <Sparkles className="size-4" />}
            {submitting ? "Starting…" : "Generate screenshot set"}
          </Button>
          {validationError && <p className="mt-2 text-center text-[11px] text-muted-foreground">{validationError}</p>}
          {!hasEnoughCredits && (
            <p className="mt-2 text-center text-[11px] font-medium text-destructive">Add credits to generate this set.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppStoreScreensPage() {
  const { data: session } = authClient.useSession();
  const { data: credits } = useGetCredits(session?.user?.id);
  const create = useCreateAppStoreSet();

  // Basics
  const [appName, setAppName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Productivity");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");

  // Set
  const [platform, setPlatform] = useState<PlatformId>("iphone");
  const [screenCount, setScreenCount] = useState(5);
  const [featuresText, setFeaturesText] = useState("");
  const [quality, setQuality] = useState<QualityId>("standard");

  // Brand
  const [tone, setTone] = useState<Tone>("clean & minimal");
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const pickedColorRef = useRef<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [reference, setReference] = useState<File | null>(null);

  // Screenshots
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [extraInstructions, setExtraInstructions] = useState("");

  const features = useMemo(
    () =>
      featuresText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, LIMITS.maxScreens),
    [featuresText],
  );

  const cost = screenCount * CREDITS_PER_SCREEN[quality];
  const hasEnoughCredits = credits == null || credits >= cost;

  const addColor = useCallback(() => {
    const hex = normalizeHex(colorInput);
    if (!hex) {
      if (colorInput.trim()) toast.error("Enter a 6-digit hex colour like #6D28D9");
      return;
    }
    setBrandColors((prev) => (prev.includes(hex) || prev.length >= 4 ? prev : [...prev, hex]));
    setColorInput("");
  }, [colorInput]);

  const addScreenshots = useCallback((list: FileList | File[] | null | undefined) => {
    if (!list) return;
    const incoming = Array.from(list);
    const rejected = incoming.filter((f) => !isAcceptedImage(f));
    if (rejected.length) toast.error(`${rejected.length} file(s) skipped: use PNG, JPG or WebP under 10MB`);
    setScreenshots((prev) => {
      const next = [...prev, ...incoming.filter(isAcceptedImage)];
      if (next.length > LIMITS.maxScreenshots) {
        toast.error(`Up to ${LIMITS.maxScreenshots} screenshots`);
      }
      return next.slice(0, LIMITS.maxScreenshots);
    });
  }, []);

  const validationError = useMemo(() => {
    if (appName.trim().length < 1) return "Give your app a name.";
    if (description.trim().length < 20) return "Describe the app in at least a sentence or two.";
    return null;
  }, [appName, description]);

  const handleSubmit = () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!hasEnoughCredits) {
      toast.error(`You need ${cost} credits for this set.`);
      return;
    }
    const brief: AppStoreBrief = {
      appName: appName.trim(),
      tagline: tagline.trim() || undefined,
      category,
      description: description.trim(),
      audience: audience.trim() || undefined,
      tone,
      brandColors,
      platform,
      screenCount,
      quality,
      features,
      extraInstructions: extraInstructions.trim() || undefined,
    };
    const fd = new FormData();
    fd.append("brief", JSON.stringify(brief));
    if (logo) fd.append("logo", logo);
    if (reference) fd.append("reference", reference);
    screenshots.forEach((f) => fd.append("screenshots", f));
    create.mutate(fd);
  };

  const submitting = create.isPending || create.isSuccess;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<div className="h-17 border-b border-border/60" />}>
            <NavBar />
          </Suspense>

          <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-7 sm:px-6 lg:px-8 xl:px-10">
            <Link
              href="/mini-tools"
              className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={2} />
              All tools
            </Link>

            <header className="mb-8 flex flex-col gap-5 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={20} color="currentColor" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Creative asset generator
                  </span>
                </div>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[34px]">
                  App Store Screens
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Build a polished, consistent screenshot story from your real product screens and brand direction.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Store-ready sizing included
              </div>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
              <div className="min-w-0 space-y-5">
                <Section step={1} title="About the app" hint="Give the art director enough context to write the story and headlines.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="App name" htmlFor="appName">
                      <Input
                        id="appName"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Lumen"
                        maxLength={60}
                        className={CONTROL_CLASS}
                      />
                    </Field>
                    <Field label="Tagline" htmlFor="tagline" optional>
                      <Input
                        id="tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Sleep better, every night"
                        maxLength={120}
                        className={CONTROL_CLASS}
                      />
                    </Field>
                    <Field label="Category" htmlFor="category">
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                        className={SELECT_CLASS}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Audience" htmlFor="audience" optional>
                      <Input
                        id="audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="Busy professionals who struggle to sleep"
                        maxLength={200}
                        className={CONTROL_CLASS}
                      />
                    </Field>
                  </div>
                  <div className="mt-5">
                    <Field
                      label="What does the app do?"
                      htmlFor="description"
                      hint={`${description.trim().length}/${LIMITS.maxDescription} · Focus on benefits, key screens, and what makes it different.`}
                    >
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.maxDescription))}
                        placeholder="Lumen tracks your sleep from the nightstand, wakes you during a light sleep phase, and turns every morning into one simple score and suggestion…"
                        className={cn(TEXTAREA_CLASS, "min-h-30")}
                      />
                    </Field>
                  </div>
                </Section>

                <Section step={2} title="Shape the set" hint="Choose the storefront, length, and the moments the sequence should tell.">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {PLATFORM_IDS.map((id) => {
                      const p = PLATFORMS[id];
                      const active = platform === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPlatform(id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-primary bg-primary/7"
                              : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary/3",
                          )}
                        >
                          <span className={cn("flex size-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
                            {id === "ipad" ? <Tablet className="size-4" /> : <HugeiconsIcon icon={SmartPhone01Icon} size={18} color="currentColor" strokeWidth={1.75} />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-foreground">{p.short}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{p.store}</span>
                          </span>
                          {active && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-[150px_1fr]">
                    <Field label="Number of screens" hint={`${LIMITS.minScreens}–${LIMITS.maxScreens} screens`}>
                      <div className="inline-flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background/60">
                        <button
                          type="button"
                          onClick={() => setScreenCount((n) => Math.max(LIMITS.minScreens, n - 1))}
                          className="flex h-full w-10 items-center justify-center rounded-l-xl text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                          disabled={screenCount <= LIMITS.minScreens}
                          aria-label="Fewer screens"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="text-sm font-semibold tabular-nums">{screenCount}</span>
                        <button
                          type="button"
                          onClick={() => setScreenCount((n) => Math.min(LIMITS.maxScreens, n + 1))}
                          className="flex h-full w-10 items-center justify-center rounded-r-xl text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                          disabled={screenCount >= LIMITS.maxScreens}
                          aria-label="More screens"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </Field>

                    <Field
                      label="Key moments"
                      htmlFor="features"
                      optional
                      hint={`One per line, in story order. ${features.length}/${screenCount} planned.`}
                    >
                      <Textarea
                        id="features"
                        value={featuresText}
                        onChange={(e) => setFeaturesText(e.target.value)}
                        placeholder={"Wake up in a light sleep phase\nUnderstand your morning score at a glance\nGet one useful suggestion for tonight"}
                        className={cn(TEXTAREA_CLASS, "min-h-30 text-xs leading-relaxed")}
                      />
                    </Field>
                  </div>

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {QUALITY_IDS.map((id) => {
                      const q = QUALITY_OPTIONS[id];
                      const active = quality === id;
                      const gen = PLATFORMS[platform].generate[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setQuality(id)}
                          className={cn(
                            "rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                            active ? "border-primary bg-primary/7" : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary/3",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-foreground">{q.label}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums", active ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground")}>
                              {CREDITS_PER_SCREEN[id]} cr / screen
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                            {q.description} {gen.width}×{gen.height}.
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section step={3} title="Set the brand direction" hint="Add what you have. The palette can be inferred from your logo if you leave colours empty.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SingleImageDrop label="App logo" file={logo} onChange={setLogo} hint="A transparent PNG works best" />
                    <SingleImageDrop label="Style reference" file={reference} onChange={setReference} hint="A campaign or brand visual you like" />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Tone" htmlFor="tone">
                      <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                        className={cn(SELECT_CLASS, "capitalize")}
                      >
                        {TONES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Brand colours" optional hint="Add up to 4 hex colours.">
                      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/60 px-2.5 py-1.5 transition-[color,box-shadow] focus-within:border-ring focus-within:bg-card focus-within:ring-[3px] focus-within:ring-ring/50">
                        {brandColors.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pl-1 pr-1.5 text-[11px] font-medium shadow-xs">
                            <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                            {c}
                            <button type="button" onClick={() => setBrandColors((prev) => prev.filter((x) => x !== c))} className="rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Remove ${c}`}>
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="color"
                          aria-label="Pick a colour"
                          className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                          onChange={(e) => { pickedColorRef.current = e.target.value; }}
                          onBlur={() => {
                            const hex = pickedColorRef.current ? normalizeHex(pickedColorRef.current) : null;
                            pickedColorRef.current = null;
                            if (hex) setBrandColors((prev) => (prev.includes(hex) || prev.length >= 4 ? prev : [...prev, hex]));
                          }}
                        />
                        <input
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addColor();
                            }
                          }}
                          onBlur={addColor}
                          placeholder={brandColors.length ? "" : "#0284C7"}
                          className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          maxLength={7}
                          disabled={brandColors.length >= 4}
                        />
                      </div>
                    </Field>
                  </div>
                </Section>

                <Section step={4} title="Add your product screens" hint="Optional, but recommended. Upload them in the order you want the screenshot story to follow.">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addScreenshots(e.dataTransfer.files); }}
                    className={cn(
                      "rounded-xl border border-dashed bg-background/60 p-3 transition-colors",
                      dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    {screenshots.length === 0 ? (
                      <button type="button" onClick={() => screenshotInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-lg py-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-card text-primary shadow-xs ring-1 ring-border/60">
                          <Upload className="size-4" />
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">Drop product screenshots here</span>
                        <span className="text-xs text-muted-foreground">PNG, JPG or WebP · up to {LIMITS.maxScreenshots} files</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                        {screenshots.map((f, i) => (
                          <ScreenshotTile key={`${f.name}-${f.size}-${i}`} file={f} index={i} onRemove={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))} />
                        ))}
                        {screenshots.length < LIMITS.maxScreenshots && (
                          <button type="button" onClick={() => screenshotInputRef.current?.click()} className="flex aspect-[9/19] items-center justify-center rounded-xl border border-dashed border-border bg-card text-muted-foreground outline-none hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" aria-label="Add screenshots">
                            <Plus className="size-4" />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => { addScreenshots(e.target.files); e.target.value = ""; }}
                    />
                  </div>
                </Section>

                <Section step={5} title="Add final direction" hint="Call out anything the art director must include or avoid.">
                  <Textarea
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value.slice(0, LIMITS.maxInstructions))}
                    placeholder="Dark backgrounds only. Headlines in Spanish. Do not show the paywall. Keep the mood calm and restrained."
                    className={cn(TEXTAREA_CLASS, "min-h-24")}
                  />
                </Section>
              </div>

              <SetPreview
                appName={appName}
                tagline={tagline}
                platform={platform}
                quality={quality}
                screenCount={screenCount}
                brandColors={brandColors}
                logo={logo}
                screenshots={screenshots}
                credits={credits}
                cost={cost}
                submitting={submitting}
                validationError={validationError}
                hasEnoughCredits={hasEnoughCredits}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
