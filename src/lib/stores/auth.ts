// src/lib/stores/auth.ts
import { writable, derived, get } from 'svelte/store';
import type { AuthSession, User } from '@supabase/supabase-js';
import { supabaseService, type Profile } from '$lib/SupabaseService';
import type { StudentSignupData, TeacherSignupData } from '$lib/types/auth';

function createAuthStore() {
  const user = writable<User | null>(null);
  const session = writable<AuthSession | null>(null);
  const profile = writable<Profile | null>(null);
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
    } catch (err) {
      // Error initializing auth store
      error.set(err instanceof Error ? err.message : 'Authentication check failed');
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
    } catch (err) {
      // Sign in error
      error.set(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Sign up with email/password
  async function signUp(email: string, password: string, userData: Record<string, unknown> = {}) {
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
    } catch (err) {
      // Sign up error
      error.set(err instanceof Error ? err.message : 'Sign up failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Sign up a student
  async function signUpStudent({ email, password, fullName }: StudentSignupData) {
    loading.set(true);
    error.set(null);

    try {
      const { data, error: signUpError } = await supabaseService.signUpStudent(email, password);
      if (signUpError) throw signUpError;

      if (data?.user) {
        session.set(data.session);
        user.set(data.user);
        await createProfile({ id: data.user.id, full_name: fullName });
        return true;
      }

      return false;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Sign up failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Sign up a teacher
  async function signUpTeacher({ email, password, fullName }: TeacherSignupData) {
    return signUpStudent({ email, password, fullName });
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
    } catch (err) {
      // Sign out error
      error.set(err instanceof Error ? err.message : 'Sign out failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Reset password
  async function resetPassword(email: string) {
    loading.set(true);
    error.set(null);

    try {
      // Dynamically import supabase client to ensure it's properly initialized
      const { supabase } = await import('$lib/supabaseClient');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      
      if (resetError) throw resetError;
      
      return true;
    } catch (err) {
      // Password reset error
      error.set(err instanceof Error ? err.message : 'Password reset failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  // Update user data
  async function updateUserProfile(userData: Record<string, unknown>) {
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
    } catch (err) {
      // Profile update error
      error.set(err instanceof Error ? err.message : 'Profile update failed');
      return false;
    } finally {
      loading.set(false);
    }
  }

  async function getProfile(userId: string) {
    const { data, error: profileError } = await supabaseService.getProfile(userId);
    if (profileError) throw profileError;
    profile.set(data);
    return data;
  }

  async function createProfile(profileData: Profile) {
    const { error: createErr } = await supabaseService.createProfile(profileData);
    if (createErr) throw createErr;
    profile.set(profileData);
  }

  async function updateProfile(profileData: Profile) {
    const { error: updateErr } = await supabaseService.updateProfile(profileData);
    if (updateErr) throw updateErr;
    profile.set(profileData);
  }

  // Get current session
  async function getSession() {
    const currentUser = get(user);
    const currentSession = get(session);
    return { user: currentUser, session: currentSession };
  }

  // Initialize the store
  void initialize(); // void operator to explicitly ignore the promise

  return {
    subscribe: derived(
      [user, session, profile, loading, error, isAuthenticated],
      ([$user, $session, $profile, $loading, $error, $isAuthenticated]) => ({
        user: $user,
        session: $session,
        profile: $profile,
        loading: $loading,
        error: $error,
        isAuthenticated: $isAuthenticated
      })
    ).subscribe,
    signIn,
    signUp,
    signUpStudent,
    signUpTeacher,
    signOut,
    resetPassword,
    updateUserProfile,
    getProfile,
    createProfile,
    updateProfile,
    initialize,
    getSession
  };
}

// Create and export the auth store
export const authStore = createAuthStore();

// Export individual pieces for convenience
export const user = derived(authStore, ($store) => $store.user);
export const session = derived(authStore, ($store) => $store.session);
export const profileStore = derived(authStore, ($store) => $store.profile);
export const loading = derived(authStore, ($store) => $store.loading);
export const error = derived(authStore, ($store) => $store.error);
export const isAuthenticated = derived(authStore, ($store) => $store.isAuthenticated);