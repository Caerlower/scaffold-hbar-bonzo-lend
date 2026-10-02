import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  devIndicators: false,
  // Keep the heavy Hedera SDK out of the client/server bundler graph where possible
  serverExternalPackages: ["@hiero-ledger/sdk", "@hashgraph/proto", "@grpc/grpc-js"],
  experimental: {
    optimizePackageImports: [
      "@heroicons/react",
      "@rainbow-me/rainbowkit",
      "wagmi",
      "viem",
      "@scaffold-hbar-ui/components",
      "@scaffold-hbar-ui/hooks",
    ],
  },
  // Acknowledge Turbopack so Next stops warning; webpack config still used for `next build`
  turbopack: {},
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    if (dev) {
      // Follow yarn workspace symlinks without disabling node_modules caching
      // (empty managedPaths made every rebuild re-scan deps and felt extremely slow)
      config.watchOptions = {
        followSymlinks: true,
        ignored: ["**/node_modules/.cache/**", "**/.git/**"],
      };
    }
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@hiero-ledger/sdk": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
