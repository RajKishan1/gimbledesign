"use client";

import React, { useState, memo } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Edit2, Coins, ArrowLeft, Upload, X } from "lucide-react";
import Header from "../_common/header";
import { useGetProfile, useUpdateProfile } from "@/features/use-profile";
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
import { FolderOpenDotIcon } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const { data: profile, isLoading: isLoadingProfile } = useGetProfile();
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
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
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
      <div className="w-full min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-10" />
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayProfilePicture = profile?.profilePicture || user?.image || "";
  const displayHeaderImage = profile?.headerImage || "";

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        {/* Header Image Section */}
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-primary/5 mb-4">
          {displayHeaderImage ? (
            <img
              src={displayHeaderImage}
              alt="Header"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">No header image</p>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="relative -mt-16 md:-mt-20 px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 pb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
                <AvatarImage src={displayProfilePicture} alt={displayName} />
                <AvatarFallback className="text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1">
                  {displayName}
                </h1>
                <p className="text-muted-foreground">{displayEmail}</p>
              </div>

              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit2 className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="profilePicture">Profile Picture</Label>
                      <div className="flex flex-col gap-2">
                        {profilePicPreview && (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                            <img
                              src={profilePicPreview}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setProfilePicPreview(null);
                                setEditForm({
                                  ...editForm,
                                  profilePicture: "",
                                });
                              }}
                              className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            id="profilePicture-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileChange(e, "profilePicture")
                            }
                            disabled={uploadingProfilePic}
                          />
                          <label
                            htmlFor="profilePicture-upload"
                            className="flex-1"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full cursor-pointer"
                              disabled={uploadingProfilePic}
                              asChild
                            >
                              <span>
                                {uploadingProfilePic ? (
                                  <>
                                    <Spinner className="size-4 mr-2" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="size-4 mr-2" />
                                    Upload Image
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Or enter URL:
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
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="headerImage">Header Image</Label>
                      <div className="flex flex-col gap-2">
                        {headerPreview && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border">
                            <img
                              src={headerPreview}
                              alt="Header preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderPreview(null);
                                setEditForm({ ...editForm, headerImage: "" });
                              }}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            id="headerImage-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, "headerImage")}
                            disabled={uploadingHeader}
                          />
                          <label
                            htmlFor="headerImage-upload"
                            className="flex-1"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full cursor-pointer"
                              disabled={uploadingHeader}
                              asChild
                            >
                              <span>
                                {uploadingHeader ? (
                                  <>
                                    <Spinner className="size-4 mr-2" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="size-4 mr-2" />
                                    Upload Image
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Or enter URL:
                        </div>
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
                          placeholder="https://example.com/header.jpg"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Spinner className="size-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Credits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Used</p>
              <p className="text-2xl font-semibold text-primary">
                {usedCredits.toFixed(1)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-semibold text-primary">
                {remainingCredits.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Projects</h2>
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
        </div>
      </div>
    </div>
  );
};

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
  const router = useRouter();
  const createdAtDate = new Date(project.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
  const thumbnail = project.thumbnail || null;

  const onRoute = () => {
    router.push(`/project/${project.id}`);
  };

  return (
    <div
      role="button"
      className="w-full flex flex-col border rounded-xl cursor-pointer hover:shadow-sm overflow-hidden transition-shadow"
      onClick={onRoute}
    >
      <div className="h-40 bg-[#eee] dark:bg-[#2b2b2b] relative overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            className="w-full h-full object-cover object-left scale-110"
            alt={project.name}
          />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-primary">
            <FolderOpenDotIcon size={36} />
          </div>
        )}
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
