"use client";
import React, { memo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import PromptInput, { DeviceType } from "@/components/prompt-input";
import { useCreateProject, useGetProjects } from "@/features/use-project";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter } from "next/navigation";
import { DefaultProjectThumbnail } from "@/components/ui/project-thumbnail";
import { Button } from "@/components/ui/button";
import { motion, useInView, Variants } from "framer-motion";
import { openSauceOne, instrumentSerif } from "@/app/fonts";
import { getGenerationModel } from "@/constant/models";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import LandingNav from "@/components/landing/v2/nav";
import LandingHero from "@/components/landing/v2/hero";
import LandingModelsStrip from "@/components/landing/v2/models-strip";
import LandingShowcase from "@/components/landing/v2/showcase";
import LandingCapabilities from "@/components/landing/v2/capabilities";
import LandingPricing from "@/components/landing/v2/pricing";
import LandingTestimonials from "@/components/landing/v2/testimonials";
import LandingFaq from "@/components/landing/v2/faq";
import LandingCta from "@/components/landing/v2/cta";
import LandingFooter from "@/components/landing/v2/footer";
import DesignShowcase from "@/components/landing/v2/DesignShowcase";
import PremiumProcessSection from "@/components/landing/v2/Premiumprocesssection";
import LandingModels from "@/components/landing/v2/LandingModels";

// Loading state type for the design process
type LoadingState = "idle" | "enhancing" | "designing";

// Helper function to get loading text based on state
const getLoadingText = (
  state: LoadingState,
  deviceType: DeviceType,
): string | undefined => {
  switch (state) {
    case "enhancing":
      const typeLabel =
        deviceType === "web"
          ? "web app"
          : deviceType === "inspirations"
            ? "inspirations"
            : deviceType === "wireframe"
              ? "wireframe"
              : "mobile app";
      return `Enhancing for ${typeLabel}...`;
    case "designing":
      return "Generating designs...";
    default:
      return undefined;
  }
};

const SUGGESTIONS = [
  {
    label: "Finance Tracker",
    icon: "💸",
    value: `Finance app statistics screen. Current balance at top with dollar amount, bar chart showing spending over months (Oct-Mar) with month selector pills below, transaction list with app icons, amounts, and categories. Bottom navigation bar. Mobile app, single screen. Style: Dark theme, chunky rounded cards, playful but professional, modern sans-serif typography, Gen Z fintech vibe. Fun and fresh, not corporate.`,
  },
  {
    label: "Fitness Activity",
    icon: "🔥",
    value: `Fitness tracker summary screen. Large central circular progress ring showing steps and calories with neon glow. Line graph showing heart rate over time. Bottom section with grid of health metrics (Sleep, Water, SpO2). Mobile app, single screen. Style: Deep Dark Mode (OLED friendly). Pitch black background with electric neon green and vibrant blue accents. High contrast, data-heavy but organized, sleek and sporty aesthetic.`,
  },
  {
    label: "Food Delivery",
    icon: "🍔",
    value: `Food delivery home feed. Top search bar with location pin. Horizontal scrolling hero carousel of daily deals. Vertical list of restaurants with large delicious food thumbnails, delivery time badges, and rating stars. Floating Action Button (FAB) for cart. Mobile app, single screen. Style: Vibrant and Appetizing. Warm colors (orange, red, yellow), rounded card corners, subtle drop shadows to create depth. Friendly and inviting UI.`,
  },
  {
    label: "Travel Booking",
    icon: "✈️",
    value: `Travel destination detail screen. Full-screen immersive photography of a tropical beach. Bottom sheet overlay with rounded top corners containing hotel title, star rating, price per night, and a large "Book Now" button. Horizontal scroll of amenity icons. Mobile app, single screen. Style: Minimalist Luxury. ample whitespace, elegant serif typography for headings, clean sans-serif for body text. Sophisticated, airy, high-end travel vibe.`,
  },
  {
    label: "E-Commerce",
    icon: "👟",
    value: `Sneaker product page. Large high-quality product image on a light gray background. Color selector swatches, size selector grid, and a sticky "Add to Cart" button at the bottom. Title and price in bold, oversized typography. Mobile app, single screen. Style: Neo-Brutalism. High contrast, thick black outlines on buttons and cards, hard shadows (no blur), unrefined geometry, bold solid colors (yellow and black). Trendy streetwear aesthetic.`,
  },
  {
    label: "Meditation",
    icon: "🧘",
    value: `Meditation player screen. Central focus is a soft, abstract breathing bubble animation. Play/Pause controls and a time slider below. Background is a soothing solid pastel sage green. Mobile app, single screen. Style: Soft Minimal. Rounded corners on everything, low contrast text for relaxation, pastel color palette, very little UI clutter. Zen, calming, and therapeutic atmosphere.`,
  },
];

