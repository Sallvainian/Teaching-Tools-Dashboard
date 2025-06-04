// src/lib/stores/storeFactory.ts
import { writable, derived, get, type Readable, type Writable as _Writable } from 'svelte/store';
import { storeRegistry } from './registry';

/**
 * Options for creating a store
 */
export interface StoreOptions<T> {
  /** Initial value for the store */
  initialValue: T;
  /** Name for the store in the registry */
  name: string;
  /** Optional localStorage key for persistence */
  localStorageKey?: string;
  /** Optional function to validate store updates */
  validator?: (value: T) => boolean;
  /** Optional function to transform value before storing */
  transformer?: (value: T) => unknown;
  /** Optional function to transform value when retrieving from storage */
  reverseTransformer?: (value: unknown) => T;
}

/**
 * Store with additional methods
 */
export interface EnhancedStore<T> extends Readable<T> {
  /** Set the store value */
  set: (value: T) => void;
  /** Update the store value */
  update: (updater: (value: T) => T) => void;
  /** Reset the store to its initial value */
  reset: () => void;
  /** Get the current value synchronously */
  current: () => T;
}

/**
 * Creates a store with standardized patterns
 * @param options Store creation options
 * @returns Enhanced store with additional methods
 */
export function createStore<T>({
  initialValue,
  name,
  localStorageKey,
  validator,
  transformer,
  reverseTransformer
}: StoreOptions<T>): EnhancedStore<T> {
  // Try to load from localStorage if key is provided
  let startValue = initialValue;
  if (localStorageKey && typeof window !== 'undefined') {
    const storedValue = window.localStorage.getItem(localStorageKey);
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue);
        startValue = reverseTransformer ? reverseTransformer(parsed) : parsed;
      } catch (e) {
        console.warn(`Failed to parse stored value for ${name}:`, e);
      }
    }
  }

  // Create the writable store
  const store = writable<T>(startValue);

  // Create the enhanced store
  const enhancedStore: EnhancedStore<T> = {
    subscribe: store.subscribe,

    set: (value: T) => {
      // Validate if validator is provided
      if (validator && !validator(value)) {
        console.warn(`Invalid value for store ${name}:`, value);
        return;
      }

      store.set(value);

      // Persist to localStorage if key is provided
      if (localStorageKey && typeof window !== 'undefined') {
        const valueToStore = transformer ? transformer(value) : value;
        window.localStorage.setItem(localStorageKey, JSON.stringify(valueToStore));
      }
    },

    update: (updater: (value: T) => T) => {
      const currentValue = get(store);
      const newValue = updater(currentValue);

      // Validate if validator is provided
      if (validator && !validator(newValue)) {
        console.warn(`Invalid value for store ${name} after update:`, newValue);
        return;
      }

      store.set(newValue);

      // Persist to localStorage if key is provided
      if (localStorageKey && typeof window !== 'undefined') {
        const valueToStore = transformer ? transformer(newValue) : newValue;
        window.localStorage.setItem(localStorageKey, JSON.stringify(valueToStore));
      }
    },

    reset: () => {
      store.set(initialValue);

      // Remove from localStorage if key is provided
      if (localStorageKey && typeof window !== 'undefined') {
        window.localStorage.removeItem(localStorageKey);
      }
    },

    current: () => get(store)
  };

  // Register the store
  storeRegistry.register(name, enhancedStore);

  return enhancedStore;
}

/**
 * Creates a derived store with standardized patterns
 * @param options Options for creating the derived store
 * @returns Enhanced derived store
 */
export interface DerivedStoreOptions<T, U> {
  /** Name for the store in the registry */
  name: string;
  /** Stores to derive from */
  stores: Readable<T>[];
  /** Function to derive the new value */
  deriveFn: (values: T[]) => U;
}

/**
 * Creates a derived store and registers it
 */
export function createDerivedStore<T, U>({
  name,
  stores,
  deriveFn
}: DerivedStoreOptions<T, U>): Readable<U> {
  const derivedStore = derived(stores, deriveFn);
  storeRegistry.register(name, derivedStore);
  return derivedStore;
}

/**
 * Creates a store slice that represents a subset of a larger store
 * @param parentStore The parent store
 * @param name Name for the slice in the registry
 * @param selector Function to select the slice from the parent
 * @param updater Function to update the parent with the slice value
 * @returns Enhanced store for the slice
 */
export function createStoreSlice<T, U>(
  parentStore: EnhancedStore<T>,
  name: string,
  selector: (state: T) => U,
  updater: (state: T, sliceValue: U) => T
): EnhancedStore<U> {
  // Create a derived store for reading
  const sliceStore = derived(parentStore, $parent => selector($parent));

  // Create the enhanced store
  const enhancedSlice: EnhancedStore<U> = {
    subscribe: sliceStore.subscribe,

    set: (value: U) => {
      parentStore.update(state => updater(state, value));
    },

    update: (updaterFn: (value: U) => U) => {
      parentStore.update(state => {
        const currentSlice = selector(state);
        const newSlice = updaterFn(currentSlice);
        return updater(state, newSlice);
      });
    },

    reset: () => {
      // This is a simplified reset that assumes the parent knows how to reset this slice
      // A more sophisticated implementation might take a resetValue parameter
      parentStore.update(state => {
        const initialSlice = selector(get(parentStore));
        return updater(state, initialSlice);
      });
    },

    current: () => selector(get(parentStore))
  };

  // Register the slice
  storeRegistry.register(name, enhancedSlice);

  return enhancedSlice;
}
