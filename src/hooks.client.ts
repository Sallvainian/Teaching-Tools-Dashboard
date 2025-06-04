import * as Sentry from "@sentry/sveltekit";

// Use the DSN from the environment
const SENTRY_DSN = import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
	dsn: SENTRY_DSN,
	sendDefaultPii: true,
	tracesSampleRate: 1.0,
	integrations: [Sentry.replayIntegration()],
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
});

export const handleError = Sentry.handleErrorWithSentry(
	({ error, event, status, message }: { error: unknown; event: unknown; status: number; message: string }) => {
		console.error("An error occurred on the client side:", error, event, status, message);
	}
);