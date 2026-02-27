"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ImageUpload01Icon,
  Delete01Icon,
  Message01Icon,
  ColorsIcon,
  CheckmarkCircle01Icon,
  TypeCursorIcon,
  Add01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { usePrototype } from "@/context/prototype-context";
import { useCanvas } from "@/context/canvas-context";
import { parseThemeColors, ThemeType } from "@/lib/themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRegenerateFrame } from "@/features/use-frame";
import { SELECTABLE_MODELS } from "@/constant/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SetupStatus = "reading" | "enhancing" | "generating" | null;

interface DesignSidebarProps {
  projectId: string;
  onGenerate: (promptText: string, model?: string) => void;
  isPending: boolean;
  /** User's original prompt, shown at top of chat when present */
  initialPrompt?: string | null;
  /** When project page is running setup pipeline (read image → enhance → generate), show in chat */
  setupStatus?: SetupStatus;
}

type DesignTab = "chat" | "theme" | "fonts";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShimmerCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        <div className="h-2 w-full rounded bg-muted animate-pulse" />
        <div className="h-2 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-2 w-5/6 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function CompletedFrameCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="currentColor" strokeWidth={2} className="text-white" />
        </div>
        <span className="text-sm font-medium text-green-700 dark:text-green-400 flex-1">
          {title}
        </span>
      </div>
    </div>
  );
}

function StatusMessage({ status, message }: { status: string; message: string }) {
  const statusColors: Record<string, string> = {
    analyzing: "bg-primary/10 text-primary border-primary/20",
    generating: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    running: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    reading: "bg-primary/10 text-primary border-primary/20",
    enhancing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  const colorClass = statusColors[status] || statusColors.generating;
  return (
    <div className={cn("rounded-xl border p-3 animate-in fade-in slide-in-from-bottom-2 duration-300", colorClass)}>
      <div className="flex items-center gap-2">
        <Spinner className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{message}</span>
      </div>
    </div>
  );
}

function ChatBubble({ message, role }: { message: string; role: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <HugeiconsIcon icon={ColorsIcon} size={12} color="currentColor" strokeWidth={1.75} className="text-primary" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300",
          isUser
            ? "bg-foreground text-background max-w-[82%] max-h-32 overflow-y-auto overflow-x-hidden rounded-br-sm"
            : "bg-muted text-foreground max-w-[82%] rounded-bl-sm"
        )}
      >
        {message}
      </div>
    </div>
  );
}

function SelectedFrameChip({ title }: { title: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <HugeiconsIcon icon={Layers01Icon} size={10} color="currentColor" strokeWidth={2} className="text-white" />
      </div>
      <span className="text-xs font-medium text-primary">@{title}</span>
    </div>
  );
}