const LandingSection = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const [promptText, setPromptText] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
  const [wireframeKind, setWireframeKind] = useState<"web" | "mobile">("web");
  const [inspirationKind, setInspirationKind] = useState<"web" | "mobile">(
    "web",
  );
  const userId = user?.id;

  // Fetch limited projects initially, all projects when showAllProjects is true
  const {
    data: projects,
    isLoading,
    isError,
  } = useGetProjects(userId, showAllProjects ? undefined : 10);
  const { mutate, isPending } = useCreateProject();

  // Reset loading state when mutation completes (success redirects, error needs reset)
  React.useEffect(() => {
    if (!isPending && loadingState === "designing") {
      // Small delay to ensure we catch error states
      const timeout = setTimeout(() => {
        setLoadingState("idle");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isPending, loadingState]);

  // Load model from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("selectedModel");
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    }
  }, []);

  // Save model selection to localStorage
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", modelId);
    }
  };

  const handleSubmit = async () => {
    if (!promptText) return;
    if (!user) {
      toast.error("Please sign in to create designs.");
      router.push("/login");
      return;
    }

    try {
      // Step 1: Enhancing - Enhance the prompt with device-type-specific guidance
      setLoadingState("enhancing");

      const enhanceResponse = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          model: getGenerationModel(selectedModel),
          designType: deviceType,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      // Use enhanced prompt if available, otherwise fallback to original
      const finalPrompt = enhanceData.enhancedPrompt || promptText;

      // Step 2: Designing - Create the project with the user-selected device type
      setLoadingState("designing");

      mutate({
        prompt: finalPrompt,
        model: getGenerationModel(selectedModel),
        deviceType: deviceType,
        wireframeKind: deviceType === "wireframe" ? wireframeKind : undefined,
      });
    } catch (error) {
      console.error("Error in design process:", error);
      // Fallback to original prompt with selected device type if anything fails
      setLoadingState("designing");
      mutate({
        prompt: promptText,
        model: getGenerationModel(selectedModel),
        deviceType: deviceType,
        wireframeKind: deviceType === "wireframe" ? wireframeKind : undefined,
      });
    }
  };

  return (
    <div
      className={`w-full min-h-screen bg-background ${openSauceOne.className} ${instrumentSerif.variable}`}
    >
      <LandingNav />

      <LandingHero>
        <div className="flex w-full flex-col items-center gap-5">
          {/* Device type segmented control (glass, over the sky) */}
          <div
            role="group"
            aria-label="Design type"
            className="relative grid grid-cols-2 rounded-full border border-white/30 bg-white/15 p-1 backdrop-blur-md"
          >
            <div
              aria-hidden
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out",
                deviceType === "web" ? "translate-x-full" : "translate-x-0",
              )}
            />
            <button
              type="button"
              onClick={() => setDeviceType("mobile")}
              aria-pressed={deviceType !== "web"}
              className={cn(
                "relative z-10 whitespace-nowrap rounded-full px-6 py-2 text-center text-sm font-semibold transition-colors",
                deviceType !== "web"
                  ? "text-sky-700"
                  : "text-white/90 hover:text-white",
              )}
            >
              Mobile App
            </button>
            <button
              type="button"
              onClick={() => setDeviceType("web")}
              aria-pressed={deviceType === "web"}
              className={cn(
                "relative z-10 whitespace-nowrap rounded-full px-6 py-2 text-center text-sm font-semibold transition-colors",
                deviceType === "web"
                  ? "text-sky-700"
                  : "text-white/90 hover:text-white",
              )}
            >
              Web Platform
            </button>
          </div>

          <PromptInput
            className="shadow-2xl"
            promptText={promptText}
            setPromptText={setPromptText}
            isLoading={loadingState !== "idle" || isPending}
            loadingText={getLoadingText(loadingState, deviceType)}
            onSubmit={handleSubmit}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            deviceType={deviceType}
            onDeviceTypeChange={setDeviceType}
            wireframeKind={wireframeKind}
            onWireframeKindChange={setWireframeKind}
            inspirationKind={inspirationKind}
            onInspirationKindChange={setInspirationKind}
          />

          {/* Prompt starters */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setPromptText(s.value)}
                className="rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
              >
                <span aria-hidden className="mr-1.5">
                  {s.icon}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </LandingHero>

      {/* <LandingModelsStrip /> */}
      <LandingModels />

      {/* Recent projects (signed-in users only) */}
      {userId && (
        <section className="w-full py-10">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Recent Projects
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-10" />
              </div>
            ) : (
              <>
                <div className="mt-4">
                  {projects && projects.length <= 10 ? (
                    <ProjectsArc projects={projects} />
                  ) : (
                    <div className="grid max-h-[80vh] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
                      {projects?.map((project: ProjectType) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  )}
                </div>
                {!showAllProjects && projects && projects.length >= 9 && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllProjects(true)}
                      className="rounded-full px-6"
                    >
                      Show All Projects
                    </Button>
                  </div>
                )}
              </>
            )}

            {isError && (
              <p className="mt-4 text-sm text-red-500">
                Failed to load projects
              </p>
            )}
          </div>
        </section>
      )}

      {/* <LandingShowcase /> */}
      <DesignShowcase />
      {/* <LandingCapabilities /> */}
      <PremiumProcessSection />
      <LandingPricing />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: index * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const ProjectsArc = ({ projects }: { projects: ProjectType[] }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
    >
      {projects.map((project: ProjectType, index: number) => (
        <motion.div
          key={project.id}
          custom={index}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={cardVariants}
        >
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </div>
  );
};

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
  const router = useRouter();
  const createdAtDate = new Date(project.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  const onRoute = () => {
    router.push(`/project/${project.id}`);
  };

  return (
    <div
      role="button"
      className="flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={onRoute}
    >
      <div className="relative h-40 overflow-hidden">
        <DefaultProjectThumbnail
          projectId={project.id}
          deviceType={project.deviceType}
        />
      </div>

      <div className="flex w-full flex-col border-t border-border p-4 sm:p-5">
        <h3 className="mb-1.5 line-clamp-1 text-[15px] font-semibold leading-[1.5em] tracking-[-0.035em] text-foreground">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
});

ProjectCard.displayName = "ProjectCard";

export default LandingSection;
