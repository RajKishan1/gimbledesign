"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Types for prototype links
export interface PrototypeLink {
  id: string;
  fromScreenId: string;
  fromElementId: string;
  toScreenId: string;
}

// Canvas modes
export type CanvasMode = "design" | "prototype";

// Linking state when user is creating a new connection
export interface LinkingState {
  isLinking: boolean;
  fromScreenId: string | null;
  fromElementId: string | null;
  fromElementRect: DOMRect | null;
  clickPosition: { x: number; y: number } | null;
  mousePosition: { x: number; y: number } | null;
}

interface PrototypeContextType {
  // Mode
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;

  // Links
  links: PrototypeLink[];
  addLink: (link: Omit<PrototypeLink, "id">) => void;
  removeLink: (linkId: string) => void;
  clearLinks: () => void;
  getLinksFromScreen: (screenId: string) => PrototypeLink[];
  getLinksToScreen: (screenId: string) => PrototypeLink[];
  getLinkByElement: (screenId: string, elementId: string) => PrototypeLink | undefined;

  // Linking state (when creating new links)
  linkingState: LinkingState;
  startLinking: (screenId: string, elementId: string, elementRect: DOMRect, clickPosition: { x: number; y: number }) => void;
  updateLinkingPosition: (x: number, y: number) => void;
  finishLinking: (toScreenId: string) => void;
  cancelLinking: () => void;

  // Screen positions for connector drawing
  screenPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  updateScreenPosition: (screenId: string, position: { x: number; y: number; width: number; height: number }) => void;

  // Selected link for editing
  selectedLinkId: string | null;
  setSelectedLinkId: (id: string | null) => void;
}

const PrototypeContext = createContext<PrototypeContextType | undefined>(undefined);

// Storage key for prototype links
const getLinksStorageKey = (projectId: string) => `prototype-links-${projectId}`;

export const PrototypeProvider = ({
  children,
  initialLinks = [],
  projectId,
}: {
  children: ReactNode;
  initialLinks?: PrototypeLink[];
  projectId?: string;
}) => {
  const [mode, setMode] = useState<CanvasMode>("design");
  const [links, setLinks] = useState<PrototypeLink[]>(initialLinks);
  const [linkingState, setLinkingState] = useState<LinkingState>({
    isLinking: false,
    fromScreenId: null,
    fromElementId: null,
    fromElementRect: null,
    clickPosition: null,
    mousePosition: null,
  });
  const [screenPositions, setScreenPositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Load links from localStorage on mount
  useEffect(() => {
    if (!projectId) return;
    
    const stored = localStorage.getItem(getLinksStorageKey(projectId));
    if (stored) {
      try {
        const parsedLinks = JSON.parse(stored);
        if (Array.isArray(parsedLinks)) {
          setLinks(parsedLinks);
        }
      } catch (e) {
        console.error("Failed to parse stored links:", e);
      }
    }
  }, [projectId]);

  // Persist links to localStorage whenever they change
  useEffect(() => {
    if (!projectId) return;
    
    localStorage.setItem(getLinksStorageKey(projectId), JSON.stringify(links));
  }, [links, projectId]);

  // Generate unique ID for links
  const generateLinkId = () => `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addLink = useCallback((link: Omit<PrototypeLink, "id">) => {
    // Check if link already exists for this element
    const existingLink = links.find(
      (l) => l.fromScreenId === link.fromScreenId && l.fromElementId === link.fromElementId
    );
    
    if (existingLink) {
      // Update existing link
      setLinks((prev) =>
        prev.map((l) =>
          l.id === existingLink.id ? { ...l, toScreenId: link.toScreenId } : l
        )
      );
    } else {
      // Add new link
      setLinks((prev) => [...prev, { ...link, id: generateLinkId() }]);
    }
  }, [links]);

  const removeLink = useCallback((linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    if (selectedLinkId === linkId) {
      setSelectedLinkId(null);
    }
  }, [selectedLinkId]);

  const clearLinks = useCallback(() => {
    setLinks([]);
    setSelectedLinkId(null);
  }, []);

  const getLinksFromScreen = useCallback(
    (screenId: string) => links.filter((l) => l.fromScreenId === screenId),
    [links]
  );

  const getLinksToScreen = useCallback(
    (screenId: string) => links.filter((l) => l.toScreenId === screenId),
    [links]
  );

  const getLinkByElement = useCallback(
    (screenId: string, elementId: string) =>
      links.find((l) => l.fromScreenId === screenId && l.fromElementId === elementId),
    [links]
  );

  const startLinking = useCallback((screenId: string, elementId: string, elementRect: DOMRect, clickPosition: { x: number; y: number }) => {
    setLinkingState({
      isLinking: true,
      fromScreenId: screenId,
      fromElementId: elementId,
      fromElementRect: elementRect,
      clickPosition: clickPosition,
      mousePosition: null,
    });
  }, []);

  const updateLinkingPosition = useCallback((x: number, y: number) => {
    setLinkingState((prev) => ({
      ...prev,
      mousePosition: { x, y },
    }));
  }, []);

  const finishLinking = useCallback((toScreenId: string) => {
    if (linkingState.fromScreenId && linkingState.fromElementId && toScreenId !== linkingState.fromScreenId) {
      addLink({
        fromScreenId: linkingState.fromScreenId,
        fromElementId: linkingState.fromElementId,
        toScreenId,
      });
    }
    setLinkingState({
      isLinking: false,
      fromScreenId: null,
      fromElementId: null,
      fromElementRect: null,
      clickPosition: null,
      mousePosition: null,
    });
  }, [linkingState.fromScreenId, linkingState.fromElementId, addLink]);

  const cancelLinking = useCallback(() => {
    setLinkingState({
      isLinking: false,
      fromScreenId: null,
      fromElementId: null,
      fromElementRect: null,
      clickPosition: null,
      mousePosition: null,
    });
  }, []);

  const updateScreenPosition = useCallback(
    (screenId: string, position: { x: number; y: number; width: number; height: number }) => {
      setScreenPositions((prev) => {
        const newMap = new Map(prev);
        newMap.set(screenId, position);
        return newMap;
      });
    },
    []
  );

  return (
    <PrototypeContext.Provider
      value={{
        mode,
        setMode,
        links,
        addLink,
        removeLink,
        clearLinks,
        getLinksFromScreen,
        getLinksToScreen,
        getLinkByElement,
        linkingState,
        startLinking,
        updateLinkingPosition,
        finishLinking,
        cancelLinking,
        screenPositions,
        updateScreenPosition,
        selectedLinkId,
        setSelectedLinkId,
      }}
    >
      {children}
    </PrototypeContext.Provider>
  );
};

export const usePrototype = () => {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error("usePrototype must be used inside PrototypeProvider");
  return ctx;
};
