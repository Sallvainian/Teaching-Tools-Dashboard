// src/lib/stores/auth.ts
import { writable, derived, get } from 'svelte/store';
import type { AuthSession, User } from '@supabase/supabase-js';
import type { UserRole } from '$lib/types/database';

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
				.single();

			if (error) throw error;
			role.set(data?.role || null);
		} catch (err) {
			console.error('Error fetching user role:', err);
			role.set(null);
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
						// Don't wait for role fetch in the critical path
						fetchUserRole(parsed.currentSession.user.id).catch(console.error);
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
				await fetchUserRole(data.session.user.id);
			} else if (!storedSession) {
				// Only clear if we didn't have a stored session
				session.set(null);
				user.set(null);
				role.set(null);
			}

			// Only set up auth listener once
			if (!authListenerSetup) {
				const { data: authListener } = supabase.auth.onAuthStateChange(
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
		loading.set(true);
		error.set(null);
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { error: signOutError } = await supabase.auth.signOut();
			if (signOutError) throw signOutError;

			// Clear all auth state
			session.set(null);
			user.set(null);
			role.set(null);

			// Clear localStorage as well
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('teacher-dashboard-auth');
				window.localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token');
			}

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
