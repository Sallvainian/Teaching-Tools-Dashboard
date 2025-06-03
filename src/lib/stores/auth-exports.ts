// auth-exports.ts - Static exports wrapper for auth store
// This file provides static exports to avoid mixing dynamic/static imports

import { derived, type Readable } from 'svelte/store';
import { authStore as originalAuthStore } from './auth';
import type { User, AuthSession } from '@supabase/supabase-js';
import type { UserRole } from '$lib/types/database';
import type { AuthStore } from '$lib/types/auth-types';

// Re-export all the derived stores as static exports
// Export authStore with the correct type
export const authStore = originalAuthStore as unknown as Readable<AuthStore>;
// Add type assertions to help TypeScript understand the store structure
export const user = derived<Readable<AuthStore>, User | null>(authStore as Readable<AuthStore>, ($store) => $store.user);
export const profile = derived<Readable<AuthStore>, { id: string; email: string; full_name: string; avatar_url?: string | null; role: UserRole | null } | null>(authStore as Readable<AuthStore>, ($store) => $store.profile);
export const session = derived<Readable<AuthStore>, AuthSession | null>(authStore as Readable<AuthStore>, ($store) => $store.session);
export const loading = derived<Readable<AuthStore>, boolean>(authStore as Readable<AuthStore>, ($store) => $store.loading);
export const error = derived<Readable<AuthStore>, string | null>(authStore as Readable<AuthStore>, ($store) => $store.error);
export const isAuthenticated = derived<Readable<AuthStore>, boolean>(authStore as Readable<AuthStore>, ($store) => $store.isAuthenticated);
export const role = derived<Readable<AuthStore>, UserRole | null>(authStore as Readable<AuthStore>, ($store) => $store.role);
export const isInitialized = derived<Readable<AuthStore>, boolean>(authStore as Readable<AuthStore>, ($store) => $store.isInitialized);
