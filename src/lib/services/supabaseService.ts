import { supabase } from '$lib/supabaseClient';
import type { Database, Tables, Inserts, Updates } from '../../supabase';

// Main service class to handle all Supabase operations
export class SupabaseService {
  private useSupabase: boolean;
  private storagePrefix: string;

  constructor(storagePrefix: string = 'app') {
    // Determine if we should use Supabase based on available credentials
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    // Default to whatever is stored in localStorage, or true if nothing stored
    const storedValue = typeof window !== 'undefined' 
      ? localStorage.getItem(`${storagePrefix}_useSupabase`)
      : null;
      
    this.useSupabase = storedValue !== null 
      ? storedValue === 'true'
      : (supabaseUrl !== '' && supabaseKey !== '');
      
    this.storagePrefix = storagePrefix;
  }

  // Getters and setters for useSupabase flag
  public isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  public setUseSupabase(value: boolean): void {
    this.useSupabase = value;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${this.storagePrefix}_useSupabase`, String(value));
    }
  }

  // LocalStorage helpers
  public loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = localStorage.getItem(`${this.storagePrefix}_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  public saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`${this.storagePrefix}_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  public removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${this.storagePrefix}_${key}`);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  }

  // Generic CRUD operations with fallback to localStorage
  public async getItems<T extends keyof Database['public']['Tables']>(
    table: T, 
    options: {
      columns?: string,
      joins?: string,
      filters?: Record<string, any>
    } = {}
  ): Promise<Tables<T>[]> {
    // Only try Supabase if enabled
    if (this.useSupabase) {
      try {
        let query = supabase
          .from(table)
          .select(options.columns || '*');
        
        // Add joins if provided
        if (options.joins) {
          query = query.select(`*, ${options.joins}`);
        }
        
        // Add filters if provided
        if (options.filters) {
          for (const [key, value] of Object.entries(options.filters)) {
            query = query.eq(key, value);
          }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data as Tables<T>[];
      } catch (err) {
        console.error(`Error fetching data from ${String(table)}:`, err);
        // Return localStorage data as fallback
        return this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      }
    } else {
      // Just use localStorage if Supabase is disabled
      return this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
    }
  }

  public async getItemById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    options: {
      columns?: string,
      joins?: string
    } = {}
  ): Promise<Tables<T> | null> {
    if (this.useSupabase) {
      try {
        let query = supabase
          .from(table)
          .select(options.columns || '*')
          .eq('id', id);
        
        // Add joins if provided
        if (options.joins) {
          query = query.select(`*, ${options.joins}`);
        }
        
        const { data, error } = await query.single();
        
        if (error) throw error;
        
        return data as Tables<T>;
      } catch (err) {
        console.error(`Error fetching item from ${String(table)}:`, err);
        // Fallback to localStorage - search for the item with matching ID
        const items = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        return items.find(item => (item as any).id === id) || null;
      }
    } else {
      // Just use localStorage if Supabase is disabled
      const items = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      return items.find(item => (item as any).id === id) || null;
    }
  }

  public async insertItem<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Inserts<T>
  ): Promise<Tables<T> | null> {
    if (this.useSupabase) {
      try {
        const { data: insertedData, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        
        if (error) throw error;
        
        // Also update localStorage for fallback
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        this.saveToStorage(`${String(table)}`, [...existingItems, insertedData]);
        
        return insertedData as Tables<T>;
      } catch (err) {
        console.error(`Error inserting into ${String(table)}:`, err);
        // Fallback to localStorage only
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        // For localStorage we need an ID - use the one provided or generate a random one
        const itemWithId = {
          ...data,
          id: (data as any).id || crypto.randomUUID()
        };
        const newItems = [...existingItems, itemWithId];
        this.saveToStorage(`${String(table)}`, newItems);
        return itemWithId as Tables<T>;
      }
    } else {
      // Just use localStorage if Supabase is disabled
      const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      // For localStorage we need an ID - use the one provided or generate a random one
      const itemWithId = {
        ...data,
        id: (data as any).id || crypto.randomUUID()
      };
      const newItems = [...existingItems, itemWithId];
      this.saveToStorage(`${String(table)}`, newItems);
      return itemWithId as Tables<T>;
    }
  }

  public async updateItem<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    data: Updates<T>
  ): Promise<Tables<T> | null> {
    if (this.useSupabase) {
      try {
        const { data: updatedData, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Also update localStorage for fallback
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        const updatedItems = existingItems.map(item => 
          (item as any).id === id ? updatedData : item
        );
        this.saveToStorage(`${String(table)}`, updatedItems);
        
        return updatedData as Tables<T>;
      } catch (err) {
        console.error(`Error updating in ${String(table)}:`, err);
        // Fallback to localStorage only
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        const item = existingItems.find(item => (item as any).id === id);
        
        if (!item) return null;
        
        const updatedItem = { ...item, ...data };
        const updatedItems = existingItems.map(item => 
          (item as any).id === id ? updatedItem : item
        );
        this.saveToStorage(`${String(table)}`, updatedItems);
        return updatedItem as Tables<T>;
      }
    } else {
      // Just use localStorage if Supabase is disabled
      const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      const item = existingItems.find(item => (item as any).id === id);
      
      if (!item) return null;
      
      const updatedItem = { ...item, ...data };
      const updatedItems = existingItems.map(item => 
        (item as any).id === id ? updatedItem : item
      );
      this.saveToStorage(`${String(table)}`, updatedItems);
      return updatedItem as Tables<T>;
    }
  }

  public async deleteItem<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Also update localStorage for fallback
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        const filteredItems = existingItems.filter(item => (item as any).id !== id);
        this.saveToStorage(`${String(table)}`, filteredItems);
        
        return true;
      } catch (err) {
        console.error(`Error deleting from ${String(table)}:`, err);
        // Fallback to localStorage only
        const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
        const filteredItems = existingItems.filter(item => (item as any).id !== id);
        this.saveToStorage(`${String(table)}`, filteredItems);
        return true;
      }
    } else {
      // Just use localStorage if Supabase is disabled
      const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      const filteredItems = existingItems.filter(item => (item as any).id !== id);
      this.saveToStorage(`${String(table)}`, filteredItems);
      return true;
    }
  }

  // Specialized methods for relationships and more complex operations
  public async getItemsWithRelation<T extends keyof Database['public']['Tables']>(
    table: T,
    relationTable: string,
    foreignKey: string,
    relationId: string
  ): Promise<Tables<T>[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(`*, ${relationTable}!${foreignKey}(*)`)
          .eq(`${relationTable}.${foreignKey}`, relationId);
        
        if (error) throw error;
        
        return data as Tables<T>[];
      } catch (err) {
        console.error(`Error fetching related data from ${String(table)}:`, err);
        // Fallback to localStorage - this is harder with relations
        // A proper implementation would require understanding the schema
        return [];
      }
    } else {
      // Limited localStorage implementation - would need custom logic per relationship
      return [];
    }
  }

  // Authentication helpers that leverage Supabase auth
  public async getCurrentUser() {
    if (!this.useSupabase) return null;
    
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  }

  public async signIn(email: string, password: string) {
    if (!this.useSupabase) return null;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error signing in:', err);
      throw err;
    }
  }

  public async signUp(email: string, password: string, userData: any) {
    if (!this.useSupabase) return null;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error signing up:', err);
      throw err;
    }
  }

  public async signOut() {
    if (!this.useSupabase) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  }
}

// Create and export a default instance
export const supabaseService = new SupabaseService();

// Export individual model services
export const gradebookService = new SupabaseService('gradebook');
export const jeopardyService = new SupabaseService('jeopardy');
export const observationLogService = new SupabaseService('observation_log');