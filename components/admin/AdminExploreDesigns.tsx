"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useAdminExploreDesigns,
  useDeleteExploreDesign,
  useUploadExploreDesign,
  type ExploreDesign,
} from "@/features/use-explore-designs";

/* ──────────────── constants (mirror the server route) ──────────────── */

const VALID_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type Category = "mobile" | "web";

/* ──────────────── shell ──────────────── */

export default function AdminExploreDesigns() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Explore designs
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload and manage the designs featured on the dashboard&apos;s
          &ldquo;Explore designs&rdquo; section.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <UploadForm />
        </div>
        <DesignsList />
      </div>
    </div>
  );
}

/* ──────────────── upload form ──────────────── */

function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState<Category>("mobile");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useUploadExploreDesign();

  const acceptFile = useCallback(
    (f: File) => {
      setError(null);
      if (!VALID_TYPES.includes(f.type)) {
        setError("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
        return;
      }
      if (f.size > MAX_SIZE) {
        setError("File too large. Max 10MB.");
        return;
      }
      setFile(f);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setFile(null);
    setTitle("");
    setLink("");
    setCategory("mobile");
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [preview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    mutate(
      {
        image: file,
        title: title.trim(),
        link: link.trim() || undefined,
        category,
      },
      { onSuccess: reset },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-fit flex-col gap-5 rounded-2xl border border-border/60 bg-background p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-foreground">Upload design</h2>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) acceptFile(dropped);
        }}
        className={cn(
          "relative flex aspect-[9/16] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition-colors",
          isDragging && "border-foreground/40 bg-muted/60",
          preview && "border-solid border-border/60",
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected design preview"
              className="absolute inset-0 h-full w-full rounded-[10px] object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={(e) => {
                e.stopPropagation();
                if (preview) URL.revokeObjectURL(preview);
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-foreground/85 text-background shadow-sm transition-colors hover:bg-foreground"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <UploadCloud
              className="size-8 text-muted-foreground"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              Drop an image or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, WebP or GIF · max 10MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={VALID_TYPES.join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Discover the world"
          required
        />
      </div>

      {/* Link */}
      <div className="grid gap-2">
        <Label htmlFor="link">
          Link <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/project/abc or https://…"
        />
      </div>

      {/* Category pill toggle — matches the dashboard's mobile/web switch */}
      <div className="grid gap-2">
        <Label>Category</Label>
        <div className="flex rounded-lg bg-muted p-0.5">
          {(["mobile", "web"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                category === value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "mobile" ? "Mobile App" : "Web Platform"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending || !file || !title.trim()}>
          {isPending ? "Uploading…" : "Upload"}
        </Button>
        {file && (
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={isPending}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  );
}

/* ──────────────── designs list ──────────────── */

function DesignsList() {
  const { data: designs = [], isLoading } = useAdminExploreDesigns();
  const [toDelete, setToDelete] = useState<ExploreDesign | null>(null);
  const { mutate: deleteDesign, isPending: isDeleting } =
    useDeleteExploreDesign();

  const stats = useMemo(() => {
    const mobile = designs.filter((d) => d.category === "mobile").length;
    const web = designs.filter((d) => d.category === "web").length;
    return { total: designs.length, mobile, web };
  }, [designs]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Uploaded designs
        </h2>
        {!isLoading && designs.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {stats.total} total · {stats.mobile} mobile · {stats.web} web
          </p>
        )}
      </div>

      {isLoading ? (
        <Shimmer />
      ) : designs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {designs.map((d) => (
            <DesignTile key={d.id} design={d} onDelete={() => setToDelete(d)} />
          ))}
        </div>
      )}

      {/* Delete confirmation — same Dialog pattern as the project rename dialog */}
      <Dialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete design</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &ldquo;{toDelete?.title}&rdquo;? This also removes the image
            from Cloudinary. This action can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!toDelete) return;
                deleteDesign(toDelete.id, {
                  onSuccess: () => setToDelete(null),
                });
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DesignTile({
  design,
  onDelete,
}: {
  design: ExploreDesign;
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={design.imageUrl}
        alt={design.title}
        loading="lazy"
        className="h-full w-full object-cover"
      />

      {/* Category badge (top-left) */}
      <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80 shadow-sm backdrop-blur">
        {design.category === "web" ? "Web" : "Mobile"}
      </span>

      {/* Delete (top-right, reveal on hover) */}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${design.title}`}
        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive/90 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>

      {/* Title overlay (bottom) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-3">
        <p className="line-clamp-1 text-xs font-medium text-white">
          {design.title}
        </p>
      </div>
    </div>
  );
}

/* ──────────────── states ──────────────── */

function Shimmer() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] animate-pulse rounded-xl bg-muted"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
      <p className="text-sm text-muted-foreground">
        No designs uploaded yet. Use the form on the left to add your first one.
      </p>
    </div>
  );
}
