// "use client";
// import React, { memo, useState } from "react";
// import { formatDistanceToNow } from "date-fns";
// import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
// import PromptInput from "@/components/prompt-input";
// import Header from "./header";
// import { useCreateProject, useGetProjects } from "@/features/use-project";
// import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
// import { Spinner } from "@/components/ui/spinner";
// import { ProjectType } from "@/types/project";
// import { useRouter } from "next/navigation";
// import { FolderOpen, FolderOpenDotIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Faq from "@/components/landing/Faq";
// import HowItWorks from "@/components/landing/HowItWorks";
// import PricingPage from "@/components/landing/PricingPage";
// import FeaturesBento from "@/components/landing/FeaturesBento";
// import { Inter_Tight } from "next/font/google";
// import { DeviceTypeModal } from "@/components/device-type-modal";
// import { BlurFade } from "@/components/ui/blur-fade";
// import ArcScrollAnimation from "@/components/landing/atoms/ArcScrollAnimaton";
// const inter = Inter_Tight({ subsets: ["latin"] });

// const LandingSection = () => {
//   const { user } = useKindeBrowserClient();
//   const [promptText, setPromptText] = useState<string>("");
//   const [selectedModel, setSelectedModel] = useState<string>(
//     "google/gemini-3-pro-preview",
//   );
//   const [showAllProjects, setShowAllProjects] = useState(false);
//   const [isEnhancing, setIsEnhancing] = useState(false);
//   const [showDeviceTypeModal, setShowDeviceTypeModal] = useState(false);
//   const [pendingPrompt, setPendingPrompt] = useState<string>("");
//   const userId = user?.id;

//   // Fetch limited projects initially, all projects when showAllProjects is true
//   const {
//     data: projects,
//     isLoading,
//     isError,
//   } = useGetProjects(userId, showAllProjects ? undefined : 10);
//   const { mutate, isPending } = useCreateProject();

//   // Load model from localStorage on mount
//   React.useEffect(() => {
//     if (typeof window !== "undefined") {
//       const savedModel = localStorage.getItem("selectedModel");
//       if (savedModel) {
//         setSelectedModel(savedModel);
//       }
//     }
//   }, []);

//   // Save model selection to localStorage
//   const handleModelChange = (modelId: string) => {
//     setSelectedModel(modelId);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("selectedModel", modelId);
//     }
//   };

//   const suggestions = [
//     {
//       label: "Finance Tracker",
//       icon: "💸",
//       value: `Finance app statistics screen. Current balance at top with dollar amount, bar chart showing spending over months (Oct-Mar) with month selector pills below, transaction list with app icons, amounts, and categories. Bottom navigation bar. Mobile app, single screen. Style: Dark theme, chunky rounded cards, playful but professional, modern sans-serif typography, Gen Z fintech vibe. Fun and fresh, not corporate.`,
//     },
//     {
//       label: "Fitness Activity",
//       icon: "🔥",
//       value: `Fitness tracker summary screen. Large central circular progress ring showing steps and calories with neon glow. Line graph showing heart rate over time. Bottom section with grid of health metrics (Sleep, Water, SpO2). Mobile app, single screen. Style: Deep Dark Mode (OLED friendly). Pitch black background with electric neon green and vibrant blue accents. High contrast, data-heavy but organized, sleek and sporty aesthetic.`,
//     },
//     {
//       label: "Food Delivery",
//       icon: "🍔",
//       value: `Food delivery home feed. Top search bar with location pin. Horizontal scrolling hero carousel of daily deals. Vertical list of restaurants with large delicious food thumbnails, delivery time badges, and rating stars. Floating Action Button (FAB) for cart. Mobile app, single screen. Style: Vibrant and Appetizing. Warm colors (orange, red, yellow), rounded card corners, subtle drop shadows to create depth. Friendly and inviting UI.`,
//     },
//     {
//       label: "Travel Booking",
//       icon: "✈️",
//       value: `Travel destination detail screen. Full-screen immersive photography of a tropical beach. Bottom sheet overlay with rounded top corners containing hotel title, star rating, price per night, and a large "Book Now" button. Horizontal scroll of amenity icons. Mobile app, single screen. Style: Minimalist Luxury. ample whitespace, elegant serif typography for headings, clean sans-serif for body text. Sophisticated, airy, high-end travel vibe.`,
//     },
//     {
//       label: "E-Commerce",
//       icon: "👟",
//       value: `Sneaker product page. Large high-quality product image on a light gray background. Color selector swatches, size selector grid, and a sticky "Add to Cart" button at the bottom. Title and price in bold, oversized typography. Mobile app, single screen. Style: Neo-Brutalism. High contrast, thick black outlines on buttons and cards, hard shadows (no blur), unrefined geometry, bold solid colors (yellow and black). Trendy streetwear aesthetic.`,
//     },
//     {
//       label: "Meditation",
//       icon: "🧘",
//       value: `Meditation player screen. Central focus is a soft, abstract breathing bubble animation. Play/Pause controls and a time slider below. Background is a soothing solid pastel sage green. Mobile app, single screen. Style: Soft Minimal. Rounded corners on everything, low contrast text for relaxation, pastel color palette, very little UI clutter. Zen, calming, and therapeutic atmosphere.`,
//     },
//   ];

