import "server-only";
import sharp from "sharp";

/** Parse a base64 data URL into bytes + mime type. */
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma === -1) {
    throw new Error("Not a data URL");
  }
  const header = dataUrl.slice(5, comma); // e.g. image/png;base64
  const mimeType = header.split(";")[0] || "application/octet-stream";
  const buffer = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return { buffer, mimeType };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Normalise a user upload: re-encode as PNG (strips metadata, neutralises
 * malformed files), downscale to `maxEdge`, keep alpha for logos.
 */
export async function normalizeUploadedImage(
  input: Buffer,
  opts: { maxEdge: number },
): Promise<{ buffer: Buffer; width: number; height: number; dataUrl: string }> {
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 })
    .rotate() // honour EXIF orientation
    .resize({
      width: opts.maxEdge,
      height: opts.maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 8 });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    dataUrl: bufferToDataUrl(data, "image/png"),
  };
}

/** Compress a rendered PNG for storage/display on the canvas. */
export async function pngToWebpDataUrl(
  png: Buffer,
  quality = 92,
): Promise<{ dataUrl: string; width: number; height: number; bytes: number }> {
  const { data, info } = await sharp(png)
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return {
    dataUrl: bufferToDataUrl(data, "image/webp"),
    width: info.width,
    height: info.height,
    bytes: data.length,
  };
}

/** Small preview used for the project thumbnail. */
export async function makeThumbnail(png: Buffer, width = 480): Promise<string> {
  const data = await sharp(png)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return bufferToDataUrl(data, "image/webp");
}

/**
 * Fit a rendered screen to an exact store size.
 *
 * - If the aspect ratios are within 2.5% the image is simply resized (cover).
 * - Otherwise the image is fitted inside the target and the remaining bands are
 *   filled with a heavily blurred, stretched copy of the image itself, which
 *   continues the background gradient seamlessly instead of adding flat bars.
 */
export async function fitToStoreSize(
  input: Buffer,
  target: { width: number; height: number },
): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const srcW = meta.width ?? target.width;
  const srcH = meta.height ?? target.height;
  const srcAspect = srcW / srcH;
  const dstAspect = target.width / target.height;
  const diff = Math.abs(srcAspect - dstAspect) / dstAspect;

  if (diff <= 0.025) {
    return sharp(input)
      .resize(target.width, target.height, { fit: "cover", kernel: "lanczos3" })
      .png({ compressionLevel: 6 })
      .toBuffer();
  }

  const foreground = await sharp(input)
    .resize(target.width, target.height, { fit: "inside", kernel: "lanczos3" })
    .png()
    .toBuffer();
  const fgMeta = await sharp(foreground).metadata();

  const background = await sharp(input)
    .resize(target.width, target.height, { fit: "fill" })
    .blur(60)
    .modulate({ brightness: 0.98 })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([
      {
        input: foreground,
        left: Math.round((target.width - (fgMeta.width ?? target.width)) / 2),
        top: Math.round((target.height - (fgMeta.height ?? target.height)) / 2),
      },
    ])
    .png({ compressionLevel: 6 })
    .toBuffer();
}
