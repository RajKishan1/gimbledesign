"use client";

import { useState, useEffect, useRef } from "react";
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
import { CheckIcon, Type } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRegenerateFrame } from "@/features/use-frame";

interface DesignSidebarProps {
  projectId: string;
  onGenerate: (promptText: string) => void;
  isPending: boolean;
}

type DesignTab = "chat" | "theme" | "fonts";

// Shimmer Card Component with cool animation (only for currently generating frame)
function ShimmerCard({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-[#2b2b2b] bg-white dark:bg-[#1f1f1f] p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-8 h-8 rounded bg-gradient-to-br from-purple-500/20 to-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full rounded bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
        <div className="h-2 w-3/4 rounded bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite", animationDelay: "0.2s" }} />
        </div>
        <div className="h-2 w-5/6 rounded bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: "shimmer 2s ease-in-out infinite", animationDelay: "0.4s" }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
        <Sparkles className="w-3 h-3 animate-pulse" />
        <span className="font-medium">Generating {title}...</span>
      </div>
    </div>
  );
}

// Completed Frame Card Component
function CompletedFrameCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-green-700 dark:text-green-400 flex-1">
          {title}
        </span>
      </div>
    </div>
  );
}

// Status Message Component
function StatusMessage({ 
  status, 
  message 
}: { 
  status: string; 
  message: string;
}) {
  const statusColors = {
    analyzing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    generating: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    running: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.generating;

  return (
    <div className={cn(
      "rounded-lg border p-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      colorClass
    )}>
      <div className="flex items-center gap-2">
        <Spinner className="w-4 h-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Chat Message Bubble Component
function ChatBubble({ message, role }: { message: string; role: string }) {
  const isUser = role === "user";
  return (
    <div className={cn(
      "rounded-lg p-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser 
        ? "bg-foreground text-background ml-auto max-w-[80%]" 
        : "bg-muted text-foreground mr-auto max-w-[80%]"
    )}>
      {message}
    </div>
  );
}

// Selected Frame Card Component
function SelectedFrameCard({ title }: { title: string }) {
  const screenName = `@${title}`;
  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/10 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">Editing screen</p>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">
            {screenName}
          </p>
        </div>
      </div>
    </div>
  );
}

// Chat Messages Component
function ChatMessages({ 
  loadingStatus, 
  frames,
  projectId,
  selectedFrame,
  chatMessages = []
}: { 
  loadingStatus: string | null;
  frames?: Array<{ id: string; title: string; isLoading?: boolean; htmlContent?: string }>;
  projectId: string;
  selectedFrame: { id: string; title: string } | null;
  chatMessages?: Array<{ id: string; message: string; role: string; frameId?: string | null; createdAt: Date }>;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const allFrames = frames || [];
  
  // Get frames that are currently loading
  const loadingFrames = allFrames.filter((f) => f.isLoading);
  // Get the first loading frame (currently being generated)
  const currentlyGeneratingFrame = loadingFrames[0] || null;
  
  // Get completed frames (have htmlContent and are not loading)
  const completedFrames = allFrames.filter(
    (f) => !f.isLoading && f.htmlContent && f.htmlContent.trim().length > 0
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadingStatus, currentlyGeneratingFrame, completedFrames.length, chatMessages.length, selectedFrame]);

  const getStatusMessage = () => {
    switch (loadingStatus) {
      case "analyzing":
        return "Analyzing your prompt...";
      case "generating":
        return "Generating designs...";
      case "running":
        return "Starting generation...";
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();
  const hasContent = loadingStatus || currentlyGeneratingFrame || completedFrames.length > 0 || chatMessages.length > 0 || selectedFrame;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Start generating designs
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Your generation status will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Show selected frame if one is selected */}
      {selectedFrame && (
        <SelectedFrameCard title={selectedFrame.title} />
      )}
      
      {/* Show chat messages */}
      {chatMessages.map((msg) => (
        <ChatBubble key={msg.id} message={msg.message} role={msg.role} />
      ))}
      
      {/* Only show status message for analyzing/running, not for generating */}
      {statusMessage && loadingStatus !== "generating" && (
        <StatusMessage status={loadingStatus || "generating"} message={statusMessage} />
      )}
      {/* Show completed frames first */}
      {completedFrames.map((frame) => (
        <CompletedFrameCard key={frame.id} title={frame.title} />
      ))}
      {/* Show shimmer only for the currently generating frame */}
      {currentlyGeneratingFrame && (
        <ShimmerCard key={currentlyGeneratingFrame.id} title={currentlyGeneratingFrame.title} />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

const DesignSidebar = ({ projectId, onGenerate, isPending }: DesignSidebarProps) => {
  const {
    mode,
    links,
    removeLink,
    clearLinks,
    selectedLinkId,
    setSelectedLinkId,
  } = usePrototype();
  const {
    frames,
    themes,
    theme: currentTheme,
    setTheme,
    fonts,
    font: currentFont,
    setFont,
    loadingStatus,
    selectedFrame,
  } = useCanvas();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptText, setPromptText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DesignTab>("chat");
  const queryClient = useQueryClient();
  const regenerateFrame = useRegenerateFrame(projectId);

  // Load chat messages
  const { data: chatData } = useQuery({
    queryKey: ["chat", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/project/${projectId}/chat`);
      return res.data.messages || [];
    },
    enabled: !!projectId,
  });

  const chatMessages = chatData || [];

  // Mutation to save chat message
  const saveMessageMutation = useMutation({
    mutationFn: async ({ message, frameId, role = "user" }: { message: string; frameId?: string | null; role?: string }) => {
      const res = await axios.post(`/api/project/${projectId}/chat`, {
        message,
        frameId: frameId || null,
        role,
      });
      return res.data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", projectId] });
    },
  });

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    let text = promptText.trim();
    setPromptText("");

    // If a frame is selected, edit it; otherwise generate new designs
    if (selectedFrame) {
      // Format message with @ScreenName if not already present
      const screenName = `@${selectedFrame.title}`;
      const messageText = text.startsWith("@") ? text : `${screenName} ${text}`;
      
      // Save user message to chat
      await saveMessageMutation.mutateAsync({
        message: messageText,
        frameId: selectedFrame.id,
        role: "user",
      });

      // Regenerate the selected frame (use the original prompt without @ScreenName for the API)
      regenerateFrame.mutate(
        { frameId: selectedFrame.id, prompt: text },
        {
          onSuccess: () => {
            // Save assistant message
            saveMessageMutation.mutate({
              message: `Editing ${screenName}...`,
              frameId: selectedFrame.id,
              role: "assistant",
            });
          },
        }
      );
    } else {
      // Save user message to chat
      await saveMessageMutation.mutateAsync({
        message: text,
        role: "user",
      });

      // Generate new designs
      onGenerate(text);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-[#191919] border-l border-neutral-200 dark:border-[#212121] transition-all duration-300 ease-in-out",
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
            <button
              onClick={() => setActiveTab("fonts")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "fonts"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Type className="size-4" />
            </button>
          </div>

          {activeTab === "chat" && (
            <div className="flex flex-col h-full p-4">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                <ChatMessages 
                  loadingStatus={loadingStatus}
                  frames={frames}
                  projectId={projectId}
                  selectedFrame={selectedFrame}
                  chatMessages={chatMessages}
                />
              </div>

              <div className="flex flex-col gap-0 bg-[#F4F4F5] dark:bg-[#242424] rounded-none border-none shadow-sm">
                <div className="p-3 pb-2">
                  <Textarea
                    placeholder={selectedFrame ? `@${selectedFrame.title} What changes do you want?` : "What changes do you want to make ?"}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    className="min-h-[80px] rounded-none resize-none  border-0 bg-white dark:bg-[#202020] shadow-none focus-visible:ring-0 placeholder:text-neutral-500"
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
                      className="h-8 px-2 rounded-none text-muted-foreground hover:text-foreground bg-muted/50"
                      type="button"
                    >
                      <Sparkles className="size-4" />
                    </Button>

                    <Button
                      disabled={(isPending || regenerateFrame.isPending || saveMessageMutation.isPending) || !promptText.trim()}
                      className="h-8 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-none"
                      onClick={handleGenerate}
                      type="button"
                    >
                      {(isPending || regenerateFrame.isPending || saveMessageMutation.isPending) ? <Spinner className="size-4" /> : "Submit"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div className="flex flex-col h-full overflow-y-auto p-4">
              <h3 className="font-medium mb-2">Choose a theme</h3>
              <div className="space-y-1.5">
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

          {activeTab === "fonts" && (
            <div className="flex flex-col h-full overflow-y-auto p-4">
              <h3 className="font-medium mb-2">Choose a font</h3>
              <div className="space-y-1.5">
                {fonts?.map((font) => (
                  <FontItem
                    key={font.id}
                    font={font}
                    isSelected={currentFont?.id === font.id}
                    onSelect={() => setFont(font.id)}
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
        `flex items-center justify-between w-full cursor-pointer
        px-2 py-1.5 rounded-none border gap-3 dark:bg-[#2c2c2c]
        bg-gray-100
        `,
        isSelected ? "border-1" : "border-none"
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
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {theme.name}
        </span>
        {isSelected && <CheckIcon size={16} color={color.primary} />}
      </div>
    </button>
  );
}

function FontItem({
  font,
  isSelected,
  onSelect,
}: {
  font: { id: string; name: string; family: string; category: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        `flex items-center justify-between w-full cursor-pointer
        px-3 py-2.5 rounded-none border gap-3 dark:bg-[#2c2c2c]
        bg-gray-100 transition-colors
        `,
        isSelected
          ? "border-2 border-foreground bg-foreground/5 dark:bg-foreground/10"
          : "border-none hover:bg-gray-200 dark:hover:bg-[#353535]"
      )}
    >
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate w-full"
          style={{ fontFamily: font.family }}
        >
          {font.name}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          {font.category}
        </span>
      </div>
      {isSelected && (
        <CheckIcon size={16} className="text-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export default DesignSidebar;
