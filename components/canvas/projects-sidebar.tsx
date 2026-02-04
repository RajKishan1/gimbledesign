"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { useGetProjects } from "@/features/use-project";
import { authClient } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ProjectType } from "@/types/project";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { useGetCredits } from "@/features/use-credits";
import { useGetProfile } from "@/features/use-profile";

const ProjectsSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const currentProjectId = params.id as string;
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data: profile } = useGetProfile();
  const {
    data: projects,
    isLoading: isLoadingProjects,
    isError: isProjectsError,
  } = useGetProjects(
    user?.id,
    undefined // No limit - fetch all projects
  );
  const { data: credits, isLoading: isLoadingCredits } = useGetCredits(
    user?.id
  );

  const profilePicture = profile?.profilePicture || user?.image || "";
  const displayName = profile?.name || user?.name || "";
  const displayEmail = profile?.email || user?.email || "";

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-[#191919] border-neutral-200 dark:border-[#212121] border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <div
        className={`absolute ${
          !isCollapsed ? "right-4" : " right-4"
        }  top-4 z-10`}
      >
        <button
          className=" border-none cursor-pointer bg-transparent p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.33325 8C1.33325 5.54058 1.33325 4.31087 1.8758 3.43918C2.07652 3.11668 2.32586 2.83618 2.61253 2.61036C3.38736 2 4.48043 2 6.66658 2H9.33325C11.5194 2 12.6125 2 13.3873 2.61036C13.674 2.83618 13.9233 3.11668 14.1241 3.43918C14.6666 4.31087 14.6666 5.54058 14.6666 8C14.6666 10.4594 14.6666 11.6891 14.1241 12.5608C13.9233 12.8833 13.674 13.1638 13.3873 13.3897C12.6125 14 11.5194 14 9.33325 14H6.66658C4.48043 14 3.38736 14 2.61253 13.3897C2.32586 13.1638 2.07652 12.8833 1.8758 12.5608C1.33325 11.6891 1.33325 10.4594 1.33325 8Z"
                stroke="#B5B5B5"
                stroke-width="1.24444"
              />
              <path
                d="M6.33325 2V14"
                stroke="#B5B5B5"
                stroke-width="1.24444"
                stroke-linejoin="round"
              />
              <path
                d="M3.33325 4.66797H3.99992M3.33325 6.66797H3.99992"
                stroke="#B5B5B5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.33325 8C1.33325 5.54058 1.33325 4.31087 1.8758 3.43918C2.07652 3.11668 2.32586 2.83618 2.61253 2.61036C3.38736 2 4.48043 2 6.66658 2H9.33325C11.5194 2 12.6125 2 13.3873 2.61036C13.674 2.83618 13.9233 3.11668 14.1241 3.43918C14.6666 4.31087 14.6666 5.54058 14.6666 8C14.6666 10.4594 14.6666 11.6891 14.1241 12.5608C13.9233 12.8833 13.674 13.1638 13.3873 13.3897C12.6125 14 11.5194 14 9.33325 14H6.66658C4.48043 14 3.38736 14 2.61253 13.3897C2.32586 13.1638 2.07652 12.8833 1.8758 12.5608C1.33325 11.6891 1.33325 10.4594 1.33325 8Z"
                stroke="#B5B5B5"
                stroke-width="1.24444"
              />
              <path
                d="M6.33325 2V14"
                stroke="#B5B5B5"
                stroke-width="1.24444"
                stroke-linejoin="round"
              />
              <path
                d="M3.33325 4.66797H3.99992M3.33325 6.66797H3.99992"
                stroke="#B5B5B5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className=" font-medium text-neutral-800 dark:text-neutral-200 px-4 pt-4 pb-2 flex-shrink-0">
              Recent Projects
            </h3>
            <ScrollArea className="flex-1 min-h-0">
              {!user ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="size-5" />
                </div>
              ) : isLoadingProjects ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="size-5" />
                </div>
              ) : isProjectsError ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Failed to load projects
                </p>
              ) : projects && projects.length > 0 ? (
                <div className="flex flex-col gap-0.5 px-2">
                  {projects.map((project: ProjectType) => {
                    const createdAtDate = new Date(project.createdAt);
                    const timeAgo = formatDistanceToNow(createdAtDate, {
                      addSuffix: true,
                    });
                    const isActive = project.id === currentProjectId;

                    return (
                      <div
                        key={project.id}
                        role="button"
                        onClick={() => handleProjectClick(project.id)}
                        className={cn(
                          "flex flex-col gap-0 m-0 px-2 py-1.5 rounded-none cursor-pointer transition-colors",
                          isActive
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-primary/20 border-border"
                        )}
                      >
                        <h4 className="text-xs line-clamp-1 text-neutral-600 dark:text-neutral-400">
                          {project.name}
                        </h4>
                        {/* <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo}
                        </p> */}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects yet
                </p>
              )}
            </ScrollArea>
          </div>

          <div className="border-t border-neutral-200 dark:border-[#212121] px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-none">
              <div className="flex gap-2.5 items-center min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {isLoadingCredits
                    ? "Loading..."
                    : `${credits?.toFixed(1) || "0.0"} Credits`}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Available
                </p>
              </div>
            </div>
          </div>

          <div
            className="border-t border-neutral-200 dark:border-[#212121] p-4 flex-shrink-0 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => router.push("/profile")}
            role="button"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 rounded-full">
                <AvatarImage
                  src={profilePicture}
                  alt={displayName || user?.name || ""}
                />
                <AvatarFallback className="rounded-full">
                  {displayName
                    ? displayName
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .join("")
                        .slice(0, 2)
                    : user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .join("")
                        .slice(0, 2)
                    : ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {displayName || user?.name || ""}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsSidebar;
