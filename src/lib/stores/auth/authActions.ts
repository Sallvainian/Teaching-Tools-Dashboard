// src/lib/stores/auth/authActions.ts
// Authentication operations (sign in, sign up, sign out, reset password)

import { supabase } from '$lib/supabaseClient';
import { clearSupabaseAuthStorage } from '$lib/utils/authStorage';
import { authStore } from './core';
import { fetchUserProfile } from './profileActions';
import { setSignupInProgress } from './initialization';

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<boolean> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	try {
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

			// Fetch user profile immediately after sign in
			await fetchUserProfile(data.session.user.id);

			// Give auth state time to propagate
			await new Promise((resolve) => setTimeout(resolve, 100));
			return true;
		}

		authStore.update(state => ({
			...state,
			error: 'Sign in failed'
		}));
		return false;
	} catch (err: unknown) {
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

// Basic sign up
export async function signUp(email: string, password: string, userData = {}): Promise<boolean | { needsEmailConfirmation: boolean }> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	try {
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
				user: data.session?.user ?? null
			}));
			return true;
		}

		return { needsEmailConfirmation: true };
	} catch (err: unknown) {
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

// Sign up as student
export async function signUpStudent(data: {
	email: string;
	password: string;
	fullName: string;
	joinCode?: string;
}): Promise<boolean | { needsEmailConfirmation: boolean }> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	// Prevent auth listener from interfering during signup
	setSignupInProgress(true);

	try {
		// First sign up the user
		const { data: authData, error: signUpError } = await supabase.auth.signUp({
			email: data.email,
			password: data.password,
			options: { data: { full_name: data.fullName } }
		});

		if (signUpError) throw signUpError;

		if (authData?.user) {
			// Check if email confirmation is required
			if (!authData.session) {
				// Email confirmation required - don't create profile records yet
				return { needsEmailConfirmation: true };
			}

			// User is confirmed, create app_users record with student role
			const { error: profileError } = await supabase.from('app_users').insert({
				id: authData.user.id,
				email: data.email,
				full_name: data.fullName,
				role: 'student'
			});

			if (profileError) {
				// If it's a duplicate key error, the record already exists (race condition with initialization)
				if (profileError.code === '23505') {
					console.log('app_users record already exists (created by initialization), continuing...');
				} else {
					console.error('Profile creation error:', profileError);
					
					// Cleanup: Delete the auth user since profile creation failed
					try {
						if (authData.session?.access_token) {
							await fetch('/api/auth/delete-account', {
								method: 'DELETE',
								headers: {
									'Authorization': `Bearer ${authData.session.access_token}`,
									'Content-Type': 'application/json'
								}
							});
							console.log('Cleaned up auth user after student profile creation failure');
						}
					} catch (cleanupError) {
						console.error('Failed to cleanup auth user:', cleanupError);
					}
					
					throw new Error(`Profile creation failed: ${profileError.message}`);
				}
			}

			// Create student record
			const { error: studentError } = await supabase.from('students').insert({
				user_id: authData.user.id,
				name: data.fullName,
				join_code: data.joinCode
			});

			if (studentError) {
				console.error('Student record creation error:', studentError);
				
				// Cleanup: Delete the auth user since student record creation failed
				// We need to use the server endpoint since client can't delete auth users
				try {
					if (authData.session?.access_token) {
						await fetch('/api/auth/delete-account', {
							method: 'DELETE',
							headers: {
								'Authorization': `Bearer ${authData.session.access_token}`,
								'Content-Type': 'application/json'
							}
						});
						console.log('Cleaned up auth user after student record creation failure');
					}
				} catch (cleanupError) {
					console.error('Failed to cleanup auth user:', cleanupError);
				}
				
				throw new Error(`Student record creation failed: ${studentError.message}`);
			}

			return true;
		}

		return { needsEmailConfirmation: true };
	} catch (err: unknown) {
		authStore.update(state => ({
			...state,
			error: err instanceof Error ? err.message : 'Sign up failed'
		}));
		return false;
	} finally {
		// Re-enable auth listener
		setSignupInProgress(false);
		authStore.update(state => ({
			...state,
			loading: false
		}));
	}
}

