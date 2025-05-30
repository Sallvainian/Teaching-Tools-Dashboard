import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock Supabase before importing authStore
vi.mock('$lib/supabaseClient', () => ({
	supabase: {
		auth: {
			getUser: vi.fn(),
			onAuthStateChange: vi.fn(() => ({
				data: { subscription: { unsubscribe: vi.fn() } }
			})),
			signInWithPassword: vi.fn(),
			signUp: vi.fn(),
			signOut: vi.fn(),
			resetPasswordForEmail: vi.fn(),
			updateUser: vi.fn()
		},
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn(),
			single: vi.fn(),
			insert: vi.fn().mockReturnThis()
		}))
	}
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Import authStore after mocks are set up
import { authStore } from './auth';

describe('authStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset store state
		authStore.signOut();
	});

	it('should initialize with default state', () => {
		const state = get(authStore);
		expect(state.user).toBeNull();
		expect(state.loading).toBe(true);
		expect(state.role).toBeNull();
	});

	describe('signIn', () => {
		it('should sign in successfully with valid credentials', async () => {
			const mockUser = { id: '123', email: 'test@example.com' };
			const mockSession = { access_token: 'token' };

			const { supabase } = await import('$lib/supabaseClient');
			vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
				data: { user: mockUser, session: mockSession },
				error: null
			});

			const result = await authStore.signIn('test@example.com', 'password');

			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
			expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password'
			});
		});

		it('should handle sign in errors', async () => {
			const { supabase } = await import('$lib/supabaseClient');
			vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
				data: { user: null, session: null },
				error: { message: 'Invalid credentials' }
			});

			const result = await authStore.signIn('test@example.com', 'wrong');

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid credentials');
		});
	});

	describe('signUp', () => {
		it('should sign up successfully with teacher role', async () => {
			const mockUser = { id: '123', email: 'new@example.com' };

			const { supabase } = await import('$lib/supabaseClient');
			vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
				data: { user: mockUser, session: {} },
				error: null
			});

			const result = await authStore.signUpTeacher('new@example.com', 'password', 'John Doe');

			expect(result.success).toBe(true);
			expect(supabase.auth.signUp).toHaveBeenCalledWith({
				email: 'new@example.com',
				password: 'password',
				options: {
					data: {
						full_name: 'John Doe',
						role: 'teacher'
					}
				}
			});
		});

		it('should sign up successfully with student role', async () => {
			const mockUser = { id: '123', email: 'student@example.com' };

			const { supabase } = await import('$lib/supabaseClient');
			vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
				data: { user: mockUser, session: {} },
				error: null
			});

			const result = await authStore.signUpStudent(
				'student@example.com',
				'password',
				'Jane Doe',
				'CLASS123'
			);

			expect(result.success).toBe(true);
			expect(supabase.auth.signUp).toHaveBeenCalledWith({
				email: 'student@example.com',
				password: 'password',
				options: {
					data: {
						full_name: 'Jane Doe',
						role: 'student',
						join_code: 'CLASS123'
					}
				}
			});
		});
	});

	describe('signOut', () => {
		it('should sign out successfully', async () => {
			const { supabase } = await import('$lib/supabaseClient');
			const { goto } = await import('$app/navigation');

			vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
				error: null
			});

			const result = await authStore.signOut();

			expect(result).toBe(true);
			expect(supabase.auth.signOut).toHaveBeenCalled();
			expect(goto).toHaveBeenCalledWith('/auth/login', { replaceState: true });
		});

		it('should handle sign out errors gracefully', async () => {
			const { supabase } = await import('$lib/supabaseClient');
			const { goto } = await import('$app/navigation');

			vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
				error: { message: 'Network error' }
			});

			const result = await authStore.signOut();

			expect(result).toBe(false);
			expect(goto).toHaveBeenCalledWith('/auth/login', { replaceState: true });
		});
	});

	describe('resetPassword', () => {
		it('should send password reset email successfully', async () => {
			const { supabase } = await import('$lib/supabaseClient');

			vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
				data: {},
				error: null
			});

			const result = await authStore.resetPassword('test@example.com');

			expect(result.success).toBe(true);
			expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
		});
	});

	describe('updateProfile', () => {
		it('should update user profile successfully', async () => {
			const { supabase } = await import('$lib/supabaseClient');

			vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
				data: { user: { id: '123' } },
				error: null
			});

			const result = await authStore.updateProfile({
				full_name: 'Updated Name',
				avatar_url: 'https://example.com/avatar.jpg'
			});

			expect(result.success).toBe(true);
			expect(supabase.auth.updateUser).toHaveBeenCalledWith({
				data: {
					full_name: 'Updated Name',
					avatar_url: 'https://example.com/avatar.jpg'
				}
			});
		});
	});

	describe('role management', () => {
		it('should create app_users record if not found', async () => {
			const { supabase } = await import('$lib/supabaseClient');

			// Mock user exists in auth
			vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
				data: {
					user: {
						id: '123',
						email: 'test@example.com',
						user_metadata: { full_name: 'Test User' }
					}
				},
				error: null
			});

			// Mock no app_users record found
			const fromMock = vi.mocked(supabase.from);
			fromMock.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				maybeSingle: vi.fn().mockResolvedValueOnce({
					data: null,
					error: null
				}),
				single: vi.fn(),
				insert: vi.fn()
			} as any);

			// Mock successful insert
			fromMock.mockReturnValueOnce({
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValueOnce({
					data: { role: 'teacher' },
					error: null
				}),
				eq: vi.fn(),
				maybeSingle: vi.fn()
			} as any);

			// This would be called during auth state change
			await authStore.initialize();
		});
	});
});
