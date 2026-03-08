/** Project-level app shell used to wrap frame content when composed (e.g. shared header/nav). */
export type AppShellType = {
  html?: string;
  type?: string;
  meta?: Record<string, unknown>;
};

export type ProjectType = {
  id: string;
  name: string;
  theme: string;
  deviceType?: "mobile" | "web" | "inspirations" | "wireframe";
  wireframeKind?: "web" | "mobile" | null;
  width?: number;
  height?: number;
  thumbnail?: string;
  isExplore?: boolean;
  isFavorite?: boolean;
  frames: FrameType[];
  /** Raw HTML for app shell (e.g. header/nav). Composed with frame content when frame uses shell. */
  appShellHtml?: string | null;
  appShellType?: string | null;
  appShellMeta?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt?: Date;
};

export type FrameType = {
  id: string;
  title: string;
  htmlContent: string;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  isLoading?: boolean;
  /** When true, frame content is composed with project app shell (sidebar/bottom-nav). */
  isShellComposed?: boolean;
};
