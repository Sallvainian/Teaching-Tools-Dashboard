import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';
import { ensureAuthInitialized } from '$lib/utils/authInit';
import { getIsAuthenticated } from '$lib/utils/storeHelpers';

export const load: PageLoad = async ({ data }) => {
	// Ensure auth is initialized first
	await ensureAuthInitialized();

	// Get current auth state
	const auth = get(authStore);

	// If not authenticated, redirect to login
	if (!getIsAuthenticated(auth)) {
		throw redirect(307, '/auth/login');
	}

	// Return the data from the server
	return {
		data: data
	};
};
