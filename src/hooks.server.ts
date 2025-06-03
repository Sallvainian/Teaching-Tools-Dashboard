import * as Sentry from "@sentry/sveltekit";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { sequence } from "@sveltejs/kit/hooks";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const myErrorHandler = ({ error, event }) => {
  console.error("An error occurred on the server side:", error, event);
};

// Handle Chrome DevTools requests
const handleChromeDevTools = async ({ event, resolve }) => {
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
