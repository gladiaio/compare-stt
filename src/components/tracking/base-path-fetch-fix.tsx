import { DEFAULT_BASE_PATH } from "@/lib/base-path-fetch";

/**
 * Next.js basePath joins "/" as "/compare-stt-apis/", and RSC flight
 * requests use that trailing-slash URL. On www.gladia.io the marketing
 * proxy only rewrites the no-slash path to this app; the slash variant
 * falls through to Webflow (301 → gladia-0c772dnew.webflow.io) and
 * hydration fails with CORS.
 *
 * Inline script so it runs from the initial HTML before Next client fetch.
 * Keep behavior aligned with `normalizeBasePathFetchUrl` in
 * `src/lib/base-path-fetch.ts` (covered by test-base-path-fetch.ts).
 */
export function BasePathFetchFix() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || DEFAULT_BASE_PATH;
  if (!basePath || basePath === "/") return null;

  const code = `(function(){var base=${JSON.stringify(basePath)};var baseSlash=base+"/";function normalize(url){if(typeof url!=="string")return url;if(url===baseSlash)return base;if(url.indexOf(baseSlash+"?")===0)return base+url.slice(baseSlash.length);try{var u=new URL(url,location.origin);if(u.origin===location.origin&&u.pathname===baseSlash){u.pathname=base;return u.pathname+u.search+u.hash}}catch(e){}return url}var origFetch=window.fetch;window.fetch=function(input,init){if(typeof input==="string"){input=normalize(input)}else if(input&&typeof Request!=="undefined"&&input instanceof Request){var next=normalize(input.url);if(next!==input.url)input=new Request(next,input)}return origFetch.call(this,input,init)};if(typeof XMLHttpRequest!=="undefined"){var origOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(){if(typeof arguments[1]==="string")arguments[1]=normalize(arguments[1]);return origOpen.apply(this,arguments)}}})();`;

  return (
    <script
      // Runs before hydration; strips basePath trailing slash from RSC fetches.
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
