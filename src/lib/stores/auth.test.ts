import { describe, test, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from './auth';
import type { AuthSession, User } from '@supabase/supabase-js';

// Mock the supabaseService
vi.mock('$lib/services/supabaseService', () => ({
  supabaseService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    getProfile: vi.fn(),
    createProfile: vi.fn(),
    getSession: vi.fn()
  }
}));

// Mock Supabase client
vi.mock('$lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  }
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

import { supabaseService } from '$lib/services/supabaseService';

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should have initial state', () => {
    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('signIn should update state on success', async () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: '2024-01-01T00:00:00.000Z',
      last_sign_in_at: '2024-01-01T00:00:00.000Z',
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    
    const mockSession: AuthSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    };
    
    const mockProfile = { full_name: 'Test User', role: 'teacher' };
    
    vi.mocked(supabaseService.signIn).mockResolvedValue({
      session: mockSession,
      user: mockSession.user
    });
    vi.mocked(supabaseService.getProfile).mockResolvedValue(mockProfile);

    const result = await authStore.signIn('test@example.com', 'password');
    
    expect(result).toBe(true);
    const state = get(authStore);
    expect(state.user).toEqual(mockSession.user);
    expect(state.session).toEqual(mockSession);
    expect(state.profile).toEqual(mockProfile);
    expect(state.error).toBeNull();
  });

  test('signIn should handle errors', async () => {
    vi.mocked(supabaseService.signIn).mockRejectedValue(new Error('Invalid credentials'));

    const result = await authStore.signIn('test@example.com', 'wrong-password');
    
    expect(result).toBe(false);
    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
  });

  test('signUp should create user and profile', async () => {
    const mockUser = { id: '123', email: 'newuser@example.com' };
    const mockProfile = { full_name: 'New User', role: 'teacher' };
    
    vi.mocked(supabaseService.signUp).mockResolvedValue({
      user: mockUser,
      session: null
    });
    vi.mocked(supabaseService.createProfile).mockResolvedValue(mockProfile);

    const result = await authStore.signUp('newuser@example.com', 'password', {
      full_name: 'New User'
    });
    
    expect(result).toBe(true);
    expect(supabaseService.createProfile).toHaveBeenCalledWith({
      id: '123',
      email: 'newuser@example.com',
      full_name: 'New User',
      role: 'teacher'
    });
  });

  test('signUpStudent should create student with correct role', async () => {
    const mockUser = { id: '456', email: 'student@example.com' };
    
    vi.mocked(supabaseService.signUp).mockResolvedValue({
      user: mockUser,
      session: null
    });
    vi.mocked(supabaseService.createProfile).mockResolvedValue({
      full_name: 'Student Name',
      role: 'student'
    });

    const result = await authStore.signUpStudent({
      email: 'student@example.com',
      password: 'password',
      fullName: 'Student Name',
      joinCode: 'ABC123'
    });
    
    expect(result).toBe(true);
    expect(supabaseService.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'student',
        join_code: 'ABC123'
      })
    );
  });

  test('signOut should clear state', async () => {
    vi.mocked(supabaseService.signOut).mockResolvedValue(undefined);

    await authStore.signOut();
    
    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(supabaseService.signOut).toHaveBeenCalled();
  });

  test('updateProfile should update profile state', async () => {
    const updates = { full_name: 'Updated Name' };
    const mockUpdatedProfile = { full_name: 'Updated Name', role: 'teacher' };
    
    vi.mocked(supabaseService.updateProfile).mockResolvedValue(mockUpdatedProfile);

    await authStore.updateProfile(updates);
    
    const state = get(authStore);
    expect(state.profile).toEqual(mockUpdatedProfile);
    expect(supabaseService.updateProfile).toHaveBeenCalledWith(updates);
  });

  test('resetPassword should handle success', async () => {
    vi.mocked(supabaseService.resetPassword).mockResolvedValue(undefined);

    const result = await authStore.resetPassword('test@example.com');
    
    expect(result).toBe(true);
    expect(supabaseService.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  test('resetPassword should handle errors', async () => {
    vi.mocked(supabaseService.resetPassword).mockRejectedValue(new Error('Email not found'));

    const result = await authStore.resetPassword('notfound@example.com');
    
    expect(result).toBe(false);
    const state = get(authStore);
    expect(state.error).toBe('Email not found');
  });
});