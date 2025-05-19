import { redirect } from '@sveltejs/kit';
import type { LoadEvent } from '@sveltejs/kit';

/**
 * Authentication guard for protected routes
 * Redirects to login if not authenticated
 */
export async function authGuard({ url }: LoadEvent) {
  // Dynamically import supabase client to ensure it's properly initialized
  const { supabase } = await import('$lib/supabaseClient');
  
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    // Not authenticated, redirect to login
    throw redirect(303, `/auth/login?redirectTo=${url.pathname}`);
  }
  
  // User is authenticated, continue
  return {
    user: data.session.user
  };
}