import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 10% of transactions — avoid capturing sensitive request bodies at high volume
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    // Strip authorization headers and other sensitive data before sending to Sentry
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-action-secret"];
    }
    if (event.request?.data && typeof event.request.data === "object") {
      const data = event.request.data as Record<string, unknown>;
      // Remove fields that could contain API keys or tokens
      for (const field of ["apiKey", "api_key", "token", "secret", "password", "callbackToken"]) {
        if (field in data) data[field] = "[Filtered]";
      }
    }
    return event;
  },
});
