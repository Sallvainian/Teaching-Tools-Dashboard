// src/lib/stores/auth/profileActions.ts
// Profile management and user role handling

import { supabase } from '$lib/supabaseClient';
import { authStore, isValidUserRole, type UserProfile } from './core';
import type { UserRole } from '$lib/types/database';

// Fetch user profile from database
export async function fetchUserProfile(userId: string, updateStore: boolean = true): Promise<{ profile: UserProfile | null; role: UserRole | null } | void> {
	try {
		const { data, error } = await supabase
			.from('app_users')
			.select('id, email, full_name, avatar_url, role')
			.eq('id', userId)
			.maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

		if (error) {
			console.error('Database error fetching user profile:', error);
			if (updateStore) {
				// Single update for error case
				authStore.update(state => ({
					...state,
					role: null,
					profile: null
				}));
			}
			return updateStore ? undefined : { profile: null, role: null };
		}

		if (data !== null) {
			const validatedRole = isValidUserRole(data.role) ? data.role : null;
			const userProfile: UserProfile = {
				id: data.id,
				email: data.email,
				full_name: data.full_name,
				avatar_url: data.avatar_url,
				role: validatedRole
			};
			
			if (updateStore) {
				// Single update with both profile and role
				authStore.update(state => ({
					...state,
					profile: userProfile,
					role: validatedRole
				}));
			} else {
				return { profile: userProfile, role: validatedRole };
			}
		} else {
			// Check localStorage fallback first
			const fallbackRole = localStorage.getItem(`user-role-${userId}`);
			if (fallbackRole && isValidUserRole(fallbackRole)) {
				console.warn(`Using fallback role from localStorage: ${fallbackRole}`);
				if (updateStore) {
					// Single update for fallback role
					authStore.update(state => ({
						...state,
						role: fallbackRole
					}));
				} else {
					return { profile: null, role: fallbackRole };
				}
			} else {
				// No record found - user needs to be created in app_users table
				console.warn(`No app_users record found for user ${userId}. Creating default record...`);
				const createdData = await createAppUserRecord(userId, updateStore);
				// If not updating store, return the created data
				if (!updateStore && createdData && 'profile' in createdData) {
					return createdData;
				}
			}
		}
	} catch (err: unknown) {
		console.error('Error fetching user profile:', err);
		if (updateStore) {
			// Single update for error case
			authStore.update(state => ({
				...state,
				role: null,
				profile: null
			}));
		} else {
			return { profile: null, role: null };
		}
	}
}

// Create app user record for new users
export async function createAppUserRecord(userId: string, updateStore: boolean = true): Promise<{ profile: UserProfile | null; role: UserRole | null } | void> {
	try {
		// Get user details from auth
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();
		if (userError ?? !user) {
			console.error('Could not get user details:', userError);
			return updateStore ? undefined : { profile: null, role: null };
		}

		// Create app_users record with teacher role as default
		const { data, error } = await supabase
			.from('app_users')
			.insert({
				id: userId,
				email: user.email,
				full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
				role: 'teacher' // Default to teacher role
			})
			.select('role')
			.single();

		if (error) {
			// Check if it's a duplicate key error (record already exists)
			if (error.code === '23505') {
				console.log('app_users record already exists, fetching existing record...');
				// Record already exists, fetch it instead
				const { data: existingData, error: fetchError } = await supabase
					.from('app_users')
					.select('*')
					.eq('id', userId)
					.single();
				
				if (fetchError) {
					console.error('Error fetching existing app_users record:', fetchError);
					return updateStore ? undefined : { profile: null, role: null };
				}
				
				const existingProfile: UserProfile = {
					id: existingData.id,
					email: existingData.email,
					fullName: existingData.full_name,
					role: existingData.role
				};
				
				if (updateStore) {
					authStore.update(state => ({
						...state,
						role: existingData.role,
						profile: existingProfile
					}));
				}
				
				return { profile: existingProfile, role: existingData.role };
			}
			
			console.error('Error creating app_users record:', error);
			// Check if it's an RLS policy violation
			if (error.code === '42501') {
				console.warn('RLS policy preventing user creation. Using fallback role.');
				// Store role in localStorage as fallback until RLS is fixed
				localStorage.setItem(`user-role-${userId}`, 'teacher');
			}
			
			// Return or update with fallback role
			if (updateStore) {
				authStore.update(state => ({
					...state,
					role: 'teacher'
				}));
			} else {
				return { profile: null, role: 'teacher' };
			}
		} else {
			// Prepare the profile data
			const userProfile: UserProfile = {
				id: userId,
				email: user.email ?? '',
				full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
				avatar_url: user.user_metadata?.avatar_url ?? null,
				role: isValidUserRole(data.role) ? data.role : null
			};
			
			if (updateStore) {
				authStore.update(state => ({
					...state,
					role: isValidUserRole(data.role) ? data.role : null,
					profile: userProfile
				}));
			} else {
				return { 
					profile: userProfile, 
					role: isValidUserRole(data.role) ? data.role : null 
				};
			}
		}
	} catch (err: unknown) {
		console.error('Error creating app_users record:', err);
		// Return or update with fallback role
		if (updateStore) {
			authStore.update(state => ({
				...state,
				role: 'teacher'
			}));
		} else {
			return { profile: null, role: 'teacher' };
		}
	}
}

// Update user profile
export async function updateUserProfile(userData: Record<string, unknown>): Promise<boolean> {
	authStore.update(state => ({
		...state,
		loading: true,
		error: null
	}));

	try {
		// Skip auth update and just update the database and local state
		const currentUser = (await supabase.auth.getUser()).data.user;
		if (!currentUser) throw new Error('No authenticated user');
		
		const { error: dbUpdateError } = await supabase
			.from('app_users')
			.update({
				full_name: userData.full_name as string,
				avatar_url: userData.avatar_url as string | null
			})
			.eq('id', currentUser.id);

		if (dbUpdateError) throw dbUpdateError;

		// Update local state
		authStore.update(state => ({
			...state,
			profile: state.profile ? {
				...state.profile,
				full_name: userData.full_name as string,
				avatar_url: userData.avatar_url as string | null
			} : state.profile
		}));

		return true;
	} catch (err: unknown) {
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

// Keep the old function for backwards compatibility
export async function fetchUserRole(userId: string): Promise<void> {
	await fetchUserProfile(userId, true);
}