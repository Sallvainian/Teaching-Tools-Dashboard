import * as Sentry from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from '@sveltejs/kit';

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
});

const myErrorHandler: Parameters<typeof Sentry.handleErrorWithSentry>[0] = ({ error, event }: { error: unknown; event: import('@sveltejs/kit').RequestEvent }) => {
  console.error("An error occurred on the server side:", error, event);
};

// Handle Chrome DevTools requests
const handleChromeDevTools: Handle = async ({ event, resolve }) => {
  // Check if this is a Chrome DevTools request
  if (event.url.pathname.includes('/.well-known/appspecific/com.chrome.devtools.json')) {
    // Return an empty JSON response to prevent 404 errors
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Not a Chrome DevTools request, continue to the next handler
  return resolve(event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
// Use sequence to run our custom handler before Sentry's handler
export const handle = sequence(handleChromeDevTools, Sentry.sentryHandle());
