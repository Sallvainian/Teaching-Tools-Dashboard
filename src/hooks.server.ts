import * as Sentry from "@sentry/sveltekit";
// import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { sequence } from "@sveltejs/kit/hooks";

// Temporarily disabled Sentry for Linux setup
// Sentry.init({
//   dsn: PUBLIC_SENTRY_DSN,
//   sendDefaultPii: true,
//   tracesSampleRate: 1.0,
// });

const myErrorHandler = ({ error, event }: { error: any; event: any }) => {
  console.error("An error occurred on the server side:", error, event);
};

// Handle Chrome DevTools requests
const handleChromeDevTools = async ({ event, resolve }: { event: any; resolve: any }) => {
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

// export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
export const handleError = myErrorHandler;
// Use sequence to run our custom handler before Sentry's handler
// export const handle = sequence(handleChromeDevTools, Sentry.sentryHandle());
export const handle = handleChromeDevTools;
