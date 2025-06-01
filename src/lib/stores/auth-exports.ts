// auth-exports.ts - Static exports wrapper for auth store
// This file provides static exports to avoid mixing dynamic/static imports

import { derived } from 'svelte/store';
import { authStore } from './auth';

// Re-export all the derived stores as static exports
export { authStore };
export const user = derived(authStore, ($store) => $store.user);
export const profile = derived(authStore, ($store) => $store.profile);
export const session = derived(authStore, ($store) => $store.session);
export const loading = derived(authStore, ($store) => $store.loading);
export const error = derived(authStore, ($store) => $store.error);
export const isAuthenticated = derived(authStore, ($store) => $store.isAuthenticated);
export const role = derived(authStore, ($store) => $store.role);
export const isInitialized = derived(authStore, ($store) => $store.isInitialized);
