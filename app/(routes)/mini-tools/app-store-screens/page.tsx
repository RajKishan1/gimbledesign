"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { Check, ImagePlus, Minus, Plus, Sparkles, Tablet, Upload, X } from "lucide-react";
import { toast } from "sonner";
import DashboardSidebar from "../../_common/dashboard-sidebar";
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
    <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
          {step}
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
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
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
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
        "relative flex items-center gap-3 rounded-xl border border-dashed p-3 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
        compact ? "h-20" : "h-24",
      )}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
        aria-label={`Upload ${label}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
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
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 pb-40 pt-12">
            <Link
              href="/mini-tools"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={2} />
              Back to Tools
            </Link>

            <div className="mb-8 flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/20 to-orange-500/10">
                <HugeiconsIcon icon={SmartPhone01Icon} size={26} color="currentColor" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">App Store Screens</h1>
                <p className="mt-1.5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Describe your app, drop in your logo and real screenshots, and get a consistent,
                  store-ready screenshot set rendered by GPT Image 2 via Runware.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1 — Basics */}
              <Section step={1} title="About the app" hint="The art director reads this to write headlines and pick a visual system.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="App name" htmlFor="appName">
                    <Input
                      id="appName"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="e.g. Lumen"
                      maxLength={60}
                    />
                  </Field>
                  <Field label="Tagline" htmlFor="tagline" optional>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Sleep better, every night"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Category" htmlFor="category">
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Audience" htmlFor="audience" optional>
                    <Input
                      id="audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. busy professionals with trouble sleeping"
                      maxLength={200}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field
                    label="What does the app do?"
                    htmlFor="description"
                    hint={`${description.trim().length}/${LIMITS.maxDescription} · Benefits, key screens, what makes it different.`}
                  >
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.maxDescription))}
                      placeholder="Lumen tracks your sleep with the phone on the nightstand, wakes you in a light sleep phase, and gives a simple morning score with one suggestion to improve tonight…"
                      className="min-h-28"
                    />
                  </Field>
                </div>
              </Section>

              {/* 2 — Set */}
              <Section step={2} title="Screenshot set" hint="One story, one idea per screen. The first screen is the hero.">
                <div className="grid gap-3 sm:grid-cols-3">
                  {PLATFORM_IDS.map((id) => {
                    const p = PLATFORMS[id];
                    const active = platform === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlatform(id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          {id === "ipad" ? (
                            <Tablet className="size-4" />
                          ) : (
                            <HugeiconsIcon icon={SmartPhone01Icon} size={18} color="currentColor" strokeWidth={1.75} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{p.short}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{p.store}</span>
                        </span>
                        {active && <Check className="ml-auto size-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr]">
                  <Field label="Number of screens" hint={`${LIMITS.minScreens}–${LIMITS.maxScreens}`}>
                    <div className="inline-flex h-9 items-center rounded-md border border-input">
                      <button
                        type="button"
                        onClick={() => setScreenCount((n) => Math.max(LIMITS.minScreens, n - 1))}
                        className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        disabled={screenCount <= LIMITS.minScreens}
                        aria-label="Fewer screens"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums">{screenCount}</span>
                      <button
                        type="button"
                        onClick={() => setScreenCount((n) => Math.min(LIMITS.maxScreens, n + 1))}
                        className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
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
                    hint={`One per line, in order — each becomes a screen. ${features.length}/${screenCount} filled; the art director writes the rest.`}
                  >
                    <Textarea
                      id="features"
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      placeholder={"Wake up in a light sleep phase\nA morning score you understand at a glance\nOne suggestion for tonight\nWorks with the phone on the nightstand"}
                      className="min-h-28 font-mono text-xs leading-relaxed"
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                          "rounded-xl border p-3 text-left transition-colors",
                          active ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{q.label}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                            {CREDITS_PER_SCREEN[id]} cr / screen
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {q.description} Renders at {gen.width}×{gen.height}.
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* 3 — Brand */}
              <Section step={3} title="Brand" hint="The logo and colours anchor the palette so every screen looks like yours.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SingleImageDrop label="App logo" file={logo} onChange={setLogo} hint="PNG with transparency works best" />
                  <SingleImageDrop
                    label="Style reference"
                    file={reference}
                    onChange={setReference}
                    hint="Optional — a screenshot set or brand visual you like"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Tone" htmlFor="tone">
                    <select
                      id="tone"
                      value={tone}
                      onChange={(e) => setTone(e.target.value as Tone)}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Brand colours" optional hint="Up to 4 hex colours. Leave empty to derive them from the logo.">
                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                      {brandColors.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 py-0.5 pl-1 pr-1.5 text-[11px] font-medium"
                        >
                          <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                          {c}
                          <button
                            type="button"
                            onClick={() => setBrandColors((prev) => prev.filter((x) => x !== c))}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${c}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="color"
                        aria-label="Pick a colour"
                        className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                        // Browsers fire `change` continuously while the picker is
                        // open, so only commit the final value once it closes.
                        onChange={(e) => {
                          pickedColorRef.current = e.target.value;
                        }}
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
                        placeholder={brandColors.length ? "" : "#6D28D9"}
                        className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        maxLength={7}
                        disabled={brandColors.length >= 4}
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              {/* 4 — Screenshots */}
              <Section
                step={4}
                title="Real app screenshots"
                hint="Optional but strongly recommended — they are shown inside the device exactly as uploaded. Without them the model designs plausible UI from your description."
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addScreenshots(e.dataTransfer.files);
                  }}
                  className={cn(
                    "rounded-xl border border-dashed p-3 transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  {screenshots.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => screenshotInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 py-8 text-center"
                    >
                      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Upload className="size-4 text-muted-foreground" />
                      </span>
                      <span className="text-sm font-medium text-foreground">Drop screenshots here</span>
                      <span className="text-xs text-muted-foreground">
                        Up to {LIMITS.maxScreenshots} · in the order you want them to appear
                      </span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                      {screenshots.map((f, i) => (
                        <ScreenshotTile
                          key={`${f.name}-${f.size}-${i}`}
                          file={f}
                          index={i}
                          onRemove={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                      {screenshots.length < LIMITS.maxScreenshots && (
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="flex aspect-[9/19] items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                          aria-label="Add screenshots"
                        >
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
                    onChange={(e) => {
                      addScreenshots(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </Section>

              {/* 5 — Extra */}
              <Section step={5} title="Anything else?" hint="Constraints the art director must honour.">
                <Textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value.slice(0, LIMITS.maxInstructions))}
                  placeholder="e.g. Dark background only. Headlines in Spanish. Never show the paywall. Keep it calm — no neon."
                  className="min-h-20"
                />
              </Section>
            </div>
          </div>
        </main>

        {/* Sticky action bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-6">
          <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="min-w-0 text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">
                {screenCount} screens · {cost} credits
              </p>
              <p className="truncate">
                {credits != null ? `${Math.floor(credits)} credits available` : "Sign in to see your balance"}
                {" · "}
                {PLATFORMS[platform].label} · {QUALITY_OPTIONS[quality].label}
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="rounded-full px-5"
              disabled={submitting || !!validationError || !hasEnoughCredits}
              onClick={handleSubmit}
              title={validationError ?? undefined}
            >
              {submitting ? <Spinner className="size-4" /> : <Sparkles className="size-4" />}
              {submitting ? "Starting…" : "Generate screenshots"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
