import * as Sentry from "@sentry/sveltekit";
// import { PUBLIC_SENTRY_DSN } from "$env/static/public";

// Temporarily disabled Sentry for Linux setup
// Sentry.init({
//   dsn: PUBLIC_SENTRY_DSN,
//   sendDefaultPii: true,
//   tracesSampleRate: 1.0,
//   integrations: [Sentry.replayIntegration()],
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });

const myErrorHandler = ({ error, event }: { error: any; event: any }) => {
  console.error("An error occurred on the client side:", error, event);
};

// export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
export const handleError = myErrorHandler;
