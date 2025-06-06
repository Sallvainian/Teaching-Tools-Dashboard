import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create the Supabase client with SvelteKit environment variables
export const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are provided
if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Missing Supabase credentials. Please set environment variables.');
	throw new Error(
		'Missing Supabase credentials. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables.'
	);
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;