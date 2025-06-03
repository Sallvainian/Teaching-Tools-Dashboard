// src/lib/stores/registry.ts
import { writable, derived, type Readable, type Writable } from 'svelte/store';

/**
 * StoreRegistry provides a centralized registry for all application stores.
 * It helps standardize store patterns, improve type safety, and make debugging easier.
 */
export class StoreRegistry {
  private stores: Map<string, Readable<any>> = new Map();
  private writableStores: Map<string, Writable<any>> = new Map();
  
  /**
   * Register a store with the registry
   * @param name Unique name for the store
   * @param store The store to register
   */
  register<T>(name: string, store: Readable<T>): void {
    if (this.stores.has(name)) {
      console.warn(`Store with name "${name}" already exists. Overwriting.`);
    }
    this.stores.set(name, store);
    
    // If it's a writable store, also register it in the writableStores map
    if ('set' in store && 'update' in store) {
      this.writableStores.set(name, store as Writable<T>);
    }
  }
  
  /**
   * Get a store by name
   * @param name The name of the store to retrieve
   * @returns The store or undefined if not found
   */
  get<T>(name: string): Readable<T> | undefined {
    return this.stores.get(name) as Readable<T> | undefined;
  }
  
  /**
   * Get a writable store by name
   * @param name The name of the writable store to retrieve
   * @returns The writable store or undefined if not found
   */
  getWritable<T>(name: string): Writable<T> | undefined {
    return this.writableStores.get(name) as Writable<T> | undefined;
  }
  
  /**
   * List all registered store names
   * @returns Array of store names
   */
  listStores(): string[] {
    return Array.from(this.stores.keys());
  }
  
  /**
   * Create a derived store from multiple registered stores
   * @param dependencies Array of store names to depend on
   * @param deriveFn Function to derive the new value
   * @returns A derived store
   */
  createDerived<T, U>(
    dependencies: string[], 
    deriveFn: (values: T[]) => U
  ): Readable<U> {
    const stores = dependencies.map(name => {
      const store = this.get(name);
      if (!store) {
        throw new Error(`Store "${name}" not found in registry`);
      }
      return store;
    });
    
    return derived(stores, (values) => deriveFn(values as T[]));
  }
  
  /**
   * Create and register a new writable store
   * @param name Unique name for the store
   * @param initialValue Initial value for the store
   * @returns The created writable store
   */
  createWritable<T>(name: string, initialValue: T): Writable<T> {
    const store = writable<T>(initialValue);
    this.register(name, store);
    return store;
  }
  
  /**
   * Create and register a new derived store
   * @param name Unique name for the store
   * @param dependencies Array of store names to depend on
   * @param deriveFn Function to derive the new value
   * @returns The created derived store
   */
  createAndRegisterDerived<T, U>(
    name: string,
    dependencies: string[], 
    deriveFn: (values: T[]) => U
  ): Readable<U> {
    const derivedStore = this.createDerived(dependencies, deriveFn);
    this.register(name, derivedStore);
    return derivedStore;
  }
  
  /**
   * Debug helper to log the current state of all stores
   */
  debugStores(): void {
    console.group('Store Registry Debug');
    console.log('Registered stores:', this.listStores());
    
    this.stores.forEach((store, name) => {
      let value: any;
      const unsubscribe = store.subscribe(v => { value = v; });
      console.log(`${name}:`, value);
      unsubscribe();
    });
    
    console.groupEnd();
  }
}

// Create and export a singleton instance
export const storeRegistry = new StoreRegistry();