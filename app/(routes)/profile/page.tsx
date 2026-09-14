"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Edit01Icon,
  FolderOpenIcon,
  SparklesIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import Header from "../_common/header";
import { useUpdateProfile } from "@/features/use-profile";
import { useProfile } from "@/context/profile-provider";
import { useGetCredits } from "@/features/use-credits";
import { useGetProjects } from "@/features/use-project";
import { ProjectType } from "@/types/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { DefaultProjectThumbnail } from "@/components/ui/project-thumbnail";
import { BillingSection } from "@/components/billing/billing-section";
import { toast } from "sonner";
import DashboardSidebar from "../_common/dashboard-sidebar";

const ProfilePage = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: credits } = useGetCredits(user?.id);
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects(
    user?.id,
    undefined,
  );
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    profilePicture: "",
    headerImage: "",
  });
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null,
  );
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile && isEditDialogOpen) {
      setEditForm({
        name: profile.name || "",
        email: profile.email || "",
        profilePicture: profile.profilePicture || "",
        headerImage: profile.headerImage || "",
      });
      setProfilePicPreview(profile.profilePicture || null);
      setHeaderPreview(profile.headerImage || null);
    }
  }, [profile, isEditDialogOpen]);

  const handleSave = () => {
    updateProfile(editForm, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setIsEditDialogOpen(false);
        setProfilePicPreview(null);
        setHeaderPreview(null);
      },
      onError: () => {
        toast.error("Failed to update profile");
      },
    });
  };

  const handleFileUpload = async (
    file: File,
    type: "profilePicture" | "headerImage",
  ) => {
    if (type === "profilePicture") {
      setUploadingProfilePic(true);
    } else {
      setUploadingHeader(true);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const imageUrl = data.data.url;
      setEditForm({ ...editForm, [type]: imageUrl });

      if (type === "profilePicture") {
        setProfilePicPreview(imageUrl);
      } else {
        setHeaderPreview(imageUrl);
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to upload image",
      );
    } finally {
      if (type === "profilePicture") {
        setUploadingProfilePic(false);
      } else {
        setUploadingHeader(false);
      }
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profilePicture" | "headerImage",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  // Get used and remaining credits
  const remainingCredits = credits || 0;
  const usedCredits = profile?.totalCreditsUsed || 0;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen w-full bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayProfilePicture = profile?.profilePicture || user?.image || "";
  const displayHeaderImage = profile?.headerImage || "";
  const projectCount = projects?.length ?? 0;
  const roleLabel = profile?.role === "admin" ? "Administrator" : "Creator";

  return (
    <div className="relative min-h-screen w-full bg-background flex">
      <div className="sticky h-screen top-0">
        {" "}
        <DashboardSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        {/* <Header /> */}

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="mb-8 flex flex-col-reverse gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
                Account settings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground ">
                Manage your profile, creative capacity, and subscription.
              </p>
            </div>
            {/* <Button
              variant="ghost"
              onClick={() => router.back()}
              className="w-fit rounded-full px-3 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
              Back
            </Button> */}
          </div>

          <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_55px_-42px_rgba(15,23,42,0.55)]">
            <div>
              <div className="relative h-44 overflow-hidden bg-[#06263b] sm:h-56 lg:h-64">
                {displayHeaderImage ? (
                  <>
                    <Image
                      src={displayHeaderImage}
                      alt="Profile cover"
                      fill
                      sizes="(min-width: 1280px) 1152px, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
                  </>
                ) : (
                  <div className="absolute inset-0" aria-hidden>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(56,189,248,0.5),transparent_30%),linear-gradient(145deg,#061724_0%,#0b3854_52%,#087ca7_100%)]" />
                    <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
                    <div className="absolute -right-12 top-10 size-48 rounded-full border border-white/20" />
                    <div className="absolute -right-3 top-[84px] size-32 rounded-full border border-white/25" />
                    <svg
                      viewBox="0 0 280 160"
                      className="absolute bottom-5 left-5 w-[70%] text-white/85"
                    >
                      <path
                        d="M8 128 C64 70, 112 145, 164 72 S244 30, 274 48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="8" cy="128" r="4" fill="currentColor" />
                      <circle cx="164" cy="72" r="4" fill="currentColor" />
                      <circle cx="274" cy="48" r="4" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 px-5 pb-7 sm:px-8 sm:pb-8">
                <div className="flex items-start justify-between gap-5">
                  <Avatar className="-mt-12 size-24 border-4 border-card bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.08)] sm:-mt-16 sm:size-32 sm:border-[5px] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                    <AvatarImage
                      src={displayProfilePicture}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-neutral-900 text-3xl font-semibold text-white sm:text-4xl dark:bg-white dark:text-neutral-900">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-4 rounded-full bg-card px-4 shadow-none sm:mt-5"
                      >
                        <HugeiconsIcon
                          icon={Edit01Icon}
                          size={16}
                          color="currentColor"
                          strokeWidth={1.75}
                        />
                        Edit profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[640px]">
                      <DialogHeader className="border-b border-border px-6 py-5 pr-14">
                        <DialogTitle className="text-xl">
                          Edit profile
                        </DialogTitle>
                        <DialogDescription>
                          Update the details and artwork shown on your account.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-7 overflow-y-auto px-6 py-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Your name"
                              className="h-10 rounded-xl"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                              placeholder="you@example.com"
                              className="h-10 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <Label>Profile picture</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Square images work best.
                            </p>
                          </div>
                          <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/35 p-4">
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border bg-card">
                              {profilePicPreview ? (
                                <Image
                                  src={profilePicPreview}
                                  alt="Profile preview"
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <input
                                id="profilePicture-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) =>
                                  handleFileChange(e, "profilePicture")
                                }
                                disabled={uploadingProfilePic}
                              />
                              <div className="flex flex-wrap gap-2">
                                <label
                                  htmlFor="profilePicture-upload"
                                  aria-disabled={uploadingProfilePic}
                                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50"
                                >
                                  {uploadingProfilePic ? (
                                    <Spinner className="size-4" />
                                  ) : (
                                    <HugeiconsIcon
                                      icon={Upload01Icon}
                                      size={16}
                                      color="currentColor"
                                      strokeWidth={1.75}
                                    />
                                  )}
                                  {uploadingProfilePic
                                    ? "Uploading…"
                                    : "Upload image"}
                                </label>
                                {profilePicPreview && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-9 rounded-xl text-muted-foreground"
                                    onClick={() => {
                                      setProfilePicPreview(null);
                                      setEditForm({
                                        ...editForm,
                                        profilePicture: "",
                                      });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <Input
                                id="profilePicture-url"
                                value={editForm.profilePicture}
                                onChange={(e) => {
                                  setEditForm({
                                    ...editForm,
                                    profilePicture: e.target.value,
                                  });
                                  setProfilePicPreview(e.target.value || null);
                                }}
                                placeholder="Or paste an image URL"
                                aria-label="Profile picture URL"
                                className="h-9 rounded-xl bg-card text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <Label>Cover image</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Use a wide image to personalize your profile
                              panel.
                            </p>
                          </div>
                          <div className="overflow-hidden rounded-2xl border border-border bg-muted/35">
                            <div className="relative h-32 bg-[#0b3854]">
                              {headerPreview ? (
                                <Image
                                  src={headerPreview}
                                  alt="Cover preview"
                                  fill
                                  sizes="(min-width: 640px) 590px, 100vw"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.55),transparent_35%),linear-gradient(145deg,#061724,#087ca7)]" />
                              )}
                              {headerPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHeaderPreview(null);
                                    setEditForm({
                                      ...editForm,
                                      headerImage: "",
                                    });
                                  }}
                                  aria-label="Remove cover image"
                                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/70"
                                >
                                  <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    size={15}
                                    color="currentColor"
                                    strokeWidth={1.75}
                                  />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2 p-4">
                              <input
                                id="headerImage-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) =>
                                  handleFileChange(e, "headerImage")
                                }
                                disabled={uploadingHeader}
                              />
                              <label
                                htmlFor="headerImage-upload"
                                aria-disabled={uploadingHeader}
                                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50"
                              >
                                {uploadingHeader ? (
                                  <Spinner className="size-4" />
                                ) : (
                                  <HugeiconsIcon
                                    icon={Upload01Icon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.75}
                                  />
                                )}
                                {uploadingHeader
                                  ? "Uploading…"
                                  : "Upload cover"}
                              </label>
                              <Input
                                id="headerImage-url"
                                value={editForm.headerImage}
                                onChange={(e) => {
                                  setEditForm({
                                    ...editForm,
                                    headerImage: e.target.value,
                                  });
                                  setHeaderPreview(e.target.value || null);
                                }}
                                placeholder="Or paste an image URL"
                                aria-label="Cover image URL"
                                className="h-9 rounded-xl bg-card text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="border-t border-border bg-muted/25 px-6 py-4">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                          {isUpdating && <Spinner className="size-4" />}
                          {isUpdating ? "Saving…" : "Save changes"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-3 min-w-0">
                  <h2 className="truncate text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[34px]">
                    {displayName}
                  </h2>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {displayEmail}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-400">
                    <span className="size-1.5 rounded-full bg-sky-500" />
                    {roleLabel} account
                  </div>
                </div>

                <div className="mt-6 grid max-w-7xl grid-cols-3 border-t border-border pt-6">
                  <AccountMetric
                    icon={FolderOpenIcon}
                    value={
                      isLoadingProjects ? "—" : projectCount.toLocaleString()
                    }
                    label={projectCount === 1 ? "Project" : "Projects"}
                  />
                  <AccountMetric
                    icon={SparklesIcon}
                    value={Math.max(0, remainingCredits).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 1,
                      },
                    )}
                    label="Credits left"
                    bordered
                  />
                  <AccountMetric
                    icon={SparklesIcon}
                    value={usedCredits.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                    label="Credits used"
                    bordered
                  />
                </div>
              </div>
            </div>
          </section>

          <BillingSection />

          <section className="mt-12 border-t border-border pt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.025em]">
                  All Projects
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your complete design workspace.
                </p>
              </div>
              {!isLoadingProjects && projectCount > 0 && (
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  {projectCount} {projectCount === 1 ? "project" : "projects"}
                </span>
              )}
            </div>
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="size-10" />
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projects.map((project: ProjectType) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No projects yet. Start creating your first project!</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const AccountMetric = ({
  icon,
  value,
  label,
  bordered = false,
}: {
  icon: typeof FolderOpenIcon;
  value: string;
  label: string;
  bordered?: boolean;
}) => (
  <div
    className={
      bordered ? "border-l border-border pl-3 sm:pl-6" : "pr-2 sm:pr-6"
    }
  >
    <div className="flex items-center gap-1 text-muted-foreground sm:gap-1.5">
      <HugeiconsIcon
        icon={icon}
        size={14}
        color="currentColor"
        strokeWidth={1.75}
      />
      <span className="whitespace-nowrap text-[10px] font-medium sm:text-xs">
        {label}
      </span>
    </div>
    <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground tabular-nums sm:text-xl">
      {value}
    </p>
  </div>
);

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
  const router = useRouter();
  const createdAtDate = new Date(project.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  const onRoute = () => {
    router.push(`/project/${project.id}`);
  };

  return (
    <div
      role="button"
      className="w-full flex flex-col border rounded-xl cursor-pointer hover:shadow-sm overflow-hidden transition-shadow"
      onClick={onRoute}
    >
      <div className="h-44 relative overflow-hidden">
        <DefaultProjectThumbnail
          projectId={project.id}
          deviceType={project.deviceType}
        />
      </div>

      <div className="p-4 flex flex-col">
        <h3 className="font-medium text-sm truncate w-full mb-1 line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
});

ProjectCard.displayName = "ProjectCard";

export default ProfilePage;
