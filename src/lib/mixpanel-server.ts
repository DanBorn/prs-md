/**
 * Server-side Mixpanel event tracking.
 *
 * Uses the Mixpanel HTTP Track API directly — no client SDK, no browser.
 * All calls are fire-and-forget: failures are swallowed so analytics
 * never slow down or break API responses.
 *
 * Set MIXPANEL_TOKEN in your environment (same value as NEXT_PUBLIC_MIXPANEL_TOKEN).
 */

// Mixpanel's track endpoint. EU-residency and India-residency projects must
// send to api-eu.mixpanel.com / api-in.mixpanel.com — events sent to the wrong
// region are accepted at the HTTP layer (status:1) but silently dropped.
function getMpEndpoint(): string {
  const host =
    process.env.MIXPANEL_API_HOST ??
    process.env.NEXT_PUBLIC_MIXPANEL_API_HOST ??
    "https://api.mixpanel.com";
  return `${host.replace(/\/$/, "")}/track`;
}

export type ServerEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Fire a server-side Mixpanel event. Non-blocking.
 *
 * @param event       Mixpanel event name
 * @param distinctId  User ID or "anonymous"
 * @param properties  Extra dimensions to attach
 */
export function trackServer(
  event: string,
  distinctId: string,
  properties?: ServerEventProperties
): Promise<void> {
  const token =
    process.env.MIXPANEL_TOKEN ?? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return Promise.resolve();

  const payload = [
    {
      event,
      properties: {
        token,
        distinct_id: distinctId,
        time: Math.floor(Date.now() / 1000),
        // Mark as server-side so Mixpanel reports can separate sources
        mp_lib: "node",
        ...properties,
      },
    },
  ];

  // Return the promise so callers can pass it to after() and ensure
  // Vercel keeps the function alive until the request completes.
  return fetch(getMpEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => {})
    .catch(() => {
      // Swallow — analytics failures must never surface to users
    });
}
