import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://2644904ccddbf49afacdccf14cae13d2@o4509381050957824.ingest.us.sentry.io/4509381155553280',

	environment: process.env.NODE_ENV ?? 'development',
	release: process.env.SENTRY_RELEASE ?? 'development',

	// Basic tracing without profiling
	tracesSampleRate: 1.0

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sentryHandle();

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
