import type { NextConfig } from "next";

// BASE_PATH=/spending pnpm build  -> the site is served under swissdata-platform.ch/spending/
// Without it the site sits at the root of its own address (a subdomain, or the local preview).
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