// Sign up as teacher
export async function signUpTeacher(data: {
	email: string;
	password: string;
	fullName: string;
	schoolName?: string;
}): Promise<boolean | { needsEmailConfirmation: boolean }> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	// Prevent auth listener from interfering during signup
	setSignupInProgress(true);

	try {
		// First sign up the user
		const { data: authData, error: signUpError } = await supabase.auth.signUp({
			email: data.email,
			password: data.password,
			options: { data: { full_name: data.fullName } }
		});

		if (signUpError) throw signUpError;

		if (authData?.user) {
			// Check if email confirmation is required
			if (!authData.session) {
				// Email confirmation required - don't create profile records yet
				return { needsEmailConfirmation: true };
			}

			// User is confirmed, create app_users record with teacher role
			const { error: profileError } = await supabase.from('app_users').insert({
				id: authData.user.id,
				email: data.email,
				full_name: data.fullName,
				role: 'teacher',
				school_name: data.schoolName
			});

			if (profileError) {
				// If it's a duplicate key error, the record already exists (race condition with initialization)
				if (profileError.code === '23505') {
					console.log('app_users record already exists (created by initialization), continuing...');
				} else {
					console.error('Teacher profile creation error:', profileError);
					
					// Cleanup: Delete the auth user since profile creation failed
					try {
						if (authData.session?.access_token) {
							await fetch('/api/auth/delete-account', {
								method: 'DELETE',
								headers: {
									'Authorization': `Bearer ${authData.session.access_token}`,
									'Content-Type': 'application/json'
								}
							});
							console.log('Cleaned up auth user after teacher profile creation failure');
						}
					} catch (cleanupError) {
						console.error('Failed to cleanup auth user:', cleanupError);
					}
					
					throw new Error(`Profile creation failed: ${profileError.message}`);
				}
			}

			return true;
		}

		return { needsEmailConfirmation: true };
	} catch (err: unknown) {
		authStore.update(state => ({
			...state,
			error: err instanceof Error ? err.message : 'Sign up failed'
		}));
		return false;
	} finally {
		// Re-enable auth listener
		setSignupInProgress(false);
		authStore.update(state => ({
			...state,
			loading: false
		}));
	}
}

// Sign out
export async function signOut(): Promise<boolean> {
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
		const { error: signOutError } = await supabase.auth.signOut();

		if (signOutError) {
			console.error('Supabase signOut error:', signOutError);
			// Even if there's an error, we've already cleared local state
			// so the user appears signed out
		}

		// Force a clean navigation to login page using our navigation utility
		if (typeof window !== 'undefined') {
			const { goto } = await import('$app/navigation');
			await goto('/auth/login', { replaceState: true });
		}

		return true;
	} catch (err: unknown) {
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
			const { goto } = await import('$app/navigation');
			await goto('/auth/login', { replaceState: true });
		}
		return false;
	}
}

// Delete account
export async function deleteAccount(): Promise<boolean> {
	try {
		authStore.update(state => ({
			...state,
			loading: true,
			error: null
		}));

		const { data: { session } } = await supabase.auth.getSession();
		if (!session?.access_token) throw new Error('No authenticated user');

		// Use the server endpoint to delete user account (including auth.users record)
		const response = await fetch('/api/auth/delete-account', {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${session.access_token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
			throw new Error(errorData.message || `Server error: ${response.status}`);
		}

		// Clear local state immediately
		authStore.update(state => ({
			...state,
			session: null,
			user: null,
			role: null,
			profile: null,
			loading: false
		}));

		// Clear any stored authentication keys
		clearSupabaseAuthStorage();

		// Redirect to login
		if (typeof window !== 'undefined') {
			const { goto } = await import('$app/navigation');
			await goto('/auth/login', { replaceState: true });
		}

		return true;
	} catch (err: unknown) {
		authStore.update(state => ({
			...state,
			error: err instanceof Error ? err.message : 'Account deletion failed',
			loading: false
		}));
		return false;
	}
}

// Reset password
export async function resetPassword(email: string): Promise<boolean> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	try {
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

		if (resetError) throw resetError;
		return true;
	} catch (err: unknown) {
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