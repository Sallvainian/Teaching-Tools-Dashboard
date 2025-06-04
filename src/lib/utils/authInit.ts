import { authStore } from '$lib/stores/auth';

let initPromise: Promise<void> | null = null;

export async function ensureAuthInitialized(): Promise<void> {
	if (!initPromise) {
		initPromise = (async () => {
			try {
				// Initialize auth store - this will handle session restoration
				await authStore.initialize();
			} catch (error) {
				console.error('Auth initialization error:', error);
			}
		})();
	}

	return initPromise;
}