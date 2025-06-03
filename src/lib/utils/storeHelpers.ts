import type { AuthStore } from '$lib/types/auth-types';

/**
 * Helper function to safely access the authStore with proper typing
 * @param store The authStore to be typed
 * @returns The properly typed authStore
 */
export function typedAuthStore(store: unknown): AuthStore {
  return store as AuthStore;
}

/**
 * Helper function to safely access the user property from authStore with proper typing
 * @param store The authStore to be typed
 * @returns The user property from the authStore
 */
export function getUser(store: unknown) {
  return (store as AuthStore).user;
}

/**
 * Helper function to safely access the profile property from authStore with proper typing
 * @param store The authStore to be typed
 * @returns The profile property from the authStore
 */
export function getProfile(store: unknown) {
  return (store as AuthStore).profile;
}

/**
 * Helper function to safely access the role property from authStore with proper typing
 * @param store The authStore to be typed
 * @returns The role property from the authStore
 */
export function getRole(store: unknown) {
  return (store as AuthStore).role;
}

/**
 * Helper function to safely access the isAuthenticated property from authStore with proper typing
 * @param store The authStore to be typed
 * @returns The isAuthenticated property from the authStore
 */
export function getIsAuthenticated(store: unknown) {
  return (store as AuthStore).isAuthenticated;
}