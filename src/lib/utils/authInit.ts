import { supabase } from '$lib/supabaseClient';
import { authStore } from '$lib/stores/auth';

let initPromise: Promise<void> | null = null;

export async function ensureAuthInitialized(): Promise<void> {
	if (!initPromise) {
		initPromise = (async () => {
			try {
				// Check if Supabase is properly connected
				const { error } = await supabase.from('app_users').select('count').limit(1);
				if (error && error.code !== 'PGRST116') {
					// PGRST116 is "no rows found" which is fine
					console.error('Supabase connection error:', error);
				}
				
				// Initialize auth store
				await authStore.initialize();
				
				// Wait a bit to ensure auth state is fully propagated
				await new Promise(resolve => setTimeout(resolve, 100));
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