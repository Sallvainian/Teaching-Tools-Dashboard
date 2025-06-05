// auth-exports.ts - Static exports wrapper for auth store
// This file provides static exports to avoid mixing dynamic/static imports

import { derived } from 'svelte/store';
import { authStore as originalAuthStore } from './auth';
import type { User, AuthSession } from '@supabase/supabase-js';
import type { UserRole } from '$lib/types/database';

// Re-export all the derived stores as static exports
// Export authStore with the correct type
export const authStore = originalAuthStore;
// Create derived stores for individual properties
export const user = derived<typeof originalAuthStore, User | null>(authStore, ($store) => $store.user);
export const profile = derived<typeof originalAuthStore, { id: string; email: string; full_name: string; avatar_url?: string | null; role: UserRole | null } | null>(authStore, ($store) => $store.profile);
export const session = derived<typeof originalAuthStore, AuthSession | null>(authStore, ($store) => $store.session);
export const loading = derived<typeof originalAuthStore, boolean>(authStore, ($store) => $store.loading);
export const error = derived<typeof originalAuthStore, string | null>(authStore, ($store) => $store.error);
export const isAuthenticated = derived<typeof originalAuthStore, boolean>(authStore, ($store) => $store.isAuthenticated);
export const role = derived<typeof originalAuthStore, UserRole | null>(authStore, ($store) => $store.role);
export const isInitialized = derived<typeof originalAuthStore, boolean>(authStore, ($store) => $store.isInitialized);
