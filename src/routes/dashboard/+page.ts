import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';

export const load: PageLoad = async () => {
	// Get current auth state
	const auth = get(authStore);
	
	// If not authenticated, redirect to login
	if (!auth.isAuthenticated) {
		throw redirect(307, '/auth/login');
	}
	
	return {};
};