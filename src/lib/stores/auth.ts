import { writable, derived } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseService } from '$lib/services/supabaseService';
import { supabase } from '$lib/supabaseClient';

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

	// Store the subscription for cleanup
	let authSubscription: { unsubscribe: () => void } | null = null;

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
			const { data: { subscription } } = supabase.auth.onAuthStateChange(
				(_event, session) => {
					set({
						user: session?.user || null,
						session,
						isLoading: false,
						error: null
					});
				}
			);

			// Store subscription for cleanup
			authSubscription = subscription;

			// Clean up subscription on-page unload
			if (typeof window !== 'undefined') {
				window.addEventListener('beforeunload', () => {
					subscription.unsubscribe();
				});
			}

		} catch (err) {
			const error = err as Error;
			update(state => ({
				...state,
				error: error.message ?? 'Failed to initialize auth',
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
				const data = await supabaseService.signIn(email, password);

				if (!data) throw new Error('Failed to sign in');

				update(state => ({
					...state,
					user: data.user,
					session: data.session,
					isLoading: false
				}));

				return data;

			} catch (err) {
				const error = err as Error;
				update(state => ({
					...state,
					error: error.message ?? 'Failed to sign in',
					isLoading: false
				}));
				throw error;
			}
		},

		// Sign up with email and password
		signUpWithEmail: async (email: string, password: string, full_name: string) => {
			update(state => ({ ...state, isLoading: true, error: null }));

			try {
				// Sign up the user
				const data = await supabaseService.signUp(email, password, { full_name });

				if (!data) throw new Error('Failed to sign up');

				// If successful, create an entry in app_users table
				if (data.user) {
					try {
						const insertResult = await supabaseService.insertItem('app_users', {
							id: data.user.id,
							email: data.user.email!,
							full_name,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString()
						});

						if (!insertResult) {
							console.warn('Failed to create user profile, but authentication succeeded');
						}
					} catch (insertError) {
						const error = insertError as Error;
						console.error('Error creating user profile:', error);
						// Continue with auth as the critical part succeeded
					}
				}

				update(state => ({
					...state,
					user: data.user,
					session: data.session,
					isLoading: false
				}));

				return data;

			} catch (err) {
				const error = err as Error;
				update(state => ({
					...state,
					error: error.message ?? 'Failed to sign up',
					isLoading: false
				}));
				throw error;
			}
		},

		// Sign out
		signOut: async () => {
			update(state => ({ ...state, isLoading: true, error: null }));

			try {
				await supabaseService.signOut();

				update(state => ({
					...state,
					user: null,
					session: null,
					isLoading: false
				}));

			} catch (err) {
				const error = err as Error;
				update(state => ({
					...state,
					error: error.message ?? 'Failed to sign out',
					isLoading: false
				}));
				throw error;
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
				return true;

			} catch (err) {
				const error = err as Error;
				update(state => ({
					...state,
					error: error.message ?? 'Failed to reset password',
					isLoading: false
				}));
				throw error;
			}
		},

		// Update user profile
		updateProfile: async (profile: { full_name?: string, avatar_url?: string }) => {
			update(state => ({ ...state, isLoading: true, error: null }));

			try {
				// Get current user from state
				let currentState: AuthState | undefined;
				update(state => {
					currentState = state;
					return state;
				});

				// Check if user exists
				if (!currentState?.user?.id) {
					throw new Error('User not authenticated');
				}

				// Update auth metadata
				const { error: updateError } = await supabase.auth.updateUser({
					data: {
						full_name: profile.full_name
					}
				});

				if (updateError) throw updateError;

				// Update app_users table
				try {
					await supabaseService.updateItem('app_users', currentState.user.id, {
						full_name: profile.full_name,
						avatar_url: profile.avatar_url,
						updated_at: new Date().toISOString()
					});
				} catch (updateItemError) {
					const error = updateItemError as Error;
					console.error('Error updating user profile in database:', error);
					// Continue with the auth update
				}

				// Refresh user data
				const { data, error } = await supabase.auth.getUser();

				if (error) throw error;

				update(state => ({
					...state,
					user: data.user,
					isLoading: false
				}));

				return data.user;

			} catch (err) {
				const error = err as Error;
				update(state => ({
					...state,
					error: error.message ?? 'Failed to update profile',
					isLoading: false
				}));
				throw error;
			}
		},

		// Cleanup method to handle store destruction
		cleanup: () => {
			if (authSubscription) {
				authSubscription.unsubscribe();
				authSubscription = null;
			}
		}
	};
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => !!$auth.user);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const authErrorMsg = derived(authStore, $auth => $auth.error);
