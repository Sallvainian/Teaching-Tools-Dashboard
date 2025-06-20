import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types/database';

// Use static env vars for SSR compatibility, fallback to dynamic for demo mode
const supabaseUrl = PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Export for other modules that need the URL
export { supabaseUrl };

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

// Create the appropriate client based on environment
// For SSR compatibility, use the browser client from @supabase/ssr
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		// Disable PKCE to avoid WebCrypto API issues
		flowType: 'implicit'
	}
});

// Legacy export for backward compatibility
export default supabase;