//   const handleSuggestionClick = (val: string) => {
//     setPromptText(val);
//   };

//   const handleSubmit = async () => {
//     if (!promptText) return;

//     // Show device type modal first
//     setPendingPrompt(promptText);
//     setShowDeviceTypeModal(true);
//   };

//   const handleDeviceTypeSelect = async (deviceType: "web" | "mobile") => {
//     setShowDeviceTypeModal(false);

//     // Start enhancing the prompt
//     setIsEnhancing(true);

//     try {
//       const enhanceResponse = await fetch("/api/enhance-prompt", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           prompt: pendingPrompt,
//           model: selectedModel,
//         }),
//       });

//       const enhanceData = await enhanceResponse.json();

//       // Use the enhanced prompt if available, otherwise fallback to original
//       const finalPrompt = enhanceData.enhancedPrompt || pendingPrompt;

//       // Stop enhancing state, start designing
//       setIsEnhancing(false);

//       // Create project with enhanced prompt and device type
//       mutate({ prompt: finalPrompt, model: selectedModel, deviceType });
//     } catch (error) {
//       console.error("Error enhancing prompt:", error);
//       // If enhancement fails, proceed with original prompt
//       setIsEnhancing(false);
//       mutate({ prompt: pendingPrompt, model: selectedModel, deviceType });
//     }
//   };

//   return (
//     <div className=" w-full min-h-screen">
//       <DeviceTypeModal
//         open={showDeviceTypeModal}
//         onOpenChange={setShowDeviceTypeModal}
//         onSelect={handleDeviceTypeSelect}
//       />

//       <div className="flex flex-col ">
//         <Header />

//         <BlurFade>
//           <div
//             className={`relative overflow-hidden py-28 border border-zinc-900
//            ${inter.className}`}
//           >
//             <div
//               className="absolute inset-0  top-[-50]
//            z-[-1]"
//             >
//               {" "}
//             </div>
//             <div
//               className="max-w-6xl mx-auto flex flex-col
//          items-center justify-center gap-8
//         "
//             >
//               <div className="space-y-3">
//                 <h1
//                   className="text-center font-semibold text-4xl
//             tracking-tight sm:text-5xl bg-linear-to-r from-zinc-900 dark:from-white to-zinc-800 bg-clip-text text-transparent pb-1
//             "
//                 >
//                   Design mobile & web apps <br className="md:hidden" />
//                   <span className="text-primary">in minutes</span>
//                 </h1>

//                 <div className="mx-auto max-w-2xl ">
//                   <p className="text-center font-normal text-foreground leading-relaxed sm:text-lg">
//                     Go from idea to beautiful mobile or web mockups in minutes
//                     by chatting with AI.
//                   </p>
//                 </div>
//               </div>

