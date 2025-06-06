// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthSession } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: AuthSession | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

// Add environment variable declarations
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
}

export {};
