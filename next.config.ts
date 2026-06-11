import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ideation engine reads config/ via fs at runtime — make sure those files
  // are traced into the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/api/ideation/**": ["./config/**"],
  },

  // Allow images from external sources (company logos, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Security headers for iframe embedding
  async headers() {
    return [
      {
        source: "/room/:slug*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://trust.linkrunner.io https://calendly.com",
              "connect-src 'self' https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
