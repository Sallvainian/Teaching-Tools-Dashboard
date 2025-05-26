import { authStore } from '$lib/stores/auth';
import { initializeDB } from '$lib/supabaseClient';

// Initialize Supabase client and auth store with minimal approach
if (typeof window !== 'undefined') {
	// Initialize Supabase client
	void initializeDB();

	// Initialize auth store to check existing session only
	void authStore.initialize();
}

// Set prerender to false to allow auth state to be determined at runtime
export const prerender = false;
