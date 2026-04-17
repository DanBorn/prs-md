// Client-side analytics wrapper for Google Analytics 4 and Mixpanel.
// Safe to import from "use client" components; no-ops on the server.

export type EventProperties = Record<string, string | number | boolean | null | undefined>;

interface MixpanelInstance {
  track: (event: string, properties?: EventProperties) => void;
  identify: (userId: string) => void;
  people: { set: (traits: Record<string, unknown>) => void };
}

let _mixpanel: MixpanelInstance | null = null;

export async function initMixpanel(token: string): Promise<void> {
  const { default: mixpanel } = await import("mixpanel-browser");
  // EU / India residency projects must override the api_host — events to the
  // default US host are silently dropped even though the request returns 200.
  const apiHost = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST;
  mixpanel.init(token, {
    track_pageview: "url-with-path",
    persistence: "localStorage",
    ...(apiHost ? { api_host: apiHost } : {}),
  });
  _mixpanel = mixpanel as unknown as MixpanelInstance;
}

export function track(event: string, properties?: EventProperties): void {
  if (typeof window === "undefined") return;

  // Google Analytics 4
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) {
    gtag("event", event, properties ?? {});
  }

  // Mixpanel
  _mixpanel?.track(event, properties);
}

export function identify(userId: string, traits?: Record<string, string | number | boolean>): void {
  if (!_mixpanel) return;
  _mixpanel.identify(userId);
  if (traits) _mixpanel.people.set(traits);
}
