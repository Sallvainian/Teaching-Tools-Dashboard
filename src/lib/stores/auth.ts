// src/lib/stores/auth.ts
import { writable, derived } from 'svelte/store';
import type { AuthSession, User } from '@supabase/supabase-js';
import type { UserRole } from '$lib/types/database';
import { clearSupabaseAuthStorage } from '$lib/utils/authStorage';

function createAuthStore() {
	const user = writable<User | null>(null);
	const session = writable<AuthSession | null>(null);
	const loading = writable(true);
	const error = writable<string | null>(null);
	const role = writable<UserRole | null>(null);
	const isAuthenticated = derived(user, ($user) => !!$user);
	const isInitialized = writable(false);

	// Track if we've already set up auth listener
	let authListenerSetup = false;

	async function fetchUserRole(userId: string) {
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error } = await supabase
				.from('app_users')
				.select('role')
				.eq('id', userId)
				.maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

			if (error) {
				console.error('Database error fetching user role:', error);
				role.set(null);
				return;
			}

			if (data) {
				role.set(data.role);
			} else {
				// Check localStorage fallback first
				const fallbackRole = localStorage.getItem(`user-role-${userId}`);
				if (fallbackRole) {
					console.warn(`Using fallback role from localStorage: ${fallbackRole}`);
					role.set(fallbackRole as UserRole);
				} else {
					// No record found - user needs to be created in app_users table
					console.warn(`No app_users record found for user ${userId}. Creating default record...`);
					await createAppUserRecord(userId);
				}
			}
		} catch (err) {
			console.error('Error fetching user role:', err);
			role.set(null);
		}
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
				role.set('teacher'); // Fallback to teacher role
			} else {
				console.log('Created app_users record with role:', data.role);
				role.set(data.role);
			}
		} catch (err) {
			console.error('Error creating app_users record:', err);
			role.set('teacher'); // Fallback to teacher role
		}
	}

	async function initialize() {
		if (authListenerSetup) {
			return;
		}

		loading.set(true);
		error.set(null);
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
						session.set(parsed.currentSession);
						user.set(parsed.currentSession.user);
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
				session.set(data.session);
				user.set(data.session.user);
				// Make role fetching non-blocking for faster initial load
				setTimeout(() => {
					fetchUserRole(data.session.user.id).catch(console.error);
				}, 0);
			} else if (!storedSession) {
				// Only clear if we didn't have a stored session
				session.set(null);
				user.set(null);
				role.set(null);
			}

			// Only set up auth listener once
			if (!authListenerSetup) {
				const { data: _authListener } = supabase.auth.onAuthStateChange(
					async (event, newSession) => {
						session.set(newSession);
						user.set(newSession?.user ?? null);
						if (newSession?.user) {
							await fetchUserRole(newSession.user.id);
						} else {
							role.set(null);
						}
					}
				);
				authListenerSetup = true;
			}
		} catch (err) {
			error.set(err instanceof Error ? err.message : 'Auth check failed');
		} finally {
			loading.set(false);
			// Always set initialized to true after the first attempt
			isInitialized.set(true);
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
				error.set(
					signInError.message.includes('Invalid login')
						? 'Invalid email or password'
						: signInError.message
				);
				return false;
			}
			if (data?.session) {
				session.set(data.session);
				user.set(data.session.user);
				// Fetch user role immediately after sign in
				await fetchUserRole(data.session.user.id);
				// Give auth state time to propagate
				await new Promise((resolve) => setTimeout(resolve, 100));
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
		console.log('Auth store signOut called');
		try {
			// First clear local state immediately
			session.set(null);
			user.set(null);
			role.set(null);
			loading.set(false);

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

			// Force a clean navigation to login page using SvelteKit navigation
			if (typeof window !== 'undefined') {
				const { goto } = await import('$app/navigation');
				await goto('/auth/login', { replaceState: true });
			}

			return true;
		} catch (err) {
			console.error('Error during sign out:', err);
			error.set(err instanceof Error ? err.message : 'Sign out failed');
			// Even on error, clear local state and redirect
			session.set(null);
			user.set(null);
			role.set(null);
			loading.set(false);
			if (typeof window !== 'undefined') {
				const { goto } = await import('$app/navigation');
				await goto('/auth/login', { replaceState: true });
			}
			return false;
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

	async function signUpStudent(data: {
		email: string;
		password: string;
		fullName: string;
		joinCode?: string;
	}) {
		loading.set(true);
		error.set(null);
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
			error.set(err instanceof Error ? err.message : 'Sign up failed');
			return false;
		} finally {
			loading.set(false);
		}
	}

	async function signUpTeacher(data: {
		email: string;
		password: string;
		fullName: string;
		schoolName?: string;
	}) {
		loading.set(true);
		error.set(null);
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
			error.set(err instanceof Error ? err.message : 'Sign up failed');
			return false;
		} finally {
			loading.set(false);
		}
	}

	// Don't auto-initialize - let ensureAuthInitialized handle it
	// void initialize();

	return {
		subscribe: derived(
			[user, session, loading, error, isAuthenticated, role, isInitialized],
			([$user, $session, $loading, $error, $isAuthenticated, $role, $isInitialized]) => ({
				user: $user,
				session: $session,
				loading: $loading,
				error: $error,
				isAuthenticated: $isAuthenticated,
				role: $role,
				isInitialized: $isInitialized
			})
		).subscribe,
		signIn,
		signUp,
		signUpStudent,
		signUpTeacher,
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
export const role = derived(authStore, ($store) => $store.role);
export const isInitialized = derived(authStore, ($store) => $store.isInitialized);
