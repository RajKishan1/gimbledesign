import { v2 as cloudinary } from "cloudinary";

/**
 * Centralized Cloudinary SDK setup. Server-side only — DO NOT import
 * from a "use client" component (the secret would leak).
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * (Optional, for `next-cloudinary`'s <CldImage> on the client:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME — same value as CLOUDINARY_CLOUD_NAME.)
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
