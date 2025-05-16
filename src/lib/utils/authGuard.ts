import { redirect } from '@sveltejs/kit';
import type { LoadEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

/**
 * Authentication guard for protected routes
 * Redirects to login if not authenticated
 */
export async function authGuard({ url }: LoadEvent) {
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