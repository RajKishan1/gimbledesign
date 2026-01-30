export type ProjectType = {
  id: string;
  name: string;
  theme: string;
  deviceType?: "mobile" | "web" | "inspirations";
  thumbnail?: string;
  frames: FrameType[];
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
};
