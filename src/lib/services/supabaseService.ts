import type { Database, Tables, Inserts, Updates } from '$lib/types/database';

// Type helpers
type TableRecord = Record<string, unknown>;
type FilterOptions = Record<string, unknown>;
type UserMetadata = Record<string, unknown>;

// Main service class to handle all Supabase operations
export class SupabaseService {
	private useSupabase: boolean;
	private readonly storagePrefix: string;

	constructor(storagePrefix: string = 'app') {
		// Supabase is now always available with hardcoded credentials
		// Default to whatever is stored in localStorage, or true if nothing stored
		const storedValue =
			typeof window !== 'undefined' ? localStorage.getItem(`${storagePrefix}_useSupabase`) : null;

		this.useSupabase = storedValue !== null ? storedValue === 'true' : true; // Default to true since Supabase is now available

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
		} catch (_e) {
			console.error(`Error loading ${key} from localStorage:`, _e);
			return defaultValue;
		}
	}

	public saveToStorage<T>(key: string, value: T): void {
		if (typeof window === 'undefined') return;

		try {
			localStorage.setItem(`${this.storagePrefix}_${key}`, JSON.stringify(value));
		} catch (_e) {
			console.error(`Error saving ${key} to localStorage:`, _e);
		}
	}

	public removeFromStorage(key: string): void {
		if (typeof window === 'undefined') return;

		try {
			localStorage.removeItem(`${this.storagePrefix}_${key}`);
		} catch (_e) {
			console.error(`Error removing ${key} from localStorage:`, _e);
		}
	}

	// Generic CRUD operations with fallback to localStorage
	public async getItems<T extends keyof Database['public']['Tables']>(
		table: T,
		options: {
			columns?: string;
			joins?: string;
			filters?: FilterOptions;
		} = {}
	): Promise<Tables<T>[]> {
		// Only try Supabase if enabled
		if (this.useSupabase) {
			try {
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

				let query = supabase.from(table).select(options.columns ?? '*');

				// Add joins if provided
				if (options.joins) {
					// Use type assertion to handle Supabase's complex query builder types
					query = query.select(`*, ${options.joins}`) as typeof query;
				}

				// Add filters if provided
				if (options.filters) {
					for (const [key, value] of Object.entries(options.filters)) {
						query = query.eq(key, value);
					}
				}

				const { data, error } = await query;

				if (error) throw error;

				return data as unknown as Tables<T>[];
			} catch (err) {
				console.error(`Error fetching data from ${String(table)}:`, err);
				// Log more details about the error
				if (err && typeof err === 'object') {
					if ('message' in err) console.error('Error message:', err.message);
					if ('details' in err) console.error('Error details:', err.details);
					if ('status' in err) console.error('Error status:', err.status);
					if ('code' in err) console.error('Error code:', err.code);
				}
				// Return localStorage data as fallback
				return this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []) as unknown as Tables<T>[];
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
			columns?: string;
			joins?: string;
		} = {}
	): Promise<Tables<T> | null> {
		if (this.useSupabase) {
			try {
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

				let query = supabase
					.from(table)
					.select(options.columns ?? '*')
					.eq('id', id);

				// Add joins if provided
				if (options.joins) {
					query = query.select(`*, ${options.joins}`) as typeof query;
				}

				const { data, error } = await query.single();

				if (error) throw error;

				return data as unknown as Tables<T>;
			} catch (err) {
				console.error(`Error fetching item from ${String(table)}:`, err);
				// Fallback to localStorage - search for the item with matching ID
				const items = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
				return items.find((item) => (item as TableRecord).id === id) ?? null;
			}
		} else {
			// Just use localStorage if Supabase is disabled
			const items = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
			return items.find((item) => (item as TableRecord).id === id) ?? null;
		}
	}

	public async insertItem<T extends keyof Database['public']['Tables']>(
		table: T,
		data: Inserts<T>
	): Promise<Tables<T> | null> {
		if (this.useSupabase) {
			try {
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

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
					id: (data as TableRecord).id ?? crypto.randomUUID()
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
				id: (data as TableRecord).id ?? crypto.randomUUID()
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
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

				const { data: updatedData, error } = await supabase
					.from(table)
					.update(data)
					.eq('id', id)
					.select()
					.single();

				if (error) {
					console.error('🚨 Supabase updateItem error:', error);
					console.error('🚨 Update data sent:', JSON.stringify(data, null, 2));
					console.error('🚨 Table:', table, 'ID:', id);
					throw error;
				}

				// Also update localStorage for fallback
				const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
				const updatedItems = existingItems.map((item) =>
					(item as TableRecord).id === id ? updatedData : item
				);
				this.saveToStorage(`${String(table)}`, updatedItems);

				return updatedData as Tables<T>;
			} catch (err) {
				console.error(`Error updating in ${String(table)}:`, err);
				// Fallback to localStorage only
				const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
				const item = existingItems.find((item) => (item as TableRecord).id === id);

				if (!item) return null;

				const updatedItem = { ...item, ...data };
				const updatedItems = existingItems.map((item) =>
					(item as TableRecord).id === id ? updatedItem : item
				);
				this.saveToStorage(`${String(table)}`, updatedItems);
				return updatedItem as Tables<T>;
			}
		} else {
			// Just use localStorage if Supabase is disabled
			const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
			const item = existingItems.find((item) => (item as TableRecord).id === id);

			if (!item) return null;

			const updatedItem = { ...item, ...data };
			const updatedItems = existingItems.map((item) =>
				(item as TableRecord).id === id ? updatedItem : item
			);
			this.saveToStorage(`${String(table)}`, updatedItems);
			return updatedItem as Tables<T>;
		}
	}

	public async deleteItem<T extends keyof Database['public']['Tables']>(
		table: T,
		id: string | Record<string, unknown>
	): Promise<boolean> {
		try {
			if (this.useSupabase) {
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

				let query = supabase.from(table).delete();

				if (typeof id === 'string') {
					// Use regular id-based deletion
					query = query.eq('id', id);
				} else {
					// Handle composite keys
					for (const [key, value] of Object.entries(id)) {
						query = query.eq(key, value);
					}
				}

				const { error } = await query;

				if (error) throw error;
			}

			// Update localStorage (for fallback or when Supabase is disabled)
			if (typeof id === 'string') {
				// Regular id-based deletion from localStorage
				const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
				const itemExists = existingItems.some((item) => (item as TableRecord).id === id);

				if (itemExists) {
					const filteredItems = existingItems.filter((item) => (item as TableRecord).id !== id);
					this.saveToStorage(`${String(table)}`, filteredItems);
					return true;
				}
			} else {
				// Composite key deletion from localStorage
				const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
				const filteredItems = existingItems.filter((item) => {
					// Only keep items that don't match ALL of the composite key values
					for (const [key, value] of Object.entries(id)) {
						if ((item as TableRecord)[key] !== value) {
							return true; // Keep this item if any key doesn't match
						}
					}
					return false; // Filter out items that match all keys
				});

				this.saveToStorage(`${String(table)}`, filteredItems);
				return true;
			}

			return false; // Item didn't exist
		} catch (err) {
			console.error(`Error deleting from ${String(table)}:`, err);
			return false; // Return false on error
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
				// Dynamically import supabase client to ensure it's properly initialized
				const { supabase } = await import('$lib/supabaseClient');

				const { data, error } = await supabase
					.from(table)
					.select(`*, ${relationTable}!${foreignKey}(*)`)
					.eq(`${relationTable}.${foreignKey}`, relationId);

				if (error) throw error;

				return data as unknown as Tables<T>[];
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
			// Dynamically import supabase client to ensure it's properly initialized
			const { supabase } = await import('$lib/supabaseClient');

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

		// Dynamically import supabase client to ensure it's properly initialized
		const { supabase } = await import('$lib/supabaseClient');

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) throw error;
		return data;
	}

	public async signUp(email: string, password: string, userData: UserMetadata) {
		if (!this.useSupabase) return null;

		// Dynamically import supabase client to ensure it's properly initialized
		const { supabase } = await import('$lib/supabaseClient');

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: userData
			}
		});

		if (error) throw error;
		return data;
	}

	public async signOut() {
		if (!this.useSupabase) return;

		// Dynamically import supabase client to ensure it's properly initialized
		const { supabase } = await import('$lib/supabaseClient');

		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	}

	public async resetPassword(email: string) {
		if (!this.useSupabase) return;

		const { supabase } = await import('$lib/supabaseClient');
		const { error } = await supabase.auth.resetPasswordForEmail(email);
		if (error) throw error;
	}

	public async getProfile(userId: string): Promise<Tables<'app_users'> | null> {
		return this.getItemById('app_users', userId);
	}

	public async createProfile(profile: Inserts<'app_users'>): Promise<Tables<'app_users'> | null> {
		return this.insertItem('app_users', profile);
	}

	public async updateProfile(
		userId: string,
		updates: Updates<'app_users'>
	): Promise<Tables<'app_users'> | null> {
		return this.updateItem('app_users', userId, updates);
	}
}

// Create and export a default instance
export const supabaseService = new SupabaseService();

// Export individual model services
export const gradebookService = new SupabaseService('gradebook');
export const jeopardyService = new SupabaseService('jeopardy');
export const observationLogService = new SupabaseService('observation_log');
