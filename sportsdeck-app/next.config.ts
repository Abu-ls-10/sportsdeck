import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Absolute app root (where package.json + node_modules live). Stops Turbopack from resolving CSS deps from the parent `PP2/PP2` folder. */
const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  turbopack: {
    root: appDir,
    resolveAlias: {
      tailwindcss: path.join(appDir, "node_modules/tailwindcss"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.join(appDir, "node_modules/tailwindcss"),
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crests.football-data.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.football-data.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;