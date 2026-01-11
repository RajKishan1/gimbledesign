"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { useGetProjects } from "@/features/use-project";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ProjectType } from "@/types/project";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";

const ProjectsSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const currentProjectId = params.id as string;
  const { user } = useKindeBrowserClient();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects(
    user?.id
  );

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-[#1D1D1D] border-neutral-200 dark:border-[#2b2b2b] border-r transition-all duration-300 ease-in-out",
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
            <h3 className=" font-medium text-foreground px-4 pt-4 pb-2 flex-shrink-0">
              Recent Projects
            </h3>
            <ScrollArea className="flex-1 min-h-0">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="size-5" />
                </div>
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
                          "flex flex-col gap-0 m-0 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          isActive
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-primary/20 border-border"
                        )}
                      >
                        <h4 className="text-sm line-clamp-1">{project.name}</h4>
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

          {/* User Info Section */}
          <div className="border-t border-border p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 rounded-full">
                <AvatarImage
                  src={user?.picture || ""}
                  alt={user?.given_name || ""}
                />
                <AvatarFallback className="rounded-full">
                  {user?.given_name?.charAt(0)}
                  {user?.family_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {user?.given_name} {user?.family_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
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
