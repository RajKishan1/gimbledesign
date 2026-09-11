import { BASE_VARIABLES, OCEAN_BREEZE_THEME } from "./themes";
import { FontOption, DEFAULT_FONT, getFontById } from "@/constant/fonts";
import type { AppShellType } from "@/types/project";

export function getHTMLWrapper(
  html: string,
  title = "Untitled",
  theme_style?: string,
  frameId?: string,
  options?: {
    previewMode?: boolean;
    /** Conservative layout fallback for legacy HTML in device previews only. */
    responsivePreview?: boolean;
    font?: FontOption /** When same frame is shown in multiple viewports (e.g. responsive wireframe), use a unique id so each viewport's height is applied only to that instance */;
    heightMessageId?: string;
    /** When provided, frame content is composed inside the shell (e.g. shell contains {{content}} placeholder). */
    appShell?: AppShellType;
  }
) {
  const finalTheme = theme_style || OCEAN_BREEZE_THEME;
  const isPreview = options?.previewMode || false;
  const selectedFont = options?.font || getFontById(DEFAULT_FONT);
  const heightId = options?.heightMessageId ?? frameId ?? "";
  const appShell = options?.appShell;
  const frameContent =
    appShell?.html != null && appShell.html !== ""
      ? appShell.html.replace(/\{\{\s*content\s*\}\}/gi, html)
      : html;
  // Authored responsive layouts always win. Never rewrite persisted HTML.
  const useLegacyReflow = options?.responsivePreview &&
    !/(?:@media|@container|(?:sm|md|lg|xl|2xl):)/.test(frameContent);

  // For preview mode, allow natural content flow and scrolling
  const previewStyles = isPreview
    ? `
    html, body { 
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    #root { 
      width: 100% !important;
      min-height: 100vh !important;
    }
    #root > div { 
      width: 100% !important;
      min-height: 100% !important;
    }
  `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>

  <!-- Google Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
${
  selectedFont
    ? `  <link href="${selectedFont.googleFontUrl}" rel="stylesheet">`
    : ""
}
  
  <!-- Keep existing fonts for backward compatibility -->
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet">

  <!-- Tailwind + Iconify -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>


  <style type="text/tailwindcss">
    :root {${BASE_VARIABLES}${finalTheme}}
    *, *::before, *::after {margin:0;padding:0;box-sizing:border-box;}
    html, body {width:100%;min-height:100%;}
    body {font-family:"${
      selectedFont?.family || "Plus Jakarta Sans"
    }", sans-serif;background:var(--background);color:var(--foreground);-webkit-font-smoothing:antialiased;}
    #root {width:100%;min-height:100vh;}
    * {scrollbar-width:none;-ms-overflow-style:none;}
    *::-webkit-scrollbar {display:none;}
    ${previewStyles}
  </style>
  ${useLegacyReflow ? `<style>
    @media (max-width: 1279px) {
      [data-preview-grid] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 767px) {
      [data-preview-grid] { grid-template-columns: minmax(0, 1fr) !important; }
    }
    @media (max-width: 1023px) {
      [data-preview-sidebar] { position: static !important; width: 100% !important; height: auto !important; }
      [data-preview-shell] { flex-direction: column !important; }
      [data-preview-main] { margin-left: 0 !important; min-width: 0 !important; width: 100% !important; }
    }
  </style>` : ""}
</head>
<body>
  <div id="root">
  <div class="relative">
    ${frameContent}
  </div>
  </div>
  <script>
    (()=>{
      const fid=${JSON.stringify(heightId).replace(/</g, "\\u003c")};
      const root=document.getElementById('root');
      if (${!!useLegacyReflow}) {
        root.querySelectorAll('[class]').forEach(el=>{
          const tokens=Array.from(el.classList);
          if (tokens.includes('grid') && tokens.some(t=>/^grid-cols-[2-9]$/.test(t))) el.dataset.previewGrid='';
          if (tokens.includes('fixed') && tokens.includes('w-64') && tokens.includes('left-0')) {
            el.dataset.previewSidebar='';
            el.parentElement.dataset.previewShell='';
          }
          if (tokens.includes('ml-64')) el.dataset.previewMain='';
        });
      }
      let lastHeight=0;
      let pending=false;
      const send=()=>{
        pending=false;
        const r=root?.firstElementChild;
        const h=Math.ceil(Math.max(r?.scrollHeight||0,r?.getBoundingClientRect().height||0,300));
        if(h!==lastHeight) {
          lastHeight=h;
          parent.postMessage({type:'FRAME_HEIGHT',frameId:fid,height:h},'*');
        }
      };
      const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(send);}};
      const observer=new ResizeObserver(schedule);
      if(root?.firstElementChild) observer.observe(root.firstElementChild);
      window.addEventListener('resize',schedule);
      document.addEventListener('load',schedule,true);
      document.fonts?.ready.then(schedule);
      schedule();
    })();
  </script>


</body>
</html>`;
}
