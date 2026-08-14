"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePostHogEvent } from "@/lib/posthog-client";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
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

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pathWithQs,
      page_location: url,
    });

    return capturePostHogEvent("$pageview", { $current_url: url });
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
