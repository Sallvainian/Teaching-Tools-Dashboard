import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SupabaseService } from './supabaseService';
import type { Tables } from '$lib/types/database';

// Mock the Supabase client
vi.mock('$lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis()
    })),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn()
    }
  }
}));

// Mock browser check
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    service = new SupabaseService();
  });

  describe('getItems', () => {
    test('should fetch items from Supabase when available', async () => {
      const mockData = [{ id: '1', name: 'Test Item' }];
      const { supabase } = await import('$lib/supabaseClient');
      
      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getItems('test_table');

      expect(supabase.from).toHaveBeenCalledWith('test_table');
      expect(result).toEqual(mockData);
    });

    test('should fallback to localStorage on Supabase error', async () => {
      const mockLocalData = [{ id: '2', name: 'Local Item' }];
      localStorage.setItem('gradebook_test_table', JSON.stringify(mockLocalData));

      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getItems('test_table');

      expect(result).toEqual(mockLocalData);
    });

    test('should return empty array when no data exists', async () => {
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getItems('empty_table');

      expect(result).toEqual([]);
    });
  });

  describe('createItem', () => {
    test('should create item in Supabase and localStorage', async () => {
      const newItem = { name: 'New Item' };
      const createdItem = { id: '3', ...newItem };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdItem, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.createItem('test_table', newItem);

      expect(mockQuery.insert).toHaveBeenCalledWith(newItem);
      expect(result).toEqual(createdItem);
      
      // Check localStorage was updated
      const localData = JSON.parse(localStorage.getItem('gradebook_test_table') || '[]');
      expect(localData).toContainEqual(createdItem);
    });

    test('should handle creation errors', async () => {
      const newItem = { name: 'New Item' };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Creation failed') })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(service.createItem('test_table', newItem)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateItem', () => {
    test('should update item with single key', async () => {
      const updates = { name: 'Updated Name' };
      const updatedItem = { id: '1', name: 'Updated Name' };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedItem, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.updateItem('test_table', '1', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedItem);
    });

    test('should update item with composite key', async () => {
      const compositeKey = { student_id: '1', assignment_id: '2' };
      const updates = { points_earned: 95 };
      const updatedItem = { ...compositeKey, points_earned: 95 };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedItem, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.updateItem('grades', compositeKey, updates);

      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledTimes(2);
      expect(mockQuery.eq).toHaveBeenCalledWith('student_id', '1');
      expect(mockQuery.eq).toHaveBeenCalledWith('assignment_id', '2');
      expect(result).toEqual(updatedItem);
    });
  });

  describe('deleteItem', () => {
    test('should delete item from Supabase and localStorage', async () => {
      // Setup localStorage with existing data
      const existingData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      localStorage.setItem('gradebook_test_table', JSON.stringify(existingData));

      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await service.deleteItem('test_table', '1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      
      // Check localStorage was updated
      const localData = JSON.parse(localStorage.getItem('gradebook_test_table') || '[]');
      expect(localData).toHaveLength(1);
      expect(localData[0].id).toBe('2');
    });
  });

  describe('Auth methods', () => {
    test('signIn should authenticate user', async () => {
      const mockAuthData = {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' }
      };

      const { supabase } = await import('$lib/supabaseClient');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      const result = await service.signIn('test@example.com', 'password');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
      expect(result).toEqual(mockAuthData);
    });

    test('signUp should create new user', async () => {
      const mockAuthData = {
        user: { id: '456', email: 'new@example.com' },
        session: null
      };

      const { supabase } = await import('$lib/supabaseClient');
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null
      });

      const result = await service.signUp('new@example.com', 'password', { 
        full_name: 'New User' 
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: {
          data: { full_name: 'New User' }
        }
      });
      expect(result).toEqual(mockAuthData);
    });

    test('signOut should sign out user', async () => {
      const { supabase } = await import('$lib/supabaseClient');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await service.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    test('resetPassword should send reset email', async () => {
      const { supabase } = await import('$lib/supabaseClient');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ 
        data: {}, 
        error: null 
      });

      await service.resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Profile methods', () => {
    test('getProfile should fetch user profile', async () => {
      const mockProfile = { id: '123', full_name: 'Test User', role: 'teacher' };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getProfile('123');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual(mockProfile);
    });

    test('createProfile should create new profile', async () => {
      const newProfile = { 
        id: '789', 
        email: 'test@example.com', 
        full_name: 'Test User',
        role: 'teacher' as const
      };
      
      const { supabase } = await import('$lib/supabaseClient');
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newProfile, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await service.createProfile(newProfile);

      expect(mockQuery.insert).toHaveBeenCalledWith(newProfile);
      expect(result).toEqual(newProfile);
    });
  });

  describe('localStorage fallback', () => {
    test('should handle localStorage when Supabase is unavailable', async () => {
      // Force service to not use Supabase
      const localService = new SupabaseService('test', false);
      
      // Test creating item only in localStorage
      const newItem = { name: 'Local Only Item' };
      const result = await localService.createItem('test_table', newItem);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Local Only Item');
      
      // Verify it's in localStorage
      const localData = JSON.parse(localStorage.getItem('test_test_table') || '[]');
      expect(localData).toHaveLength(1);
      expect(localData[0].name).toBe('Local Only Item');
    });
  });
});