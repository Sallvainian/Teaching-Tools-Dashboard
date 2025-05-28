import { createClient } from '@supabase/supabase-js';

// Create the Supabase client
export const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are provided
if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase credentials. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables.'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	db: {
		schema: 'public'
	},
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		storageKey: 'teacher-dashboard-auth',
		storage: {
			getItem: (key) => {
				if (typeof window !== 'undefined') {
					return window.localStorage.getItem(key);
				}
				return null;
			},
			setItem: (key, value) => {
				if (typeof window !== 'undefined') {
					window.localStorage.setItem(key, value);
				}
			},
			removeItem: (key) => {
				if (typeof window !== 'undefined') {
					window.localStorage.removeItem(key);
				}
			}
		},
		// Speed up session restoration
		flowType: 'pkce'
	}
});

// Initialize with minimal logic - no table creation or automatic login
export const initializeDB = async () => {
	try {
		// Check connection to Supabase
		const { data, error } = await supabase.from('app_users').select('count').limit(1);
		if (error) throw error;
		console.info('Supabase connection successful');
		return { success: true };
	} catch (error) {
		// Error in Supabase initialization
		console.error('Failed to initialize Supabase connection:', error);
		return { success: false, error };
	}
};
