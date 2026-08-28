import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["pdfkit", "unpdf", "docx"],
  outputFileTracingIncludes: {
    "/*": ["./instruction/**/*", "./assets/**/*"],
  },
};

export default nextConfig;
