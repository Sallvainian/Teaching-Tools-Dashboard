// src/lib/utils/lazyLoad.ts
import { writable, type Writable } from 'svelte/store';
import { errorService, ErrorSeverity, ErrorSource } from '$lib/services/errorService';

/**
 * Status of a lazy loaded module
 */
export enum LazyLoadStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * State of a lazy loaded module
 */
export interface LazyLoadState<T> {
  status: LazyLoadStatus;
  module: T | null;
  error: Error | null;
}

/**
 * Options for lazy loading
 */
export interface LazyLoadOptions {
  /** Automatically load the module when created */
  autoLoad?: boolean;
  /** Retry loading on error */
  retry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * Default options for lazy loading
 */
const DEFAULT_LAZY_LOAD_OPTIONS: LazyLoadOptions = {
  autoLoad: false,
  retry: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Create a lazy loaded module
 * @param importFn Function that imports the module
 * @param options Lazy loading options
 * @returns Store with lazy loaded module state and load function
 */
export function createLazyLoad<T extends object>(
  importFn: () => Promise<{ default: T } | T>,
  options: LazyLoadOptions = {}
) {
  const opts = { ...DEFAULT_LAZY_LOAD_OPTIONS, ...options };

  // Create store for lazy loaded module state
  const state: Writable<LazyLoadState<T>> = writable({
    status: LazyLoadStatus.IDLE,
    module: null,
    error: null
  });

  // Track retry count
  let retryCount = 0;

  // Load the module
  async function load(): Promise<T | null> {
    // Update state to loading
    state.update(s => ({ ...s, status: LazyLoadStatus.LOADING }));

    try {
      // Import the module
      const imported = await importFn();

      // Get the default export if it exists
      const module = ('default' in imported ? imported.default : imported) as T;

      // Update state to loaded
      state.update(s => ({
        status: LazyLoadStatus.LOADED,
        module: module as T,
        error: null
      }));

      // Reset retry count
      retryCount = 0;

      return module as T;
    } catch (error) {
      // Log the error
      errorService.logError({
        message: 'Failed to lazy load module',
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.UNKNOWN,
        originalError: error,
        retryable: opts.retry === true
      });

      // Update state to error
      state.update(s => ({
        status: LazyLoadStatus.ERROR,
        module: null,
        error: error instanceof Error ? error : new Error(String(error))
      }));

      // Retry if enabled and not exceeded max retries
      if (opts.retry && retryCount < (opts.maxRetries || 0)) {
        retryCount++;

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));

        // Try again
        return load();
      }

      return null;
    }
  }

  // Auto-load if enabled
  if (opts.autoLoad) {
    void load();
  }

  return {
    subscribe: state.subscribe,
    load
  };
}

/**
 * Create a lazy loaded component
 * @param importFn Function that imports the component
 * @param options Lazy loading options
 * @returns Store with lazy loaded component state and load function
 */
export function createLazyComponent<T extends object = any>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  return createLazyLoad(importFn, options);
}

/**
 * Preload multiple modules
 * @param imports Object with import functions
 * @returns Promise that resolves when all modules are loaded
 */
export async function preloadModules(
  imports: Record<string, () => Promise<any>>
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const errors: Record<string, Error> = {};

  // Load all modules in parallel
  await Promise.all(
    Object.entries(imports).map(async ([key, importFn]) => {
      try {
        const imported = await importFn();
        results[key] = 'default' in imported ? imported.default : imported;
      } catch (error) {
        errorService.logError({
          message: `Failed to preload module: ${key}`,
          severity: ErrorSeverity.ERROR,
          source: ErrorSource.UNKNOWN,
          originalError: error,
          retryable: false
        });

        errors[key] = error instanceof Error ? error : new Error(String(error));
      }
    })
  );

  // Log summary if there were errors
  if (Object.keys(errors).length > 0) {
    console.error(`Failed to preload ${Object.keys(errors).length} modules:`, errors);
  }

  return results;
}

/**
 * Dynamically import a module with error handling
 * @param importFn Function that imports the module
 * @returns Promise that resolves to the module or null if error
 */
export async function dynamicImport<T extends object>(
  importFn: () => Promise<{ default: T } | T>
): Promise<T | null> {
  try {
    const imported = await importFn();
    return ('default' in imported ? imported.default : imported) as T;
  } catch (error) {
    errorService.logError({
      message: 'Failed to dynamically import module',
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN,
      originalError: error,
      retryable: false
    });

    return null;
  }
}
