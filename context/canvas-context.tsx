/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { fetchRealtimeSubscriptionToken } from "@/app/action/realtime";
import { THEME_LIST, ThemeType } from "@/lib/themes";
import { FrameType } from "@/types/project";
import { POPULAR_FONTS, FontOption, DEFAULT_FONT } from "@/constant/fonts";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type LoadingStatusType =
  | "idle"
  | "running"
  | "analyzing"
  | "generating"
  | "completed";

export type DeviceType = "mobile" | "web" | "wireframe";

export type CustomDimensions = { width: number; height: number };

interface CanvasContextType {
  theme?: ThemeType;
  setTheme: (id: string) => void;
  themes: ThemeType[];

  font?: FontOption;
  setFont: (id: string) => void;
  fonts: FontOption[];

  frames: FrameType[];
  setFrames: (frames: FrameType[]) => void;
  updateFrame: (id: string, data: Partial<FrameType>) => void;
  addFrame: (frame: FrameType) => void;

  selectedFrameId: string | null;
  selectedFrame: FrameType | null;
  setSelectedFrameId: (id: string | null) => void;

  loadingStatus: LoadingStatusType | null;
  setLoadingStatus: (status: LoadingStatusType | null) => void;

  deviceType: DeviceType;
  /** When set (e.g. inspirations project), frame uses these instead of deviceType presets */
  customDimensions?: CustomDimensions;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({
  children,
  initialFrames,
  initialThemeId,
  initialDeviceType = "mobile",
  initialDimensions,
  hasInitialData,
  projectId,
}: {
  children: ReactNode;
  initialFrames: FrameType[];
  initialThemeId?: string;
  initialDeviceType?: DeviceType;
  /** Custom width/height for inspirations or variable-size projects */
  initialDimensions?: CustomDimensions;
  hasInitialData: boolean;
  projectId: string | null;
}) => {
  const [themeId, setThemeId] = useState<string>(
    initialThemeId || THEME_LIST[0].id
  );

  const [fontId, setFontId] = useState<string>(DEFAULT_FONT);
  const [deviceType, setDeviceType] = useState<DeviceType>(initialDeviceType);
  const customDimensions = initialDimensions ?? undefined;

  const [frames, setFrames] = useState<FrameType[]>(initialFrames);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatusType | null>(
    null
  );

  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setLoadingStatus(hasInitialData ? "idle" : "running");
    setFrames(initialFrames);
    setThemeId(initialThemeId || THEME_LIST[0].id);
    setSelectedFrameId(null);
    setDeviceType(initialDeviceType); // Reset device type when project changes
  }

  const theme = THEME_LIST.find((t) => t.id === themeId);
  const font = POPULAR_FONTS.find((f) => f.id === fontId) || POPULAR_FONTS.find((f) => f.id === DEFAULT_FONT);
  const selectedFrame =
    selectedFrameId && frames.length !== 0
      ? frames.find((f) => f.id === selectedFrameId) || null
      : null;

  //Update the LoadingState Inngest Realtime event
  const subscriptionResult = useInngestSubscription({
    refreshToken: fetchRealtimeSubscriptionToken,
  });
  const { freshData } = subscriptionResult;

  // Log subscription status for debugging (especially in production)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Log subscription status to help debug WebSocket issues
      console.log("[Realtime] Subscription status:", {
        hasFreshData: !!freshData,
        dataLength: freshData?.length || 0,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      });
    }
  }, [freshData]);

  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    freshData.forEach((message) => {
      const { data, topic } = message;

      if (data.projectId !== projectId) return;

      switch (topic) {
        case "generation.start":
          const status = data.status;
          setLoadingStatus(status);
          break;
        case "analysis.start":
          setLoadingStatus("analyzing");
          break;
        case "analysis.complete":
          setLoadingStatus("generating");
          if (data.theme) setThemeId(data.theme);

          if (data.screens && data.screens.length > 0) {
            const skeletonFrames: FrameType[] = data.screens.map((s: any) => ({
              id: s.id,
              title: s.name,
              htmlContent: "",
              isLoading: true,
            }));
            setFrames((prev) => [...prev, ...skeletonFrames]);
          }
          break;
        case "frame.created":
          if (data.frame) {
            setFrames((prev) => {
              const newFrames = [...prev];
              // Match by frame.id (database ID) or frameId first, then fallback to screenId (kebab-case)
              const frameIdToMatch = data.frameId || data.frame.id;
              const idx = newFrames.findIndex(
                (f) => f.id === frameIdToMatch || f.id === data.screenId
              );
              if (idx !== -1) {
                newFrames[idx] = { ...data.frame, isLoading: false };
              } else {
                newFrames.push({ ...data.frame, isLoading: false });
              }
              return newFrames;
            });
          }
          break;
        case "generation.complete":
          setLoadingStatus("completed");
          setTimeout(() => {
            setLoadingStatus("idle");
          }, 100);
          break;
        default:
          break;
      }
    });
  }, [projectId, freshData]);

  const addFrame = useCallback((frame: FrameType) => {
    setFrames((prev) => [...prev, frame]);
  }, []);

  const updateFrame = useCallback((id: string, data: Partial<FrameType>) => {
    setFrames((prev) => {
      return prev.map((frame) =>
        frame.id === id ? { ...frame, ...data } : frame
      );
    });
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        theme,
        setTheme: setThemeId,
        themes: THEME_LIST,
        font,
        setFont: setFontId,
        fonts: POPULAR_FONTS,
        frames,
        setFrames,
        selectedFrameId,
        selectedFrame,
        setSelectedFrameId,
        updateFrame,
        addFrame,
        loadingStatus,
        setLoadingStatus,
        deviceType,
        customDimensions,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used inside CanvasProvider");
  return ctx;
};
