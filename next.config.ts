import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this app. A lockfile in a parent directory can
  // otherwise make Next watch the entire user folder and fail on Windows.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
