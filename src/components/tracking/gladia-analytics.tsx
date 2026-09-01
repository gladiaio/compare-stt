import Script from "next/script";
import { TRACKING } from "@/lib/tracking";

/**
 * Same tag stack as gladia-marketing `components/gtm-head.html`:
 * GTM (GA4 via container), Google Ads, PostHog, Clarity.
 */
export function GladiaAnalytics() {
  return (
    <>
      <Script id="gtm" strategy="afterInteractive">{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${TRACKING.gtm}');
      `}</Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${TRACKING.googleAds}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-ads" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${TRACKING.googleAds}');
      `}</Script>

      <Script id="posthog" strategy="afterInteractive">{`
        (function () {
          // Avoid re-init when GTM/another tag already loaded PostHog as a
          // non-array object — the stub's capture() calls .push() and crashes.
          if (window.posthog && (window.posthog.__loaded || window.posthog.__SV)) {
            return;
          }
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="xi Si init Ni ji pr qi Ui $i capture calculateEventProperties Zi register register_once register_for_session unregister unregister_for_session Yi getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Ki identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Qi Wi createPersonProfile setInternalOrTestUser Ji Fi tn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing zi debug mr it getPageViewId captureTraceFeedback captureTraceMetric Ri".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document, Array.isArray(window.posthog) ? window.posthog : []);
          posthog.init('${TRACKING.posthog}', {
            api_host: '${TRACKING.posthogApiHost}',
            ui_host: '${TRACKING.posthogUiHost}',
            defaults: '2026-05-30',
            person_profiles: 'identified_only',
            autocapture: true,
            capture_pageview: false,
            capture_pageleave: true,
          });
        })();
      `}</Script>

      <Script id="clarity" strategy="lazyOnload">{`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","${TRACKING.clarity}");
      `}</Script>
    </>
  );
}

export function GladiaAnalyticsNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${TRACKING.gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
