/**
 * Infer design dimensions from prompt and optional image description.
 * Supports web (1440), mobile (430), and component/small (from image or default).
 */
const WEB_KEYWORDS = [
  "web",
  "website",
  "desktop",
  "1440",
  "browser",
  "landing page",
  "dashboard",
  "saas",
  "web app",
  "webapp",
];
const MOBILE_KEYWORDS = ["mobile", "app", "iphone", "android", "phone", "430"];
const COMPONENT_KEYWORDS = ["component", "card", "widget", "block", "small"];

export const PRESETS = {
  web: { width: 1440, height: 900 },
  mobile: { width: 430, height: 932 },
  component: { width: 400, height: 500 },
} as const;

export function inferDesignDimensions(
  prompt: string,
  imageDescription?: string,
  imageDimensions?: { width: number; height: number }
): { width: number; height: number } {
  const text = `${(prompt || "").toLowerCase()} ${(imageDescription || "").toLowerCase()}`;

  const isWeb = WEB_KEYWORDS.some((k) => text.includes(k));
  const isMobile = MOBILE_KEYWORDS.some((k) => text.includes(k));
  const isComponent = COMPONENT_KEYWORDS.some((k) => text.includes(k));

  if (isWeb) return PRESETS.web;
  if (isMobile && !isWeb) return PRESETS.mobile;
  if (isComponent && imageDimensions?.width && imageDimensions?.height) {
    const w = Math.min(Math.max(imageDimensions.width, 200), 1200);
    const h = Math.min(Math.max(imageDimensions.height, 200), 1600);
    return { width: w, height: h };
  }
  if (isComponent) return PRESETS.component;
  if (imageDimensions?.width && imageDimensions?.height) {
    const w = imageDimensions.width;
    const h = imageDimensions.height;
    if (w >= 1000) return { width: Math.min(w, 1440), height: Math.min(h, 1200) };
    if (w >= 400) return { width: w, height: h };
    return { width: Math.max(w, 400), height: Math.max(h, 500) };
  }
  return PRESETS.web;
}
