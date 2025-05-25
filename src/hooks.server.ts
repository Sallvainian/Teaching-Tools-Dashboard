import { sequence, type Handle } from "@sveltejs/kit/hooks";
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: 'https://2644904ccddbf49afacdccf14cae13d2@o4509381050957824.ingest.us.sentry.io/4509381155553280',
  
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || 'development',
  
  integrations: [
    nodeProfilingIntegration(),
  ],
  
  // Tracing must be enabled for profiling to work
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is evaluated only once per SDK.init call
  profileSessionSampleRate: 1.0,
  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: import.meta.env.DEV,
});

// Custom handler to add Document-Policy header for JS profiling
const documentPolicyHandler: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('Document-Policy', 'js-profiling');
  return response;
};

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle(), documentPolicyHandler);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
