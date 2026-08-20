/**
 * Conversion tracking — Meta Pixel + Google Tag (GA4 / Google Ads).
 * Scripts load only when the client has configured an ID (via Settings →
 * Tracking). Everything degrades to a no-op when nothing is set.
 */

export type TrackingConfig = {
  metaPixelId: string | null;
  googleTagId: string | null;
  googleAdsPurchaseLabel: string | null;
  googleAdsLeadLabel: string | null;
} | null;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    __trackingInit?: { meta?: string; google?: string };
  }
}

function loadMetaPixel(pixelId: string) {
  const w = window;
  w.__trackingInit ??= {};
  if (w.__trackingInit.meta === pixelId) return;
  w.__trackingInit.meta = pixelId;
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod(...args) : n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq("init", pixelId);
  w.fbq("track", "PageView");
}

function loadGoogleTag(tagId: string) {
  const w = window;
  w.__trackingInit ??= {};
  if (w.__trackingInit.google === tagId) return;
  w.__trackingInit.google = tagId;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function (...args: any[]) {
      w.dataLayer!.push(args);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(s);
    w.gtag("js", new Date());
  }
  w.gtag("config", tagId);
}

let current: TrackingConfig = null;

/** Load whatever the client configured. Safe to call repeatedly. */
export function initTracking(config: TrackingConfig) {
  current = config;
  if (!config) return;
  if (config.metaPixelId) loadMetaPixel(config.metaPixelId);
  if (config.googleTagId) loadGoogleTag(config.googleTagId);
}

type EventName = "ViewContent" | "InitiateCheckout" | "Lead" | "Purchase";

const GA_EVENT: Record<EventName, string> = {
  ViewContent: "view_item",
  InitiateCheckout: "begin_checkout",
  Lead: "generate_lead",
  Purchase: "purchase",
};

/**
 * Fire an event to every configured platform. `value`/`currency` power the
 * revenue/ROAS reporting in Meta and Google Ads.
 */
export function track(
  event: EventName,
  params?: { value?: number; currency?: string; id?: string; label?: string },
) {
  const w = window;
  const value = params?.value;
  const currency = params?.currency ?? "EUR";

  // Meta Pixel — standard events
  if (current?.metaPixelId && w.fbq) {
    const fbParams: Record<string, unknown> = {};
    if (value !== undefined) {
      fbParams.value = value;
      fbParams.currency = currency;
    }
    if (params?.id) fbParams.content_ids = [params.id];
    w.fbq("track", event, fbParams);
  }

  // Google (GA4 event + optional Google Ads conversion)
  if (current?.googleTagId && w.gtag) {
    const gaParams: Record<string, unknown> = {};
    if (value !== undefined) {
      gaParams.value = value;
      gaParams.currency = currency;
    }
    w.gtag("event", GA_EVENT[event], gaParams);

    const adsLabel =
      event === "Purchase"
        ? current.googleAdsPurchaseLabel
        : event === "Lead"
          ? current.googleAdsLeadLabel
          : null;
    if (adsLabel) {
      // Accept either a full "AW-XXX/label" or a bare "label" (prefixed with the tag id).
      const sendTo = adsLabel.includes("/")
        ? adsLabel
        : `${current.googleTagId}/${adsLabel}`;
      w.gtag("event", "conversion", {
        send_to: sendTo,
        ...(value !== undefined ? { value, currency } : {}),
      });
    }
  }
}
