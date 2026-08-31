"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AndroidIcon,
  AppleIcon,
  ArrowUp01Icon,
  CheckmarkCircle01Icon,
  FloppyDiskIcon,
  LeftToRightListBulletIcon,
  ListViewIcon,
  Menu01Icon,
  PaintBoardIcon,
  PencilEdit01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseThemeColors, ThemeType } from "@/lib/themes";

type FontType = { id: string; name: string; family: string; category: string };

interface ThemePanelProps {
  projectId: string;
  themes: ThemeType[];
  currentTheme: ThemeType | null;
  onSelectTheme: (id: string) => void;
  fonts: FontType[];
  currentFont: FontType | null;
  onSelectFont: (id: string) => void;
}

/* Visual-only preferences (radius, shadows, density, platform) persisted
   per project until they are wired into generation. */
type PanelPrefs = {
  radius: string;
  shadow: string;
  density: string;
  platform: string;
  applyExisting: boolean;
};

const DEFAULT_PREFS: PanelPrefs = {
  radius: "S",
  shadow: "Soft",
  density: "Comfortable",
  platform: "ios",
  applyExisting: true,
};

const RADIUS_OPTIONS = ["None", "S", "M", "L", "XL", "Full"];
const RADIUS_PREVIEW: Record<string, string> = {
  None: "0px",
  S: "4px",
  M: "8px",
  L: "12px",
  XL: "16px",
  Full: "999px",
};
const SHADOW_OPTIONS = ["None", "Soft", "Medium", "Strong"];
const DENSITY_OPTIONS = [
  { id: "Compact", icon: Menu01Icon },
  { id: "Comfortable", icon: ListViewIcon },
  { id: "Spacious", icon: LeftToRightListBulletIcon },
];

/* ── Small building blocks ─────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

function SectionDivider() {
  return <div className="h-1.5 shrink-0 bg-muted/50" aria-hidden />;
}

/** Collapsible section: label row with chevron, children hidden when closed. */
function Section({
  label,
  children,
  extra,
}: {
  label: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <div className="flex items-center gap-2">
          {extra}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.75}
              className={cn("transition-transform", !open && "rotate-180")}
            />
          </button>
        </div>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Equal-width segmented control. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; icon?: typeof Menu01Icon }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex rounded-xl bg-muted/70 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-1 py-1.5 text-xs font-medium transition-colors",
            value === opt.id
              ? "border border-border bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.icon && (
            <HugeiconsIcon
              icon={opt.icon}
              size={13}
              color="currentColor"
              strokeWidth={1.75}
            />
          )}
          {opt.id}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5.5 w-10 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-4.5",
        )}
      />
    </button>
  );
}

/* ── Theme preset card ─────────────────────────────────────────────── */

const PresetCard = memo(function PresetCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const c = useMemo(() => parseThemeColors(theme.style), [theme.style]);
  return (
    <button type="button" onClick={onSelect} className="group flex flex-col gap-1.5 text-left">
      <span
        className="relative flex h-18 w-full flex-col justify-between rounded-xl border p-2.5 transition-all"
        style={{
          backgroundColor: c.background,
          borderColor: isSelected ? c.primary : "var(--border)",
          boxShadow: isSelected ? `0 0 0 1px ${c.primary}` : undefined,
        }}
      >
        <span className="flex items-start justify-between">
          <span
            className="text-base font-semibold leading-none"
            style={{ color: c.foreground }}
          >
            Aa
          </span>
          <span
            className="size-4 rounded-full"
            style={{ backgroundColor: c.primary }}
          />
        </span>
        <span className="flex items-end gap-1.5">
          <span
            className="h-1.5 w-7 rounded-full"
            style={{ backgroundColor: c.secondary }}
          />
          <span
            className="h-2.5 w-4 rounded-sm"
            style={{ backgroundColor: c.accent }}
          />
        </span>
        {isSelected && (
          <span
            className="absolute -bottom-1 -left-1 flex size-4 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: c.primary }}
          >
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={11}
              color="currentColor"
              strokeWidth={2}
            />
          </span>
        )}
      </span>
      <span
        className={cn(
          "w-full truncate text-center text-[11px] font-medium",
          !isSelected && "text-muted-foreground group-hover:text-foreground",
        )}
        style={isSelected ? { color: c.primary } : undefined}
      >
        {theme.name}
      </span>
    </button>
  );
});

/* ── Main panel ────────────────────────────────────────────────────── */

