/** @type {import('next').NextConfig} */

// Determine if this is a build for Capacitor
const isCapacitorBuild = process.env.BUILD_TARGET === 'capacitor';

import { readFileSync } from 'fs';
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const nextConfig = {
  // Only add the 'export' output setting if we're building for Capacitor
  output: isCapacitorBuild ? 'export' : undefined,

  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_GITHUB_REPO: 'joe123-crypto/project-genie',
  },

  // Globally disable image optimization to prevent timeout errors.
  // The browser will load images directly from the source URL.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-834238b2621b47418e041ed28b117c2f.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Add CORS headers to allow requests from your Android app
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Be more specific in production
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig;
