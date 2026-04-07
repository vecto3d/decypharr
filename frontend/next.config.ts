import type { NextConfig } from "next";

const isExport = process.env.BUILD_MODE === "export";

const nextConfig: NextConfig = isExport
  ? {
      output: "export",
      distDir: "out",
    }
  : {
      // Dev mode: proxy API to Go backend
      async rewrites() {
        return [
          { source: "/api/:path*", destination: "http://localhost:8282/api/:path*" },
          { source: "/debug/:path*", destination: "http://localhost:8282/debug/:path*" },
          { source: "/version", destination: "http://localhost:8282/version" },
          { source: "/skip-auth", destination: "http://localhost:8282/skip-auth" },
        ];
      },
    };

export default nextConfig;
