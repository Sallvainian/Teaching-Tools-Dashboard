import type { User, AuthSession } from '@supabase/supabase-js';
import type { UserRole } from './database';
import type { Readable as _Readable } from 'svelte/store';

// Define the structure of the auth store for TypeScript
export interface AuthStore {
    user: User | null;
    profile: { id: string; email: string; full_name: string; avatar_url?: string | null; role: UserRole | null } | null;
    session: AuthSession | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    role: UserRole | null;
    isInitialized: boolean;
}

// Declare the $-prefixed store variables that Svelte creates
declare global {
    // This makes $authStore properly typed in Svelte components
    let $authStore: AuthStore;
    let $user: User | null;
    let $profile: { id: string; email: string; full_name: string; avatar_url?: string | null; role: UserRole | null } | null;
    let $session: AuthSession | null;
    let $loading: boolean;
    let $error: string | null;
    let $isAuthenticated: boolean;
    let $role: UserRole | null;
    let $isInitialized: boolean;
}
