import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase';

// Create a Supabase client
// When running locally or in development mode, use empty strings for credentials
// This will allow the app to run without Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);