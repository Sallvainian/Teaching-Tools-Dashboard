// src/lib/stores/auth.ts
import { writable, derived, get } from 'svelte/store';
import type { AuthSession, User } from '@supabase/supabase-js';

function createAuthStore() {
  const user = writable<User | null>(null);
  const session = writable<AuthSession | null>(null);
  const loading = writable(true);
  const error = writable<string | null>(null);

  // Derived store for authentication status
  const isAuthenticated = derived(user, ($user) => !!$user);

  // Initialize on creation - only check existing session, don't create a new one
  async function initialize() {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      // Get the current session
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
      }
      
      // Set up auth state change listener
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (newSession) {
            session.set(newSession);
            user.set(newSession.user);
          } else {
            session.set(null);
            user.set(null);
          }
        }
      );

      // Return cleanup function
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (err: any) {
      console.error('Error initializing auth store:', err);
      error.set(err.message ?? 'Authentication check failed');
    } finally {
      loading.set(false);
    }
  }

  // Sign in with email/password
  async function signIn(email: string, password: string) {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // Update stores
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Sign in error:', err);
      error.set(err.message ?? 'Sign in failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Sign up with email/password
  async function signUp(email: string, password: string, userData: any = {}) {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (signUpError) throw signUpError;

      // Update stores
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
        return true;
      }
      
      // Email confirmation might be required
      return { needsEmailConfirmation: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      error.set(err.message ?? 'Sign up failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Sign out
  async function signOut() {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) throw signOutError;
      
      // Clear stores
      session.set(null);
      user.set(null);
      
      return true;
    } catch (err: any) {
      console.error('Sign out error:', err);
      error.set(err.message ?? 'Sign out failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Rest password
  async function resetPassword(email: string) {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      
      if (resetError) throw resetError;
      
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      error.set(err.message ?? 'Password reset failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Update user data
  async function updateUserProfile(userData: any) {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: userData
      });
      
      if (updateError) throw updateError;
      
      // Update user store
      if (data?.user) {
        user.set(data.user);
      }
      
      return true;
    } catch (err: any) {
      console.error('Profile update error:', err);
      error.set(err.message ?? 'Profile update failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Get current session
  async function getSession() {
    const currentUser = get(user);
    const currentSession = get(session);
    return { user: currentUser, session: currentSession };
  }

  // Initialize the store
  initialize();

  return {
    subscribe: derived(
      [user, session, loading, error, isAuthenticated],
      ([$user, $session, $loading, $error, $isAuthenticated]) => ({
        user: $user,
        session: $session,
        loading: $loading,
        error: $error,
        isAuthenticated: $isAuthenticated
      })
    ).subscribe,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    initialize,
    getSession
  };
}

// Create and export the auth store
export const authStore = createAuthStore();

// Export individual pieces for convenience
export const user = derived(authStore, ($store) => $store.user);
export const session = derived(authStore, ($store) => $store.session);
export const loading = derived(authStore, ($store) => $store.loading);
export const error = derived(authStore, ($store) => $store.error);
export const isAuthenticated = derived(authStore, ($store) => $store.isAuthenticated);
