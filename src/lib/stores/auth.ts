// src/lib/stores/auth.ts
import { writable, derived } from 'svelte/store';
import type { AuthSession, User } from '@supabase/supabase-js';

function createAuthStore() {
  const user = writable<User | null>(null);
  const session = writable<AuthSession | null>(null);
  const loading = writable(true);
  const error = writable<string | null>(null);
  const isAuthenticated = derived(user, ($user) => !!$user);

  async function initialize() {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
      }
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_, newSession) => {
          session.set(newSession);
          user.set(newSession?.user ?? null);
        }
      );
      return () => authListener.subscription.unsubscribe();
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Auth check failed');
    } finally {
      loading.set(false);
    }
  }

  async function signIn(email: string, password: string) {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        error.set(signInError.message.includes('Invalid login') ? 
          'Invalid email or password' : signInError.message);
        return false;
      }
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
        return true;
      }
      error.set('Sign in failed');
      return false;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  async function signUp(email: string, password: string, userData = {}) {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
      });
      if (signUpError) throw signUpError;
      if (data?.session) {
        session.set(data.session);
        user.set(data.session.user);
        return true;
      }
      return { needsEmailConfirmation: true };
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Sign up failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  async function signOut() {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      session.set(null);
      user.set(null);
      return true;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Sign out failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  async function resetPassword(email: string) {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      return true;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Password reset failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  async function updateUserProfile(userData: Record<string, unknown>) {
    loading.set(true);
    error.set(null);
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const { data, error: updateError } = await supabase.auth.updateUser({ data: userData });
      if (updateError) throw updateError;
      if (data?.user) user.set(data.user);
      return true;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Profile update failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  void initialize();

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
    initialize
  };
}

export const authStore = createAuthStore();
export const user = derived(authStore, ($store) => $store.user);
export const session = derived(authStore, ($store) => $store.session);
export const loading = derived(authStore, ($store) => $store.loading);
export const error = derived(authStore, ($store) => $store.error);
export const isAuthenticated = derived(authStore, ($store) => $store.isAuthenticated);