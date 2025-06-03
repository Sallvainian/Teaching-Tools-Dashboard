// src/lib/utils/supabaseTypes.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

/**
 * Type-safe Supabase client
 */
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

// Note: The schema generation functionality has been removed due to TypeScript errors
// and because it wasn't being used in the application.
// If you need to generate types from Supabase, please use the Supabase CLI or
// the official Supabase type generator.
