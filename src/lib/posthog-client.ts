declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      __loaded?: boolean;
    };
  }
}

/** True when PostHog can safely accept capture() without the array-stub crash. */
export function canCapturePostHog(): boolean {
  if (typeof window === "undefined") return false;
  const ph = window.posthog;
  if (!ph || typeof ph.capture !== "function") return false;
  // Array stub queues via .push — safe. Fully loaded client — safe.
  // Non-array without __loaded often means a broken dual-init stub on an object.
  if (Array.isArray(ph)) return true;
  return Boolean(ph.__loaded);
}

/**
 * Fire a PostHog event. Never throws — analytics must not take down the app.
 * Queues briefly if the snippet is still loading on first paint.
 * Returns a cancel fn useful when calling from a React effect.
 */
export function capturePostHogEvent(
  event: string,
  properties?: Record<string, unknown>
): () => void {
  if (typeof window === "undefined") return () => {};

  const tryCapture = (): boolean => {
    if (!canCapturePostHog()) return false;
    try {
      window.posthog!.capture(event, properties);
      return true;
    } catch {
      return false;
    }
  };

  if (tryCapture()) return () => {};

  const id = window.setInterval(() => {
    if (tryCapture()) window.clearInterval(id);
  }, 100);
  const timeout = window.setTimeout(() => window.clearInterval(id), 5000);

  return () => {
    window.clearInterval(id);
    window.clearTimeout(timeout);
  };
}