//               <div
//                 className="flex w-full max-w-3xl flex-col
//             item-center gap-8 relative
//             "
//               >
//                 <div className="w-full">
//                   <PromptInput
//                     className=""
//                     promptText={promptText}
//                     setPromptText={setPromptText}
//                     isLoading={isEnhancing || isPending}
//                     loadingText={
//                       isEnhancing
//                         ? "Enhancing..."
//                         : isPending
//                           ? "Designing..."
//                           : undefined
//                     }
//                     onSubmit={handleSubmit}
//                     selectedModel={selectedModel}
//                     onModelChange={handleModelChange}
//                   />
//                 </div>

//                 <div className="flex flex-wrap justify-center">
//                   <Suggestions>
//                     {suggestions.map((s) => (
//                       <Suggestion
//                         key={s.label}
//                         suggestion={s.label}
//                         className="text-sm! h-7!   dark:bg-zinc-900 border border-zinc-900
//                       "
//                         onClick={() => handleSuggestionClick(s.value)}
//                       >
//                         {s.icon}
//                         <span>{s.label}</span>
//                       </Suggestion>
//                     ))}
//                   </Suggestions>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </BlurFade>
//         <div className="w-full py-10 border-x border-zinc-900">
//           <div className="mx-auto max-w-3xl">
//             {userId && (
//               <div>
//                 <h1
//                   className="font-medium text-xl
//               tracking-tight
//               "
//                 >
//                   Recent Projects
//                 </h1>

//                 {isLoading ? (
//                   <div
//                     className="flex items-center
//                   justify-center py-2
//                   "
//                   >
//                     <Spinner className="size-10" />
//                   </div>
//                 ) : (
//                   <>
//                     <div
//                       className="grid grid-cols-1 sm:grid-cols-2
//                     md:grid-cols-3 gap-3 mt-3
//                       "
//                     >
//                       {projects?.map((project: ProjectType) => (
//                         <ProjectCard key={project.id} project={project} />
//                       ))}
//                     </div>
//                     {!showAllProjects && projects && projects.length >= 9 && (
//                       <div className="flex justify-center mt-6">
//                         <Button
//                           variant="outline"
//                           onClick={() => setShowAllProjects(true)}
//                           className="px-6 rounded-none"
//                         >
//                           Show All Projects
//                         </Button>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//             )}

//             {isError && <p className="text-red-500">Failed to load projects</p>}
//           </div>
//         </div>
//       </div>
//       <ArcScrollAnimation />
//       <FeaturesBento />
//       <PricingPage />
//       <HowItWorks />
//       <Faq />
//     </div>
//   );
// };

// const ProjectCard = memo(({ project }: { project: ProjectType }) => {
//   const router = useRouter();
//   const createdAtDate = new Date(project.createdAt);
//   const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
//   const thumbnail = project.thumbnail || null;

//   const onRoute = () => {
//     router.push(`/project/${project.id}`);
//   };

//   return (
//     <div
//       role="button"
//       className="w-full flex flex-col border border-zinc-900 rounded-none cursor-pointer
//     hover:shadow-sm overflow-hidden
//     "
//       onClick={onRoute}
//     >
//       <div
//         className="h-40 bg-[#eee] dark:bg-zinc-800 relative overflow-hidden
//         flex items-center justify-center
//         "
//       >
//         {thumbnail ? (
//           <img
//             src={thumbnail}
//             className="w-full h-full object-cover object-left
//            scale-110
//           "
//           />
//         ) : (
//           <div
//             className="w-16 h-16 rounded-full
//               flex items-center justify-center text-primary
//             "
//           >
//             <FolderOpen strokeWidth={1.25} className="text-white" size={40} />
//           </div>
//         )}
//       </div>

//       <div className="p-4 flex flex-col">
//         <h3
//           className="font-medium
//          text-sm truncate w-full mb-1 line-clamp-1"
//         >
//           {project.name}
//         </h3>
//         <p className="text-xs text-muted-foreground">{timeAgo}</p>
//       </div>
//     </div>
//   );
// });

// ProjectCard.displayName = "ProjectCard";

