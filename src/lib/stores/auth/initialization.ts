// src/lib/stores/auth/initialization.ts
// Auth initialization, session management, and auth state listener

import { supabase, supabaseUrl } from '$lib/supabaseClient';
import { authStore } from './core';
import { fetchUserProfile } from './profileActions';
import type { AuthStoreState } from './core';

// Track if we've already set up auth listener
let authListenerSetup = false;
// Track if initial auth is complete to prevent duplicate updates
let initialAuthComplete = false;
// Track if signup is in progress to prevent auth listener interference
let signupInProgress = false;

// Initialize authentication
export async function initialize(): Promise<void> {
	if (authListenerSetup) {
		return;
	}

	// Prepare initial state updates
	let stateUpdates: Partial<AuthStoreState> = {
		loading: true,
		error: null
	};

	try {
		// Check if we're in demo mode
		if (supabaseUrl.includes('demo')) {
			console.log('🚀 Running in demo mode - auth functionality limited');
			authStore.update(state => ({
				...state,
				loading: false,
				isInitialized: true,
				error: 'Demo mode - please configure Supabase credentials for full functionality'
			}));
			return;
		}

		// Set a timeout for Supabase operations to prevent hanging
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Supabase connection timeout')), 20000);
		});

		let hasStoredSession = false;
		let storedUserId: string | null = null;

		// First try to get session from local storage quickly
		const storedSession =
			typeof window !== 'undefined'
				? window.localStorage.getItem('teacher-dashboard-auth')
				: null;

		if (storedSession) {
			try {
				const parsed = JSON.parse(storedSession);
				if (parsed?.currentSession?.access_token) {
					hasStoredSession = true;
					storedUserId = parsed.currentSession.user.id;
					// Add session to pending updates
					stateUpdates.session = parsed.currentSession;
					stateUpdates.user = parsed.currentSession.user;
				}
			} catch (e: unknown) {
				console.error('Error parsing stored session:', e);
			}
		}

		// Only set up auth listener once - this doesn't block
		if (!authListenerSetup) {
			supabase.auth.onAuthStateChange(
				async (event, newSession) => {
					// Skip all auth events until initial auth is complete
					if (!initialAuthComplete) return;
					
					// Skip auth events during signup to prevent race conditions
					if (signupInProgress) return;

					// For events after initialization, handle normally
					if (newSession?.user) {
						await fetchUserProfile(newSession.user.id, true);
					} else {
						// User logged out - clear everything in one update
						authStore.update(state => ({
							...state,
							session: null,
							user: null,
							profile: null,
							role: null
						}));
					}
				}
			);
			authListenerSetup = true;
		}

		// Try to verify/refresh the session with Supabase
		try {
			const sessionCall = supabase.auth.getSession();
			const { data, error: sessionError } = await Promise.race([sessionCall, timeoutPromise]) as any;
			
			if (sessionError) throw sessionError;

			if (data?.session) {
				// Only update if different from stored session
				if (!hasStoredSession || data.session.access_token !== stateUpdates.session?.access_token) {
					stateUpdates.session = data.session;
					stateUpdates.user = data.session.user;
					storedUserId = data.session.user.id;
				}
			} else if (!hasStoredSession) {
				// No session at all
				stateUpdates.session = null;
				stateUpdates.user = null;
				stateUpdates.role = null;
			}
		} catch (timeoutError) {
			console.warn('Supabase session verification timed out, using cached session if available');
		}

		// Fetch profile if we have a user
		if (storedUserId) {
			try {
				const profileData = await fetchUserProfile(storedUserId, false);
				if (profileData && 'profile' in profileData) {
					stateUpdates.profile = profileData.profile;
					stateUpdates.role = profileData.role;
				}
			} catch (profileError) {
				console.error('Error fetching profile during initialization:', profileError);
			}
		}

		// Mark initial auth as complete
		initialAuthComplete = true;

		// Apply all state updates in a single batch
		stateUpdates.loading = false;
		stateUpdates.isInitialized = true;
		
		authStore.update(state => ({
			...state,
			...stateUpdates
		}));

	} catch (err: unknown) {
		console.error('Auth initialization error:', err);
		authStore.update(state => ({
			...state,
			error: err instanceof Error ? err.message : 'Auth check failed',
			loading: false,
			isInitialized: true
		}));
	}
}

// Functions to control signup state
export function setSignupInProgress(inProgress: boolean): void {
	signupInProgress = inProgress;
}