function ChatMessages({
  loadingStatus,
  frames,
  projectId,
  selectedFrame,
  chatMessages = [],
  initialPrompt,
  setupStatus,
}: {
  loadingStatus: string | null;
  frames?: Array<{ id: string; title: string; isLoading?: boolean; htmlContent?: string; createdAt?: Date }>;
  projectId: string;
  selectedFrame: { id: string; title: string } | null;
  chatMessages?: Array<{ id: string; message: string; role: string; frameId?: string | null; createdAt: Date }>;
  initialPrompt?: string | null;
  setupStatus?: SetupStatus;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const allFrames = frames || [];
  const loadingFrames = allFrames.filter((f) => f.isLoading);
  const currentlyGeneratingFrame = loadingFrames[0] || null;
  const completedFrames = allFrames.filter(
    (f) => !f.isLoading && f.htmlContent && f.htmlContent.trim().length > 0
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadingStatus, currentlyGeneratingFrame, completedFrames.length, chatMessages.length, selectedFrame, initialPrompt, setupStatus]);

  const getSetupStatusMessage = () => {
    if (!setupStatus) return null;
    switch (setupStatus) {
      case "reading": return "Reading image...";
      case "enhancing": return "Enhancing prompt...";
      case "generating": return "Generating design...";
      default: return null;
    }
  };

  const getStatusMessage = () => {
    const setupMsg = getSetupStatusMessage();
    if (setupMsg) return setupMsg;
    switch (loadingStatus) {
      case "analyzing": return "Analyzing your prompt...";
      case "generating": return "Generating designs...";
      case "running": return "Starting generation...";
      default: return null;
    }
  };

  const statusMessage = getStatusMessage();
  const hasContent =
    loadingStatus || setupStatus || currentlyGeneratingFrame ||
    completedFrames.length > 0 || chatMessages.length > 0 ||
    selectedFrame || (initialPrompt && initialPrompt.trim());

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
          <HugeiconsIcon icon={Message01Icon} size={20} color="currentColor" strokeWidth={1.75} className="text-primary/60" />
        </div>
        <p className="text-sm font-medium text-foreground/70">Your assistant</p>
        <p className="text-xs text-muted-foreground">Describe changes below to get started</p>
      </div>
    );
  }

  // ── Group frames with the prompt that generated them ──────────────────────
  // User messages without frameId are "generation triggers" (batch generation).
  // We use createdAt timestamps to assign frames to the turn that generated them.
  const userGenMessages = chatMessages.filter(
    (m) => m.role === "user" && !m.frameId
  );

  const getFramesForTurn = (
    turnStart: Date | null,
    turnEnd: Date | null
  ) => {
    return completedFrames.filter((frame) => {
      // Frames without a timestamp fall back to the initial group
      if (!frame.createdAt) return turnStart === null;
      const t = new Date(frame.createdAt).getTime();
      if (turnStart !== null && t < new Date(turnStart).getTime()) return false;
      if (turnEnd !== null && t >= new Date(turnEnd).getTime()) return false;
      return true;
    });
  };

  const firstGenMsg = userGenMessages[0];
  // Frames before the first chat-generation message belong to the initial prompt
  const initialTurnFrames = getFramesForTurn(null, firstGenMsg?.createdAt ?? null);

  return (
    <div className="space-y-2.5">
      {selectedFrame && <SelectedFrameChip title={selectedFrame.title} />}

      {/* ── Initial prompt turn ───────────────────────────────────── */}
      {initialPrompt && initialPrompt.trim() && (
        <>
          <ChatBubble message={initialPrompt.trim()} role="user" />
          {initialTurnFrames.map((frame) => (
            <CompletedFrameCard key={frame.id} title={frame.title} />
          ))}
        </>
      )}

      {/* ── Chat messages, each generation trigger followed by its frames ── */}
      {chatMessages.map((msg) => {
        const isGenTrigger = msg.role === "user" && !msg.frameId;
        let turnFrames: typeof completedFrames = [];
        if (isGenTrigger) {
          const genIdx = userGenMessages.findIndex((m) => m.id === msg.id);
          const nextGen = userGenMessages[genIdx + 1];
          turnFrames = getFramesForTurn(msg.createdAt, nextGen?.createdAt ?? null);
        }
        return (
          <div key={msg.id}>
            <ChatBubble message={msg.message} role={msg.role} />
            {turnFrames.length > 0 && (
              <div className="mt-2.5 space-y-2.5">
                {turnFrames.map((frame) => (
                  <CompletedFrameCard key={frame.id} title={frame.title} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Loading states (always at the bottom for the in-progress turn) ── */}
      {statusMessage && (setupStatus || loadingStatus !== "generating") && (
        <StatusMessage status={setupStatus ?? loadingStatus ?? "generating"} message={statusMessage} />
      )}
      {currentlyGeneratingFrame && (
        <ShimmerCard key={currentlyGeneratingFrame.id} title={currentlyGeneratingFrame.title} />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

// ─── Sidebar collapse toggle icon ─────────────────────────────────────────────
function SidebarToggleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.33325 8C1.33325 5.54058 1.33325 4.31087 1.8758 3.43918C2.07652 3.11668 2.32586 2.83618 2.61253 2.61036C3.38736 2 4.48043 2 6.66658 2H9.33325C11.5194 2 12.6125 2 13.3873 2.61036C13.674 2.83618 13.9233 3.11668 14.1241 3.43918C14.6666 4.31087 14.6666 5.54058 14.6666 8C14.6666 10.4594 14.6666 11.6891 14.1241 12.5608C13.9233 12.8833 13.674 13.1638 13.3873 13.3897C12.6125 14 11.5194 14 9.33325 14H6.66658C4.48043 14 3.38736 14 2.61253 13.3897C2.32586 13.1638 2.07652 12.8833 1.8758 12.5608C1.33325 11.6891 1.33325 10.4594 1.33325 8Z" stroke="#B5B5B5" strokeWidth="1.24444" />
      <path d="M6.33325 2V14" stroke="#B5B5B5" strokeWidth="1.24444" strokeLinejoin="round" />
      <path d="M3.33325 4.66797H3.99992M3.33325 6.66797H3.99992" stroke="#B5B5B5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Model selector short label ───────────────────────────────────────────────
function modelShortLabel(modelId: string) {
  if (modelId === "auto") return "Auto";
  if (modelId.includes("flash")) return "Flash";
  if (modelId.includes("sonnet")) return "Sonnet";
  if (modelId.includes("3.1-pro") || modelId.includes("gemini-3.1")) return "Pro";
  if (modelId.includes("3-pro") || modelId.includes("gemini-3")) return "Pro";
  const m = SELECTABLE_MODELS.find((m) => m.id === modelId);
  return m?.name ?? "Auto";
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

const DesignSidebar = ({
  projectId,
  onGenerate,
  isPending,
  initialPrompt,
  setupStatus = null,
}: DesignSidebarProps) => {
  const { mode, links, removeLink, clearLinks, selectedLinkId, setSelectedLinkId } = usePrototype();
  const { frames, themes, theme: currentTheme, setTheme, fonts, font: currentFont, setFont, loadingStatus, selectedFrame } = useCanvas();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptText, setPromptText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DesignTab>("chat");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [variationCount, setVariationCount] = useState<1 | 2 | 3>(1);
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const regenerateFrame = useRegenerateFrame(projectId);

  // Restore model from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("selectedModel");
    if (saved) setSelectedModel(saved);
  }, []);

  const handleModelChange = useCallback((id: string) => {
    setSelectedModel(id);
    if (typeof window !== "undefined") localStorage.setItem("selectedModel", id);
  }, []);

  const cycleVariations = useCallback(() => {
    setVariationCount((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
  }, []);

  const handleAttachClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage({ dataUrl: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

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

  const saveMessageMutation = useMutation({
    mutationFn: async ({ message, frameId, role = "user" }: { message: string; frameId?: string | null; role?: string }) => {
      const res = await axios.post(`/api/project/${projectId}/chat`, { message, frameId: frameId || null, role });
      return res.data.message;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", projectId] }),
  });

  const isLoading =
    isPending || regenerateFrame.isPending || saveMessageMutation.isPending || !!setupStatus;

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    const text = promptText.trim();
    setPromptText("");
    setAttachedImage(null);

    if (selectedFrame) {
      const screenName = `@${selectedFrame.title}`;
      const messageText = text.startsWith("@") ? text : `${screenName} ${text}`;
      await saveMessageMutation.mutateAsync({ message: messageText, frameId: selectedFrame.id, role: "user" });
      regenerateFrame.mutate(
        { frameId: selectedFrame.id, prompt: text, model: selectedModel },
        {
          onSuccess: () => {
            saveMessageMutation.mutate({ message: `Editing ${screenName}...`, frameId: selectedFrame.id, role: "assistant" });
          },
        }
      );
    } else {
      await saveMessageMutation.mutateAsync({ message: text, role: "user" });
      onGenerate(text, selectedModel);
    }
  };

  const currentModelLabel = modelShortLabel(selectedModel);

  return (
    <div
      className={cn(
        "relative flex flex-col h-full min-h-0 bg-card border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-[340px]"
      )}
    >
      {/* Collapse toggle */}
      <div className="absolute left-3.5 top-3.5 z-10">
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <SidebarToggleIcon />
        </button>
      </div>

      {/* ── Design mode ─────────────────────────────────────────────── */}
      {!isCollapsed && mode === "design" && (
        <div className="flex flex-col flex-1 min-h-0">

          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-border pt-9">
            {(["chat", "theme", "fonts"] as DesignTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 flex items-center justify-center px-3 py-2.5 text-xs font-medium transition-colors capitalize",
                  activeTab === tab
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "fonts" ? (
                  <HugeiconsIcon icon={TypeCursorIcon} size={14} color="currentColor" strokeWidth={1.75} />
                ) : tab === "theme" ? (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={ColorsIcon} size={12} color="currentColor" strokeWidth={1.75} />
                    Theme
                  </span>
                ) : (
                  "Chat"
                )}
              </button>
            ))}
          </div>

          {/* ── Chat tab ────────────────────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-3">
                <ChatMessages
                  loadingStatus={loadingStatus}
                  frames={frames}
                  projectId={projectId}
                  selectedFrame={selectedFrame}
                  chatMessages={chatMessages}
                  initialPrompt={initialPrompt}
                  setupStatus={setupStatus}
                />
              </div>

              {/* Input card */}
              <div className="px-3 pb-3 shrink-0">
                <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
                  {/* Attached image preview */}
                  {attachedImage && (
                    <div className="px-3 pt-2.5 flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <img src={attachedImage.dataUrl} alt="Attachment" className="w-full h-full object-cover" />
                        <button
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => setAttachedImage(null)}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={12} color="white" strokeWidth={2} />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground truncate flex-1">{attachedImage.name}</span>
                    </div>
                  )}

                  {/* Textarea */}
                  <Textarea
                    placeholder={
                      selectedFrame
                        ? `@${selectedFrame.title} describe changes…`
                        : "Describe your design…"
                    }
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    className="min-h-[72px] max-h-40 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 text-sm px-3 pt-3 pb-1"
                  />

                  {/* Bottom toolbar */}
                  <div className="flex items-center gap-1.5 px-2 py-2">
                    {/* + attach */}
                    <button
                      type="button"
                      title="Attach image"
                      onClick={handleAttachClick}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={16} color="currentColor" strokeWidth={2} />
                    </button>

                    {/* Variation count */}
                    <button
                      type="button"
                      title="Variation count"
                      onClick={cycleVariations}
                      className="h-7 px-2 rounded-lg flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <HugeiconsIcon icon={ImageUpload01Icon} size={13} color="currentColor" strokeWidth={1.75} />
                      <span className="text-xs font-medium">{variationCount}x</span>
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Model selector */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
                        >
                          {currentModelLabel}
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-60">
                            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {SELECTABLE_MODELS.map((m) => (
                          <DropdownMenuItem
                            key={m.id}
                            onClick={() => handleModelChange(m.id)}
                            className={cn("text-xs", selectedModel === m.id && "text-primary font-medium")}
                          >
                            <span className="flex-1">{m.name}</span>
                            {selectedModel === m.id && (
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="currentColor" strokeWidth={2} className="text-primary ml-1" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Send button */}
                    <button
                      type="button"
                      disabled={isLoading || !promptText.trim()}
                      onClick={handleGenerate}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        isLoading || !promptText.trim()
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-foreground text-background hover:opacity-85 dark:bg-primary dark:text-primary-foreground"
                      )}
                    >
                      {isLoading ? (
                        <Spinner className="w-3.5 h-3.5" />
                      ) : (
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Loading status hint */}
                {setupStatus && (
                  <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                    {setupStatus === "reading" && "Reading image…"}
                    {setupStatus === "enhancing" && "Enhancing prompt…"}
                    {setupStatus === "generating" && "Generating design…"}
                  </p>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden
                onChange={handleImageFile}
              />
            </div>
          )}

          {/* ── Theme tab ───────────────────────────────────────────── */}
          {activeTab === "theme" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 shrink-0">
                Choose a theme
              </p>
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

          {/* ── Fonts tab ───────────────────────────────────────────── */}
          {activeTab === "fonts" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 shrink-0">
                Choose a font
              </p>
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

      {/* ── Prototype mode ──────────────────────────────────────────── */}
      {!isCollapsed && mode === "prototype" && (
        <div className="flex flex-col flex-1 min-h-0 p-3 pt-4">
          <div className="flex shrink-0 items-center justify-between mb-4 pt-7">
            <h3 className="font-medium text-sm">Interactions</h3>
            <span className="text-xs text-muted-foreground">
              {links.length} Link{links.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            {links.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={clearLinks}>
                  Clear All
                </Button>
              </div>
            )}

            {links.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No links yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Click elements to start linking</p>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => {
                  const fromScreen = frames.find((f) => f.id === link.fromScreenId);
                  const toScreen = frames.find((f) => f.id === link.toScreenId);
                  const isSelected = selectedLinkId === link.id;
                  return (
                    <div
                      key={link.id}
                      className={cn(
                        "group p-2.5 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700"
                          : "bg-card border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedLinkId(isSelected ? null : link.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs font-medium">
                          <span className="truncate max-w-[65px]" title={fromScreen?.title}>{fromScreen?.title || "?"}</span>
                          <span className="text-indigo-500">→</span>
                          <span className="truncate max-w-[65px]" title={toScreen?.title}>{toScreen?.title || "?"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeLink(link.id); }}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={11} color="currentColor" strokeWidth={2} />
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

// ─── Theme item ───────────────────────────────────────────────────────────────

function ThemeItem({ theme, isSelected, onSelect }: { theme: ThemeType; isSelected: boolean; onSelect: () => void }) {
  const color = parseThemeColors(theme.style);
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between w-full cursor-pointer px-2.5 py-2 rounded-xl border gap-3 bg-muted/50 transition-colors",
        isSelected ? "border-primary/60 bg-primary/5" : "border-border hover:bg-accent/50"
      )}
    >
      <div className="flex gap-1.5">
        {(["primary", "secondary", "accent", "muted"] as const).map((key) => (
          <div key={key} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: color[key] }} />
        ))}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground truncate">{theme.name}</span>
        {isSelected && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} color={color.primary} strokeWidth={2} className="flex-shrink-0 ml-auto" />}
      </div>
    </button>
  );
}

// ─── Font item ────────────────────────────────────────────────────────────────

function FontItem({ font, isSelected, onSelect }: { font: { id: string; name: string; family: string; category: string }; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between w-full cursor-pointer px-2.5 py-2 rounded-xl border gap-3 bg-muted/50 transition-colors",
        isSelected ? "border-foreground/50 bg-foreground/5 dark:bg-foreground/10" : "border-border hover:bg-accent/50"
      )}
    >
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground truncate w-full" style={{ fontFamily: font.family }}>
          {font.name}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">{font.category}</span>
      </div>
      {isSelected && (
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} color="currentColor" strokeWidth={2} className="text-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export default DesignSidebar;
