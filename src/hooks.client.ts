import * as Sentry from "@sentry/sveltekit";

// Hardcoded Sentry DSN since it's not reading from .env properly
const SENTRY_DSN = "https://2644904ccddbf49afacdccf14cae13d2@o4509381050957824.ingest.us.sentry.io/4509381155553280";

Sentry.init({
  dsn: SENTRY_DSN,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Optional: Initialize Session Replay:
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const myErrorHandler = ({ error, event }: any) => {
  console.error("An error occurred on the client side:", error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
