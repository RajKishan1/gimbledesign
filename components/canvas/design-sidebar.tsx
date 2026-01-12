"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ImageIcon,
  Sparkles,
  GitBranch,
  Trash2,
  Link2,
  MessageSquare,
  Palette,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { usePrototype } from "@/context/prototype-context";
import { useCanvas } from "@/context/canvas-context";
import { parseThemeColors, ThemeType } from "@/lib/themes";
import { CheckIcon } from "lucide-react";

interface DesignSidebarProps {
  projectId: string;
  onGenerate: (promptText: string) => void;
  isPending: boolean;
}

type DesignTab = "chat" | "theme";

const DesignSidebar = ({ onGenerate, isPending }: DesignSidebarProps) => {
  const {
    mode,
    links,
    removeLink,
    clearLinks,
    selectedLinkId,
    setSelectedLinkId,
  } = usePrototype();
  const { frames, themes, theme: currentTheme, setTheme } = useCanvas();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptText, setPromptText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DesignTab>("chat");

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

      {!isCollapsed && mode === "design" && (
        <div className="flex flex-col h-full">
          <div className="flex border-b border-neutral-200 dark:border-[#2b2b2b] pt-8">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "chat"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "theme"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Theme
            </button>
          </div>

          {activeTab === "chat" && (
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

          {/* Theme Tab Content */}
          {activeTab === "theme" && (
            <div className="flex flex-col h-full overflow-y-auto p-4">
              <h3 className="font-semibold text-sm mb-4">Choose a theme</h3>
              <div className="space-y-3">
                {themes?.map((theme) => (
                  <ThemeItem
                    key={theme.id}
                    theme={theme}
                    isSelected={currentTheme?.id === theme.id}
                    onSelect={() => setTheme(theme.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isCollapsed && mode === "prototype" && (
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-4 pt-8">
            <h3 className="font-medium text-sm">Interactions</h3>
            <span className="text-xs font-medium text-muted-foreground">
              {links.length} Link{links.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              {links.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={clearLinks}
                >
                  Clear All
                </Button>
              )}
            </div>

            {links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No links created yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click on elements to start linking
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => {
                  const fromScreen = frames.find(
                    (f) => f.id === link.fromScreenId
                  );
                  const toScreen = frames.find((f) => f.id === link.toScreenId);
                  const isSelected = selectedLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      className={cn(
                        "group p-2 rounded-lg border transition-all cursor-pointer",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                      )}
                      onClick={() =>
                        setSelectedLinkId(isSelected ? null : link.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-xs font-medium truncate max-w-[70px]"
                              title={fromScreen?.title}
                            >
                              {fromScreen?.title || "Unknown"}
                            </span>
                            <span className="text-indigo-500">→</span>
                            <span
                              className="text-xs font-medium truncate max-w-[70px]"
                              title={toScreen?.title}
                            >
                              {toScreen?.title || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLink(link.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function ThemeItem({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = parseThemeColors(theme.style);
  return (
    <button
      onClick={onSelect}
      className={cn(
        `flex items-center justify-between w-full
        p-1 rounded-xl border gap-4 bg-background
        hover:border-primary/50 hover:bg-accent/50
        `,
        isSelected ? "border-2" : "border"
      )}
      style={{
        borderColor: isSelected ? color.primary : "",
      }}
    >
      <div className="flex gap-2">
        {["primary", "secondary", "accent", "muted"].map((key) => (
          <div
            key={key}
            className="w-4 h-4 rounded-full border"
            style={{
              backgroundColor: color[key],
              borderColor: "#ccc",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 flex-[0.9]">
        <span className="text-sm">{theme.name}</span>
        {isSelected && <CheckIcon size={16} color={color.primary} />}
      </div>
    </button>
  );
}

export default DesignSidebar;
