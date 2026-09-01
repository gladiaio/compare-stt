"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      __loaded?: boolean;
      __SV?: number;
    };
  }
}

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const qs = searchParams?.toString();
    const pathWithQs = qs ? `${pathname}?${qs}` : pathname;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${pathWithQs}`
        : pathWithQs;

    if (!Array.isArray(window.dataLayer)) {
      window.dataLayer = [];
    }
    window.dataLayer.push({
      event: "page_view",
      page_path: pathWithQs,
      page_location: url,
    });

    const capture = () => {
      // Wait until the real SDK is loaded — the stub's capture() uses .push()
      // and throws if window.posthog was replaced by a non-array object.
      if (!window.posthog?.__loaded) return false;
      if (typeof window.posthog.capture !== "function") return false;
      window.posthog.capture("$pageview", { $current_url: url });
      return true;
    };

    if (capture()) return;

    // Snippet may still be loading on first paint
    const id = window.setInterval(() => {
      if (capture()) window.clearInterval(id);
    }, 100);
    const timeout = window.setTimeout(() => window.clearInterval(id), 5000);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return null;
}

/** SPA pageviews for GTM/GA4 (dataLayer) + PostHog. */
export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
