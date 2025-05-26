import { supabase } from '$lib/supabaseClient';
import { authStore } from '$lib/stores/auth';

let initPromise: Promise<void> | null = null;

export async function ensureAuthInitialized(): Promise<void> {
	if (!initPromise) {
		initPromise = (async () => {
			try {
				// Initialize auth store - this will get the current session
				await authStore.initialize();
				
				// Wait a bit to ensure auth state is fully propagated
				await new Promise(resolve => setTimeout(resolve, 50));
			} catch (error) {
				console.error('Auth initialization error:', error);
			}
		})();
	}
	
	return initPromise;
}

export function isAuthReady(): boolean {
	return initPromise !== null;
}