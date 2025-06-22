import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$lib/utils/env';

// Environment variables are imported from utility file

// Create the Supabase client with SvelteKit environment variables
export const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are provided
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('demo')) {
	console.warn('⚠️  Using demo Supabase credentials. Application will run in demo mode with limited functionality.');
	console.log('To connect to a real Supabase project:');
	console.log('1. Create a new Supabase project at https://supabase.com');
	console.log('2. Set environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env file');
	console.log('3. Restart your development server');
} else {
	console.log('✅ Connected to Supabase project:', supabaseUrl);
}

// Create and export the Supabase client with proper SvelteKit configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: browser,
		persistSession: browser,
		detectSessionInUrl: browser
	},
	global: {
		fetch: (url, options = {}) => {
			return fetch(url, {
				...options,
				signal: AbortSignal.timeout(10000) // 10s timeout
			});
		}
	},
	realtime: {
		params: {
			eventsPerSecond: 10
		},
		timeout: 15000
	}
});

export default supabase;