const ThemePanel = ({
  projectId,
  themes,
  currentTheme,
  onSelectTheme,
  fonts,
  currentFont,
  onSelectFont,
}: ThemePanelProps) => {
  const [prefs, setPrefs] = useState<PanelPrefs>(DEFAULT_PREFS);
  const [editingFonts, setEditingFonts] = useState(false);

  const prefsKey = `themePanelPrefs:${projectId}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }, [prefsKey]);

  const setPref = <K extends keyof PanelPrefs>(key: K, value: PanelPrefs[K]) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      try {
        localStorage.setItem(prefsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const themeColors = useMemo(
    () => (currentTheme ? parseThemeColors(currentTheme.style) : null),
    [currentTheme],
  );

  const comingSoon = () =>
    toast("Custom themes are coming soon — pick a preset for now.");

  const swatches = themeColors
    ? [
        { label: "Primary", color: themeColors.primary },
        { label: "Secondary", color: themeColors.secondary },
        { label: "Accent", color: themeColors.accent },
        { label: "Background", color: themeColors.background },
        { label: "Surface", color: themeColors.card },
        { label: "Text", color: themeColors.foreground },
      ]
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
      {/* ── Theme presets ─────────────────────────────────────────── */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Theme presets</SectionLabel>
          <button
            type="button"
            onClick={comingSoon}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              size={12}
              color="currentColor"
              strokeWidth={1.75}
            />
            Edit
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {themes.map((theme) => (
            <PresetCard
              key={theme.id}
              theme={theme}
              isSelected={currentTheme?.id === theme.id}
              onSelect={() => onSelectTheme(theme.id)}
            />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={comingSoon}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <HugeiconsIcon
              icon={FloppyDiskIcon}
              size={13}
              color="currentColor"
              strokeWidth={1.75}
            />
            Save as theme
          </button>
          <button
            type="button"
            onClick={comingSoon}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <HugeiconsIcon
              icon={Settings02Icon}
              size={13}
              color="currentColor"
              strokeWidth={1.75}
            />
            Manage themes
          </button>
        </div>
      </section>

      <SectionDivider />

      {/* ── Typography ────────────────────────────────────────────── */}
      <Section label="Typography">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 p-3">
            <span
              className="text-4xl font-semibold leading-none text-foreground"
              style={{ fontFamily: currentFont?.family }}
            >
              Ag
            </span>
            <div className="min-w-0 flex-1 space-y-0.5 text-xs">
              <p className="flex gap-2">
                <span className="text-muted-foreground">Display</span>
                <span className="font-semibold text-foreground">
                  {currentFont?.name ?? "Default"}
                </span>
              </p>
              <p className="flex gap-2">
                <span className="text-muted-foreground">Body</span>
                <span className="font-semibold text-foreground">
                  {currentFont?.name ?? "Default"}
                </span>
              </p>
              <p className="flex gap-2">
                <span className="text-muted-foreground">Style</span>
                <span className="font-semibold capitalize text-foreground">
                  {currentFont?.category ?? "—"}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingFonts((v) => !v)}
              className={cn(
                "shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors",
                editingFonts
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {editingFonts ? "Done" : "Edit"}
            </button>
          </div>
          <div className="border-t border-border px-3 py-2.5">
            <p
              className="truncate text-xs text-muted-foreground"
              style={{ fontFamily: currentFont?.family }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>

        {editingFonts && (
          <div className="mt-2 space-y-1.5">
            {fonts.map((font) => {
              const isSelected = currentFont?.id === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onSelectFont(font.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-muted/50 px-2.5 py-2 transition-colors",
                    isSelected
                      ? "border-foreground/50 bg-foreground/5 dark:bg-foreground/10"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span
                      className="w-full truncate text-xs font-medium text-foreground"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </span>
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {font.category}
                    </span>
                  </span>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={13}
                      color="currentColor"
                      strokeWidth={2}
                      className="shrink-0 text-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <SectionDivider />

      {/* ── Colors ────────────────────────────────────────────────── */}
      <Section label="Colors">
        <div className="grid grid-cols-6 gap-1">
          {swatches.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <span className="text-[9.5px] font-medium text-muted-foreground">
                {s.label}
              </span>
              <span
                className="size-8 rounded-full border border-black/10 shadow-sm dark:border-white/15"
                style={{ backgroundColor: s.color }}
                title={`${s.label}: ${s.color}`}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={comingSoon}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <HugeiconsIcon
            icon={PaintBoardIcon}
            size={13}
            color="currentColor"
            strokeWidth={1.75}
          />
          Edit color palette
        </button>
      </Section>

      <SectionDivider />

      {/* ── Radius & shadows ──────────────────────────────────────── */}
      <Section
        label="Radius & Shadows"
        extra={
          <span
            className="size-6 border-2 border-border bg-card shadow-sm transition-all"
            style={{ borderRadius: RADIUS_PREVIEW[prefs.radius] }}
            aria-hidden
          />
        }
      >
        <p className="mb-1.5 text-xs font-medium text-foreground">
          Corner radius
        </p>
        <Segmented
          options={RADIUS_OPTIONS.map((id) => ({ id }))}
          value={prefs.radius}
          onChange={(v) => setPref("radius", v)}
        />
        <p className="mb-1.5 mt-3.5 text-xs font-medium text-foreground">
          Shadow depth
        </p>
        <Segmented
          options={SHADOW_OPTIONS.map((id) => ({ id }))}
          value={prefs.shadow}
          onChange={(v) => setPref("shadow", v)}
        />
      </Section>

      <SectionDivider />

      {/* ── Density ───────────────────────────────────────────────── */}
      <Section label="Density">
        <Segmented
          options={DENSITY_OPTIONS}
          value={prefs.density}
          onChange={(v) => setPref("density", v)}
        />
      </Section>

      <SectionDivider />

      {/* ── Platform style ────────────────────────────────────────── */}
      <Section label="Platform style">
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              id: "ios",
              icon: AppleIcon,
              title: "iOS",
              subtitle: "iOS native style",
            },
            {
              id: "material",
              icon: AndroidIcon,
              title: "Material You",
              subtitle: "Android 12+ style",
            },
          ].map((p) => {
            const selected = prefs.platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPref("platform", p.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
                    : "border-border bg-card hover:border-foreground/25",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <HugeiconsIcon
                    icon={p.icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">
                    {p.title}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {p.subtitle}
                  </span>
                </span>
                {selected && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={15}
                    color="currentColor"
                    strokeWidth={2}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <SectionDivider />

      {/* ── Apply to existing frames ──────────────────────────────── */}
      <section className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Apply to existing frames
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Changes will be applied to new and selected frames.
          </p>
        </div>
        <Toggle
          checked={prefs.applyExisting}
          onChange={(v) => setPref("applyExisting", v)}
          label="Apply to existing frames"
        />
      </section>
    </div>
  );
};

export default ThemePanel;
