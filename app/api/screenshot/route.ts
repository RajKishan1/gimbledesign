/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import sharp from "sharp";

// Max width for stored card thumbnails. Cards render ~270px wide; 640 covers
// Retina / high-DPI without bloating the DB / JSON payload.
const THUMBNAIL_MAX_WIDTH = 640;
const THUMBNAIL_QUALITY = 65;
// Cache the Chromium executable path to avoid re-downloading
let cachedExecutablePath: string | null = null;
let downloadPromise: Promise<string> | null = null;

/**
 * Gets and caches the Chromium executable path
 */
async function getChromiumPath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;

  if (!downloadPromise) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    downloadPromise = chromium
      .executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar",
      )
      .then((path) => {
        cachedExecutablePath = path;
        console.log("Chromium path cached:", path);
        return path;
      })
      .catch((error) => {
        console.error("Failed to get Chromium path:", error);
        downloadPromise = null;
        throw error;
      });
  }

  return downloadPromise;
}

export async function POST(req: Request) {
  let browser;

  try {
    const { html, width = 800, height = 600, projectId } = await req.json();
    const session = await getSession(await headers());
    const user = session?.user;

    if (!user) throw new Error("Unauthorized");
    const userId = user.id;

    //Detect environment
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = !!process.env.VERCEL;

    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
    };

    if (isProduction && isVercel) {
      const chromium = (await import("@sparticuz/chromium-min")).default;
      puppeteer = await import("puppeteer-core");
      const executablePath = await getChromiumPath();

      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath,
      };
    } else {
      puppeteer = await import("puppeteer");
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    //set View port size — use 1x scale for thumbnails (smaller file size)
    await page.setViewport({
      width: Number(width),
      height: Number(height),
      deviceScaleFactor: 1,
    });

    //Set HTML Content
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    //Screenshot

    // For thumbnails (projectId provided): capture as JPEG then downscale with
    // sharp so we only store a small, card-sized image (typically ~5-20KB).
    // This keeps /api/project and /api/explore JSON responses small and makes
    // image decode on the dashboard much cheaper.
    if (projectId) {
      const rawJpeg = (await page.screenshot({
        type: "jpeg",
        quality: 85,
        fullPage: false,
      })) as Buffer;

      const resizedBuffer = await sharp(rawJpeg)
        .resize({
          width: THUMBNAIL_MAX_WIDTH,
          withoutEnlargement: true,
          fit: "inside",
        })
        .jpeg({ quality: THUMBNAIL_QUALITY, mozjpeg: true })
        .toBuffer();

      const base64 = resizedBuffer.toString("base64");
      await prisma.project.update({
        where: {
          id: projectId,
          userId,
        },
        data: {
          thumbnail: `data:image/jpeg;base64,${base64}`,
        },
      });

      return NextResponse.json({ base64 });
    }

    const buffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Failed to screenshot",
      },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close();
  }
}
