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
		loading.set(true);
		error.set(null);
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { data, error: sessionError } = await supabase.auth.getSession();
			if (sessionError) throw sessionError;
			if (data?.session) {
				session.set(data.session);
				user.set(data.session.user);
				await fetchUserRole(data.session.user.id);
			}
			const { data: authListener } = supabase.auth.onAuthStateChange(async (_, newSession) => {
				session.set(newSession);
				user.set(newSession?.user ?? null);
				if (newSession?.user) {
					await fetchUserRole(newSession.user.id);
				} else {
					role.set(null);
				}
			});
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
				await new Promise(resolve => setTimeout(resolve, 100));
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

	void initialize();

	return {
		subscribe: derived(
			[user, session, loading, error, isAuthenticated, role],
			([$user, $session, $loading, $error, $isAuthenticated, $role]) => ({
				user: $user,
				session: $session,
				loading: $loading,
				error: $error,
				isAuthenticated: $isAuthenticated,
				role: $role
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
