import { createClient } from '@supabase/supabase-js';

// Create the Supabase client
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://yutlcpluuhjxwudfathv.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dGxjcGx1dWhqeHd1ZGZhdGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDk0MTgsImV4cCI6MjA2MjY4NTQxOH0.xUbla5RpsoqK9SKTL14li9lroXgimK4Zy8brPfzpVHc';

// Log a warning if using fallback credentials
if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Using fallback Supabase credentials. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables for production use.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

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