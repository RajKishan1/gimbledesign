"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";

interface DesignSidebarProps {
  projectId: string;
  onGenerate: (promptText: string) => void;
  isPending: boolean;
}

const DesignSidebar = ({ onGenerate, isPending }: DesignSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptText, setPromptText] = useState<string>("");

  const handleGenerate = () => {
    if (!promptText.trim()) return;
    const text = promptText;
    setPromptText("");
    onGenerate(text);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-[#1D1D1D] border-l border-neutral-200 dark:border-[#2b2b2b] transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-72"
      )}
    >
      <div className="absolute left-4 top-4 z-10">
        <button className="" onClick={() => setIsCollapsed(!isCollapsed)}>
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
        <div className="flex flex-col h-full p-4">
          <div className="flex-1" />

          <div className="flex flex-col gap-0 bg-[#F4F4F5] dark:bg-[#242424] rounded-[12px] border-none shadow-sm">
            <div className="p-3 pb-2">
              <Textarea
                placeholder="What changes do you want to make ?"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-white shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-between px-3 pb-3 gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <ImageIcon className="size-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground bg-muted/50"
                  type="button"
                >
                  <Sparkles className="size-4" />
                </Button>

                <Button
                  disabled={isPending || !promptText.trim()}
                  className="h-8 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-md"
                  onClick={handleGenerate}
                  type="button"
                >
                  {isPending ? <Spinner className="size-4" /> : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignSidebar;