// export default LandingSection;
"use client";
import React, { memo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import PromptInput from "@/components/prompt-input";
import Header from "./header";
import { useCreateProject, useGetProjects } from "@/features/use-project";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter } from "next/navigation";
import { FolderOpenDotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Faq from "@/components/landing/Faq";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingPage from "@/components/landing/PricingPage";
import FeaturesBento from "@/components/landing/FeaturesBento";
import { Inter_Tight } from "next/font/google";
import { motion, useInView, Variants } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import TrustedBy from "@/components/landing/atoms/TrustedBy";
import FooterDemo from "@/components/landing/Footer";
import ExploreTemplates from "@/components/landing/ExploreTemplates";
const inter = Inter_Tight({ subsets: ["latin"] });

// Loading state type for the design process
type LoadingState = "idle" | "thinking" | "enhancing" | "designing";

// Helper function to get loading text based on state
const getLoadingText = (
  state: LoadingState,
  designType: string | null,
): string | undefined => {
  switch (state) {
    case "thinking":
      return "Analyzing your idea...";
    case "enhancing":
      const typeLabel =
        designType === "web"
          ? "web app"
          : designType === "creative"
            ? "creative"
            : "mobile app";
      return `Enhancing for ${typeLabel}...`;
    case "designing":
      return "Generating designs...";
    default:
      return undefined;
  }
};

const LandingSection = () => {
  const { user } = useKindeBrowserClient();
  const [promptText, setPromptText] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    "google/gemini-3-pro-preview",
  );
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [detectedDesignType, setDetectedDesignType] = useState<string | null>(
    null,
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

  const suggestions = [
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

  const handleSuggestionClick = (val: string) => {
    setPromptText(val);
  };

  const handleSubmit = async () => {
    if (!promptText) return;

    try {
      // Step 1: Thinking - Analyze the prompt to detect design type
      setLoadingState("thinking");
      setDetectedDesignType(null);

      const analyzeResponse = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel,
        }),
      });

      const analyzeData = await analyzeResponse.json();
      const designType = analyzeData.designType || "mobile";
      setDetectedDesignType(designType);

      // Step 2: Enhancing - Enhance the prompt with design-type-specific guidance
      setLoadingState("enhancing");

      const enhanceResponse = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel,
          designType: designType,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      // Use enhanced prompt if available, otherwise fallback to original
      const finalPrompt = enhanceData.enhancedPrompt || promptText;

      // Step 3: Designing - Create the project
      setLoadingState("designing");

      // Map creative to the appropriate device type
      // Creative designs can be mobile-sized (App Store screenshots) or custom
      const deviceType =
        designType === "web"
          ? "web"
          : designType === "creative"
            ? "creative"
            : "mobile";

      // Then create the project with enhanced prompt and detected device type
      mutate({
        prompt: finalPrompt,
        model: selectedModel,
        deviceType: deviceType,
        dimensions: analyzeData.dimensions,
      });
    } catch (error) {
      console.error("Error in design process:", error);
      // Fallback to original prompt with mobile design if anything fails
      setLoadingState("designing");
      mutate({
        prompt: promptText,
        model: selectedModel,
        deviceType: "mobile",
      });
    }
  };

  return (
    <div className=" w-full min-h-screen">
      <div className="flex flex-col ">
        <Header />
        <BlurFade>
          <div
            className={`relative overflow-hidden py-28 border border-zinc-900
           ${inter.className}`}
          >
            <div className="absolute inset-0 z-[-1]"></div>
            <div
              className="max-w-6xl mx-auto flex flex-col
         items-center justify-center gap-8 
        "
            >
              <div className="space-y-3">
                <h1
                  className="text-center font-semibold text-4xl
            tracking-tight sm:text-5xl bg-linear-to-r from-zinc-900 dark:from-white to-zinc-800 bg-clip-text text-transparent pb-1
            "
                >
                  Design apps & creatives <br className="md:hidden" />
                  <span className="text-primary">in minutes</span>
                </h1>
                <div className="mx-auto max-w-2xl ">
                  <p className="text-center font-normal text-foreground leading-relaxed sm:text-lg">
                    Go from idea to beautiful mobile, web, or App Store designs
                    in minutes by chatting with AI.
                  </p>
                </div>
              </div>

              <div
                className="flex w-full max-w-3xl flex-col
            item-center gap-8 relative 
            "
              >
                <div className="w-full">
                  <PromptInput
                    className=""
                    promptText={promptText}
                    setPromptText={setPromptText}
                    isLoading={loadingState !== "idle" || isPending}
                    loadingText={getLoadingText(
                      loadingState,
                      detectedDesignType,
                    )}
                    onSubmit={handleSubmit}
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                  />
                </div>

                <div className="flex flex-wrap justify-center">
                  <Suggestions>
                    {suggestions.map((s) => (
                      <Suggestion
                        key={s.label}
                        suggestion={s.label}
                        className="text-sm! h-7!   dark:bg-zinc-900 border border-zinc-900
                      "
                        onClick={() => handleSuggestionClick(s.value)}
                      >
                        {s.icon}
                        <span>{s.label}</span>
                      </Suggestion>
                    ))}
                  </Suggestions>
                </div>
              </div>
            </div>
          </div>
        </BlurFade>
        <TrustedBy />
        <div className="w-full py-10 border-x border-zinc-900">
          <div className="mx-auto max-w-3xl">
            {userId && (
              <div>
                <h1
                  className="font-medium text-xl
              tracking-tight
              "
                >
                  Recent Projects
                </h1>

                {isLoading ? (
                  <div
                    className="flex items-center
                  justify-center py-2
                  "
                  >
                    <Spinner className="size-10" />
                  </div>
                ) : (
                  <>
                    <div className="mt-3">
                      {projects && projects.length <= 10 ? (
                        <ProjectsArc projects={projects} />
                      ) : (
                        <div
                          className="grid grid-cols-1 sm:grid-cols-2
                    md:grid-cols-3 gap-3 overflow-y-auto max-h-[80vh]"
                        >
                          {projects?.map((project: ProjectType) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                        </div>
                      )}
                    </div>
                    {!showAllProjects && projects && projects.length >= 9 && (
                      <div className="flex justify-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllProjects(true)}
                          className="px-6 rounded-none"
                        >
                          Show All Projects
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {isError && <p className="text-red-500">Failed to load projects</p>}
          </div>
        </div>
      </div>

      {/* <FeaturesBento /> */}
      <ExploreTemplates />
      <PricingPage />
      <HowItWorks />
      <Faq />
      <FooterDemo />
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
      ease: [0.22, 1, 0.36, 1], // Custom ease for futuristic feel
    },
  }),
};

const ProjectsArc = ({ projects }: { projects: ProjectType[] }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
    >
      {projects.map((project: ProjectType, index: number) => (
        <motion.div
          key={project.id}
          custom={index}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={cardVariants}
          whileHover={{ scale: 1.05, transition: { duration: 0.3 } }} // Subtle hover for modern feel
          className="relative overflow-hidden" // Add futuristic glow on hover via CSS
          style={
            { "--glow-color": "rgba(0, 255, 255, 0.2)" } as React.CSSProperties
          } // Cyan glow for futuristic
        >
          <style>{`
            .relative.overflow-hidden:hover {
              box-shadow: 0 0 15px var(--glow-color);
            }
          `}</style>
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
  const thumbnail = project.thumbnail || null;

  const onRoute = () => {
    router.push(`/project/${project.id}`);
  };

  return (
    <div
      role="button"
      className="w-full flex flex-col border border-zinc-900 rounded-none cursor-pointer
    hover:shadow-sm overflow-hidden
    "
      onClick={onRoute}
    >
      <div
        className="h-40 bg-[#eee] dark:bg-zinc-800 relative overflow-hidden
        flex items-center justify-center
        "
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            className="w-full h-full object-cover object-left
           scale-110
          "
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full
              flex items-center justify-center text-primary
            "
          >
            <FolderOpenDotIcon className="text-white" size={36} />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col">
        <h3
          className="font-medium
         text-sm truncate w-full mb-1 line-clamp-1"
        >
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
});

ProjectCard.displayName = "ProjectCard";

export default LandingSection;
