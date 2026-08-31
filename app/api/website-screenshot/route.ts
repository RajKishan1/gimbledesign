/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import sharp from "sharp";

// Capture a live website as a JPEG so the AI can use it as a design
// reference (generation models cannot fetch URLs themselves).

const MAX_IMAGE_WIDTH = 1024;
const IMAGE_QUALITY = 70;

// Cache the Chromium executable path to avoid re-downloading
let cachedExecutablePath: string | null = null;
let downloadPromise: Promise<string> | null = null;

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
        return path;
      })
      .catch((error) => {
        downloadPromise = null;
        throw error;
      });
  }

  return downloadPromise;
}

/** Reject non-http(s) URLs and obvious private/internal targets (SSRF guard). */
function isUrlAllowed(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "[::1]" ||
    host === "0.0.0.0"
  ) {
    return false;
  }
  // Private IPv4 ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return false;
    }
  }
  return true;
}

export async function POST(req: Request) {
  let browser;

  try {
    const { url, device = "web" } = await req.json();
    const session = await getSession(await headers());
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof url !== "string" || !isUrlAllowed(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = !!process.env.VERCEL;

    let puppeteer: any;
    let launchOptions: any = { headless: true };

    if (isProduction && isVercel) {
      const chromium = (await import("@sparticuz/chromium-min")).default;
      puppeteer = await import("puppeteer-core");
      const executablePath = await getChromiumPath();
      launchOptions = { ...launchOptions, args: chromium.args, executablePath };
    } else {
      puppeteer = await import("puppeteer");
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    const isMobile = device === "mobile";
    await page.setViewport({
      width: isMobile ? 393 : 1440,
      height: isMobile ? 852 : 1200,
      deviceScaleFactor: 1,
      isMobile,
      hasTouch: isMobile,
    });
    await page.setUserAgent(
      isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 25_000 });
    // Small settle for lazy images / fonts / entrance animations.
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    const rawJpeg = (await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage: false,
    })) as Buffer;

    const resized = await sharp(rawJpeg)
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
      .toBuffer();

    return NextResponse.json({
      dataUrl: `data:image/jpeg;base64,${resized.toString("base64")}`,
    });
  } catch (error) {
    console.error("Website screenshot failed:", error);
    return NextResponse.json(
      { error: "Failed to capture the website" },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close();
  }
}
