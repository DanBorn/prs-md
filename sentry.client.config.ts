import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 10% of transactions
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    // Strip cookies and auth headers from client-side events
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },
});
