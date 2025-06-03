// src/lib/services/cacheService.ts
import { openDB, type IDBPDatabase } from 'idb';
import { errorService, ErrorSeverity, ErrorSource } from './errorService';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number | null;
  tags: string[];
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Time-to-live in milliseconds (null means no expiration) */
  ttl?: number | null;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Force refresh even if cache is valid */
  forceRefresh?: boolean;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  tags: [],
  forceRefresh: false
};

/**
 * Cache service for storing and retrieving data
 */
export class CacheService {
  private db: IDBPDatabase | null = null;
  private dbName: string;
  private storeName: string;
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private isInitialized = false;

  /**
   * Create a new cache service
   * @param dbName IndexedDB database name
   * @param storeName IndexedDB store name
   */
  constructor(dbName = 'app-cache', storeName = 'cache-store') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.dbPromise = openDB(this.dbName, 1, {
        upgrade: (db) => {
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
            store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }
        }
      });

      this.db = await this.dbPromise;
      this.isInitialized = true;

      // Clean up expired entries
      void this.cleanExpired();
    } catch (error) {
      errorService.logError({
        message: 'Failed to initialize cache service',
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
      
      // Fallback to memory cache if IndexedDB is not available
      console.warn('IndexedDB not available, falling back to memory cache');
    }
  }

  /**
   * Get the database instance, initializing if necessary
   */
  private async getDb(): Promise<IDBPDatabase> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db && this.dbPromise) {
      this.db = await this.dbPromise;
    }

    if (!this.db) {
      throw new Error('Cache database not initialized');
    }

    return this.db;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
    
    try {
      const db = await this.getDb();
      
      const expiresAt = opts.ttl !== null ? Date.now() + (opts.ttl || 0) : null;
      
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt,
        tags: opts.tags || []
      };
      
      await db.put(this.storeName, entry);
    } catch (error) {
      errorService.logError({
        message: `Failed to set cache entry: ${key}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      
      const entry = await db.get(this.storeName, key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        return null;
      }
      
      // Check if entry is expired
      if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        // Remove expired entry
        await db.delete(this.storeName, key);
        return null;
      }
      
      return entry.value;
    } catch (error) {
      errorService.logError({
        message: `Failed to get cache entry: ${key}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
      
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(this.storeName, key);
    } catch (error) {
      errorService.logError({
        message: `Failed to delete cache entry: ${key}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
    }
  }

  /**
   * Clear all values from the cache
   */
  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      await db.clear(this.storeName);
    } catch (error) {
      errorService.logError({
        message: 'Failed to clear cache',
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
    }
  }

  /**
   * Invalidate cache entries by tags
   * @param tags Tags to invalidate
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (tags.length === 0) {
      return;
    }
    
    try {
      const db = await this.getDb();
      
      // Get all entries with matching tags
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const tagIndex = store.index('tags');
      
      for (const tag of tags) {
        const keys = await tagIndex.getAllKeys(tag);
        
        for (const key of keys) {
          await store.delete(key);
        }
      }
      
      await tx.done;
    } catch (error) {
      errorService.logError({
        message: `Failed to invalidate cache by tags: ${tags.join(', ')}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpired(): Promise<void> {
    try {
      const db = await this.getDb();
      
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const expiresAtIndex = store.index('expiresAt');
      
      // Get all entries that have expired
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      
      // Get all keys where expiresAt is not null and less than now
      const keys = await expiresAtIndex.getAllKeys(range);
      
      for (const key of keys) {
        await store.delete(key);
      }
      
      await tx.done;
    } catch (error) {
      errorService.logError({
        message: 'Failed to clean expired cache entries',
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
    }
  }

  /**
   * Get cache entry metadata
   * @param key Cache key
   * @returns Cache entry metadata or null if not found
   */
  async getMetadata(key: string): Promise<Omit<CacheEntry<unknown>, 'value'> | null> {
    try {
      const db = await this.getDb();
      
      const entry = await db.get(this.storeName, key) as CacheEntry<unknown> | undefined;
      
      if (!entry) {
        return null;
      }
      
      const { value, ...metadata } = entry;
      return metadata;
    } catch (error) {
      errorService.logError({
        message: `Failed to get cache metadata: ${key}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
      
      return null;
    }
  }

  /**
   * Check if a cache entry exists and is valid
   * @param key Cache key
   * @returns True if the entry exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      
      const entry = await db.get(this.storeName, key) as CacheEntry<unknown> | undefined;
      
      if (!entry) {
        return false;
      }
      
      // Check if entry is expired
      if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        return false;
      }
      
      return true;
    } catch (error) {
      errorService.logError({
        message: `Failed to check cache entry: ${key}`,
        severity: ErrorSeverity.WARNING,
        source: ErrorSource.DATABASE,
        originalError: error,
        retryable: false
      });
      
      return false;
    }
  }
}

/**
 * Singleton instance of the cache service
 */
export const cacheService = new CacheService();

/**
 * Initialize the cache service
 */
export function initializeCache(): Promise<void> {
  return cacheService.initialize();
}

/**
 * Fetch data with caching
 * @param key Cache key
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Fetched or cached data
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
  
  // Check cache first unless force refresh is specified
  if (!opts.forceRefresh) {
    const cachedValue = await cacheService.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
  }
  
  // Fetch fresh data
  const value = await fetcher();
  
  // Cache the result
  await cacheService.set(key, value, opts);
  
  return value;
}

/**
 * Fetch data with stale-while-revalidate pattern
 * @param key Cache key
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Fetched or cached data
 */
export async function fetchWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
  
  // Check cache first
  const cachedValue = await cacheService.get<T>(key);
  
  // If we have a cached value, use it and revalidate in the background
  if (cachedValue !== null) {
    // Revalidate in the background
    void (async () => {
      try {
        const freshValue = await fetcher();
        await cacheService.set(key, freshValue, opts);
      } catch (error) {
        // Ignore errors during background revalidation
        console.warn(`Background revalidation failed for ${key}:`, error);
      }
    })();
    
    return cachedValue;
  }
  
  // No cached value, fetch fresh data
  const value = await fetcher();
  
  // Cache the result
  await cacheService.set(key, value, opts);
  
  return value;
}

/**
 * Prefetch data and store in cache
 * @param key Cache key
 * @param fetcher Function to fetch data
 * @param options Cache options
 */
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const value = await fetcher();
    await cacheService.set(key, value, options);
  } catch (error) {
    errorService.logError({
      message: `Prefetch failed for ${key}`,
      severity: ErrorSeverity.WARNING,
      source: ErrorSource.NETWORK,
      originalError: error,
      retryable: false
    });
  }
}