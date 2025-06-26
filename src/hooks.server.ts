import { sequence } from "@sveltejs/kit/hooks";
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$lib/utils/env';
import type { Handle } from '@sveltejs/kit';
import { webcrypto as crypto } from 'crypto';

// Simple error handler without Sentry for now
const myErrorHandler = ({ error, event }: { error: unknown; event: import('@sveltejs/kit').RequestEvent }) => {
  console.error("An error occurred on the server side:", error, event);
};

// Supabase auth handler
const handleSupabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return event.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            event.cookies.set(name, value, { ...options, path: '/' });
          } catch (error) {
            // Ignore cookie setting errors after response is generated
            console.warn('Cookie setting failed (response already generated):', name);
          }
        });
      },
    },
  });

  // Helper function to safely get session
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();

    if (error) {
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};

// Handle Chrome DevTools requests and remove CSP headers
const handleChromeDevTools: Handle = async ({ event, resolve }) => {
  // Check if this is a Chrome DevTools request
  if (event.url.pathname.includes('/.well-known/appspecific/com.chrome.devtools.json')) {
    // Return an empty JSON response to prevent 404 errors
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const response = await resolve(event);

  // REMOVE ALL CSP HEADERS - this fixes Railway deployment issues
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('content-security-policy');
  response.headers.delete('Content-Security-Policy-Report-Only');
  response.headers.delete('content-security-policy-report-only');

  // Add minimal security headers (but no CSP)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
};

export const handleError = myErrorHandler;
export const handle = sequence(handleSupabase, handleChromeDevTools);