import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseService } from '$lib/services/supabaseService';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

function createAuthStore() {
  // Initialize store with loading state
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null
  });

  // Initialize by getting current session
  async function initialize() {
    try {
      // Get initial session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      // Set initial session and user
      set({
        user: data.session?.user || null,
        session: data.session,
        isLoading: false,
        error: null
      });
      
      // Listen for auth state changes
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (event, session) => {
          set({
            user: session?.user || null,
            session,
            isLoading: false,
            error: null
          });
        }
      );
      
      // Clean up subscription on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          subscription.unsubscribe();
        });
      }
      
    } catch (err: any) {
      update(state => ({
        ...state,
        error: err.message || 'Failed to initialize auth',
        isLoading: false
      }));
    }
  }

  // Call initialize
  initialize();

  // Auth methods
  return {
    subscribe,

    // Sign in with email and password
    signInWithEmail: async (email: string, password: string) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        update(state => ({
          ...state,
          user: data.user,
          session: data.session,
          isLoading: false
        }));
        
        return data;
        
      } catch (err: any) {
        update(state => ({
          ...state,
          error: err.message || 'Failed to sign in',
          isLoading: false
        }));
        throw err;
      }
    },

    // Sign up with email and password
    signUpWithEmail: async (email: string, password: string, full_name: string) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name
            }
          }
        });
        
        if (error) throw error;
        
        // If successful, create an entry in app_users table
        if (data.user) {
          // Add user to app_users table
          await supabaseService.insertItem('app_users', {
            id: data.user.id,
            email: data.user.email!,
            full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        update(state => ({
          ...state,
          user: data.user,
          session: data.session,
          isLoading: false
        }));
        
        return data;
        
      } catch (err: any) {
        console.error('Signup error:', err);
        update(state => ({
          ...state,
          error: err.message || 'Failed to sign up',
          isLoading: false
        }));
        throw err;
      }
    },

    // Sign out
    signOut: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        update(state => ({
          ...state,
          user: null,
          session: null,
          isLoading: false
        }));
        
      } catch (err: any) {
        update(state => ({
          ...state,
          error: err.message || 'Failed to sign out',
          isLoading: false
        }));
        throw err;
      }
    },

    // Reset password
    resetPassword: async (email: string) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (error) throw error;
        
        update(state => ({ ...state, isLoading: false }));
        
      } catch (err: any) {
        update(state => ({
          ...state,
          error: err.message || 'Failed to reset password',
          isLoading: false
        }));
        throw err;
      }
    },

    // Update user profile
    updateProfile: async (profile: { full_name?: string, avatar_url?: string }) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const user = await supabaseService.getCurrentUser();
        
        if (!user) throw new Error('User not found');
        
        // Update auth metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: profile.full_name
          }
        });
        
        if (updateError) throw updateError;
        
        // Update app_users table
        await supabaseService.updateItem('app_users', user.id, {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });
        
        // Refresh user data
        const { data, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        update(state => ({
          ...state,
          user: data.user,
          isLoading: false
        }));
        
      } catch (err: any) {
        update(state => ({
          ...state,
          error: err.message || 'Failed to update profile',
          isLoading: false
        }));
        throw err;
      }
    }
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => !!$auth.user);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const authError = derived(authStore, $auth => $auth.error);