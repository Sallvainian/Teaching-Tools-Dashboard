// src/lib/stores/auth.ts
import type { AuthSession, User } from '@supabase/supabase-js';
import type { UserRole } from '$lib/types/database';
import type { AppUser, AuthState } from '$lib/types/auth';
import { clearSupabaseAuthStorage } from '$lib/utils/authStorage';
import { createStore, createDerivedStore, type EnhancedStore } from './storeFactory';
import { storeRegistry } from './registry';

interface UserProfile {
	id: string;
	email: string;
	full_name: string;
	avatar_url?: string | null;
	role: UserRole | null;
}

interface AuthStoreState {
	user: User | null;
	profile: UserProfile | null;
	session: AuthSession | null;
	loading: boolean;
	error: string | null;
	role: UserRole | null;
	isInitialized: boolean;
}

function createAuthStore() {
	// Create the main auth store with all state
	const authStore = createStore<AuthStoreState>({
		name: 'auth',
		initialValue: {
			user: null,
			profile: null,
			session: null,
			loading: true,
			error: null,
			role: null,
			isInitialized: false
		},
		localStorageKey: 'teacher-dashboard-auth-state'
	});

	// Create individual slices for better performance
	const user = createDerivedStore({
		name: 'auth.user',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.user
	});

	const profile = createDerivedStore({
		name: 'auth.profile',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.profile
	});

	const session = createDerivedStore({
		name: 'auth.session',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.session
	});

	const loading = createDerivedStore({
		name: 'auth.loading',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.loading
	});

	const error = createDerivedStore({
		name: 'auth.error',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.error
	});

	const role = createDerivedStore({
		name: 'auth.role',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.role
	});

	const isAuthenticated = createDerivedStore({
		name: 'auth.isAuthenticated',
		stores: [user],
		deriveFn: ([$user]) => !!$user
	});

	const isInitialized = createDerivedStore({
		name: 'auth.isInitialized',
		stores: [authStore],
		deriveFn: ([$auth]) => $auth.isInitialized
	});

	// Track if we've already set up auth listener
	let authListenerSetup = false;

	async function fetchUserProfile(userId: string) {
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error } = await supabase
				.from('app_users')
				.select('id, email, full_name, avatar_url, role')
				.eq('id', userId)
				.maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

			if (error) {
				console.error('Database error fetching user profile:', error);
				authStore.update(state => ({
					...state,
					role: null,
					profile: null
				}));
				return;
			}

			if (data) {
				const userProfile: UserProfile = {
					id: data.id,
					email: data.email,
					full_name: data.full_name,
					avatar_url: data.avatar_url,
					role: data.role as UserRole
				};
				authStore.update(state => ({
					...state,
					profile: userProfile,
					role: data.role as UserRole
				}));
			} else {
				// Check localStorage fallback first
				const fallbackRole = localStorage.getItem(`user-role-${userId}`);
				if (fallbackRole) {
					console.warn(`Using fallback role from localStorage: ${fallbackRole}`);
					authStore.update(state => ({
						...state,
						role: fallbackRole as UserRole
					}));
				} else {
					// No record found - user needs to be created in app_users table
					console.warn(`No app_users record found for user ${userId}. Creating default record...`);
					await createAppUserRecord(userId);
				}
			}
		} catch (err) {
			console.error('Error fetching user profile:', err);
			authStore.update(state => ({
				...state,
				role: null,
				profile: null
			}));
		}
	}

	// Keep the old function for backwards compatibility
	async function fetchUserRole(userId: string) {
		return fetchUserProfile(userId);
	}

	async function createAppUserRecord(userId: string) {
		try {
			const { supabase } = await import('$lib/supabaseClient');

			// Get user details from auth
			const {
				data: { user },
				error: userError
			} = await supabase.auth.getUser();
			if (userError || !user) {
				console.error('Could not get user details:', userError);
				return;
			}

			// Create app_users record with teacher role as default
			const { data, error } = await supabase
				.from('app_users')
				.insert({
					id: userId,
					email: user.email,
					full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
					role: 'teacher' // Default to teacher role
				})
				.select('role')
				.single();

			if (error) {
				console.error('Error creating app_users record:', error);
				// Check if it's an RLS policy violation
				if (error.code === '42501') {
					console.warn('RLS policy preventing user creation. Using fallback role.');
					// Store role in localStorage as fallback until RLS is fixed
					localStorage.setItem(`user-role-${userId}`, 'teacher');
				}
				// Fallback to teacher role
				authStore.update(state => ({
					...state,
					role: 'teacher'
				}));
			} else {
				console.log('Created app_users record with role:', data.role);
				// Also set the profile data
				const userProfile: UserProfile = {
					id: userId,
					email: user.email || '',
					full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
					avatar_url: user.user_metadata?.avatar_url || null,
					role: data.role as UserRole
				};
				authStore.update(state => ({
					...state,
					role: data.role,
					profile: userProfile
				}));
			}
		} catch (err) {
			console.error('Error creating app_users record:', err);
			// Fallback to teacher role
			authStore.update(state => ({
				...state,
				role: 'teacher'
			}));
		}
	}

	async function initialize() {
		if (authListenerSetup) {
			return;
		}

		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');

			// First try to get session from local storage quickly
			const storedSession =
				typeof window !== 'undefined'
					? window.localStorage.getItem('teacher-dashboard-auth')
					: null;

			if (storedSession) {
				try {
					const parsed = JSON.parse(storedSession);
					if (parsed?.currentSession?.access_token) {
						// Optimistically set the session while we verify it
						authStore.update(state => ({
							...state,
							session: parsed.currentSession,
							user: parsed.currentSession.user
						}));

						// Don't wait for role fetch in the critical path - make it fully async
						setTimeout(() => {
							fetchUserRole(parsed.currentSession.user.id).catch(console.error);
						}, 0);
					}
				} catch (e) {
					console.error('Error parsing stored session:', e);
				}
			}

			// Now verify/refresh the session with Supabase
			const { data, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;

			if (data?.session) {
				authStore.update(state => ({
					...state,
					session: data.session,
					user: data.session.user
				}));

				// Make role fetching non-blocking for faster initial load
				setTimeout(() => {
					fetchUserRole(data.session.user.id).catch(console.error);
				}, 0);
			} else if (!storedSession) {
				// Only clear if we didn't have a stored session
				authStore.update(state => ({
					...state,
					session: null,
					user: null,
					role: null
				}));
			}

			// Only set up auth listener once
			if (!authListenerSetup) {
				const { data: _authListener } = supabase.auth.onAuthStateChange(
					async (event, newSession) => {
						authStore.update(state => ({
							...state,
							session: newSession,
							user: newSession?.user ?? null
						}));

						if (newSession?.user) {
							await fetchUserRole(newSession.user.id);
						} else {
							authStore.update(state => ({
								...state,
								role: null
							}));
						}
					}
				);
				authListenerSetup = true;
			}
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Auth check failed'
			}));
		} finally {
			authStore.update(state => ({
				...state,
				loading: false,
				isInitialized: true
			}));
		}
	}

	async function signIn(email: string, password: string) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) {
				authStore.update(state => ({
					...state,
					error: signInError.message.includes('Invalid login')
						? 'Invalid email or password'
						: signInError.message
				}));
				return false;
			}

			if (data?.session) {
				authStore.update(state => ({
					...state,
					session: data.session,
					user: data.session.user
				}));

				// Fetch user role immediately after sign in
				await fetchUserRole(data.session.user.id);

				// Give auth state time to propagate
				await new Promise((resolve) => setTimeout(resolve, 100));
				return true;
			}

			authStore.update(state => ({
				...state,
				error: 'Sign in failed'
			}));
			return false;
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Sign in failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	async function signUp(email: string, password: string, userData = {}) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: { data: userData }
			});

			if (signUpError) throw signUpError;

			if (data?.session) {
				authStore.update(state => ({
					...state,
					session: data.session,
					user: data.session?.user || null
				}));
				return true;
			}

			return { needsEmailConfirmation: true };
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Sign up failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	async function signOut() {
		console.log('Auth store signOut called');
		try {
			// First clear local state immediately
			authStore.update(state => ({
				...state,
				session: null,
				user: null,
				role: null,
				loading: false
			}));

			// Clear any stored authentication keys
			clearSupabaseAuthStorage();

			// Now call Supabase signOut
			const { supabase } = await import('$lib/supabaseClient');
			console.log('Calling supabase.auth.signOut()');
			const { error: signOutError } = await supabase.auth.signOut();

			if (signOutError) {
				console.error('Supabase signOut error:', signOutError);
				// Even if there's an error, we've already cleared local state
				// so the user appears signed out
			}
			console.log('Supabase signOut completed');

			// Force a clean navigation to login page using our navigation utility
			if (typeof window !== 'undefined') {
				const { goto } = await import('$lib/utils/navigation');
				await goto('/auth/login', { replaceState: true });
			}

			return true;
		} catch (err) {
			console.error('Error during sign out:', err);

			// Update error state but still clear auth state
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Sign out failed',
				session: null,
				user: null,
				role: null,
				loading: false
			}));

			// Even on error, redirect
			if (typeof window !== 'undefined') {
				const { goto } = await import('$lib/utils/navigation');
				await goto('/auth/login', { replaceState: true });
			}
			return false;
		}
	}

	async function resetPassword(email: string) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

			if (resetError) throw resetError;
			return true;
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Password reset failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	async function updateUserProfile(userData: Record<string, unknown>) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error: updateError } = await supabase.auth.updateUser({ data: userData });

			if (updateError) throw updateError;

			if (data?.user) {
				authStore.update(state => ({
					...state,
					user: data.user
				}));
			}

			return true;
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Profile update failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	async function signUpStudent(data: {
		email: string;
		password: string;
		fullName: string;
		joinCode?: string;
	}) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');

			// First sign up the user
			const { data: authData, error: signUpError } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: { data: { full_name: data.fullName } }
			});

			if (signUpError) throw signUpError;

			if (authData?.user) {
				// Create app_users record with student role
				const { error: profileError } = await supabase.from('app_users').insert({
					id: authData.user.id,
					email: data.email,
					full_name: data.fullName,
					role: 'student'
				});

				if (profileError) throw profileError;

				// Create student record
				const { error: studentError } = await supabase.from('students').insert({
					user_id: authData.user.id,
					join_code: data.joinCode
				});

				if (studentError) throw studentError;

				return true;
			}

			return { needsEmailConfirmation: true };
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Sign up failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	async function signUpTeacher(data: {
		email: string;
		password: string;
		fullName: string;
		schoolName?: string;
	}) {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		try {
			const { supabase } = await import('$lib/supabaseClient');

			// First sign up the user
			const { data: authData, error: signUpError } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: { data: { full_name: data.fullName } }
			});

			if (signUpError) throw signUpError;

			if (authData?.user) {
				// Create app_users record with teacher role
				const { error: profileError } = await supabase.from('app_users').insert({
					id: authData.user.id,
					email: data.email,
					full_name: data.fullName,
					role: 'teacher'
				});

				if (profileError) throw profileError;

				return true;
			}

			return { needsEmailConfirmation: true };
		} catch (err) {
			authStore.update(state => ({
				...state,
				error: err instanceof Error ? err.message : 'Sign up failed'
			}));
			return false;
		} finally {
			authStore.update(state => ({
				...state,
				loading: false
			}));
		}
	}

	// Don't auto-initialize - let ensureAuthInitialized handle it
	// void initialize();

 // Create a combined store with all the state and methods
 const combinedStore: {
 	subscribe: (callback: (value: AuthState) => void) => () => void;
 	signIn: (email: string, password: string) => Promise<boolean>;
 	signUp: (email: string, password: string, userData?: Record<string, any>) => Promise<boolean | { needsEmailConfirmation: boolean }>;
 	signUpStudent: (data: { email: string; password: string; fullName: string; joinCode?: string }) => Promise<boolean | { needsEmailConfirmation: boolean }>;
 	signUpTeacher: (data: { email: string; password: string; fullName: string; schoolName?: string }) => Promise<boolean | { needsEmailConfirmation: boolean }>;
 	signOut: () => Promise<boolean>;
 	resetPassword: (email: string) => Promise<boolean>;
 	updateUserProfile: (userData: Record<string, unknown>) => Promise<boolean>;
 	initialize: () => Promise<void>;
 } = {
 	subscribe: createDerivedStore<any, AuthState>({
			name: 'auth.combined',
			stores: [
				user, profile, session, loading, error, 
				isAuthenticated, role, isInitialized
			] as any[],
			deriveFn: ([$user, $profile, $session, $loading, $error, $isAuthenticated, $role, $isInitialized]: any[]) => ({
				user: $user,
				profile: $profile,
				session: $session,
				loading: $loading,
				error: $error,
				isAuthenticated: $isAuthenticated,
				role: $role,
				isInitialized: $isInitialized
			})
		}).subscribe,
		signIn,
		signUp,
		signUpStudent,
		signUpTeacher,
		signOut,
		resetPassword,
		updateUserProfile,
		initialize
	};

	return combinedStore;
}

// Create and export the auth store and its derived stores
export const authStore = createAuthStore();

// These exports are maintained for backward compatibility
// but they now use the centralized store registry
export const user = storeRegistry.get('auth.user')!;
export const profile = storeRegistry.get('auth.profile')!;
export const session = storeRegistry.get('auth.session')!;
export const loading = storeRegistry.get('auth.loading')!;
export const error = storeRegistry.get('auth.error')!;
export const isAuthenticated = storeRegistry.get('auth.isAuthenticated')!;
export const role = storeRegistry.get('auth.role')!;
export const isInitialized = storeRegistry.get('auth.isInitialized')!;
