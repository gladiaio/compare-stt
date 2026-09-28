import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const BASE_PATH = "/speech-to-text-api-comparison";
const LEGACY_BASE_PATH = "/compare-stt-apis";
/** Canonical public URL on www.gladia.io (requires marketing vercel rewrite). */
const PUBLIC_APP_URL = `https://www.gladia.io${BASE_PATH}`;
/**
 * Same-origin app URL on compare-stt.com. Legacy redirects MUST land here —
 * never only on gladia.io — so a missing/outdated marketing rewrite cannot
 * 404-loop the arena (MAR-101).
 */
const SAME_ORIGIN_APP_URL = `https://compare-stt.com${BASE_PATH}`;

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  // Keep URLs without a trailing slash. With basePath, Next still requests the
  // index as "/speech-to-text-api-comparison/" for RSC; see BasePathFetchFix. On
  // www.gladia.io that slash path is not rewritten to this app (Webflow
  // catch-all), so we also avoid emitting trailing-slash HTML links.
  trailingSlash: false,
  // Required for PostHog ingest proxy (API paths use trailing slashes).
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
      { protocol: "https", hostname: "www.coval.ai" },
      { protocol: "https", hostname: "coval.ai" },
      { protocol: "https", hostname: "deepgram.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "huggingface.co" },
      { protocol: "https", hostname: "cdn-thumbnails.huggingface.co" },
      { protocol: "https", hostname: "artificialanalysis.ai" },
      { protocol: "https", hostname: "nextlevel.ai" },
      { protocol: "https", hostname: "krisp.ai" },
      { protocol: "https", hostname: "hackernoon.imgix.net" },
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "substack-post-media.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "soniox.com" },
      { protocol: "https", hostname: "openrouter.ai" },
    ],
  },
  async redirects() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: LEGACY_BASE_PATH,
        destination: SAME_ORIGIN_APP_URL,
        basePath: false,
        permanent: true,
      },
      {
        source: `${LEGACY_BASE_PATH}/:path*`,
        destination: `${SAME_ORIGIN_APP_URL}/:path*`,
        basePath: false,
        permanent: true,
      },
      {
        source: "/",
        destination: PUBLIC_APP_URL,
        basePath: false,
        permanent: true,
      },
      {
        source: "/:path((?!speech-to-text-api-comparison|compare-stt-apis).*)",
        destination: `${PUBLIC_APP_URL}/:path`,
        basePath: false,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // PostHog reverse proxy — same hosts as gladia-marketing vercel.json.
    // basePath: false so /ingest stays at domain root (not under the app basePath).
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
        basePath: false,
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
        basePath: false,
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
        basePath: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "gladia-p2",

  project: "sentry-coquelicot-curtain",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/api/o",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
