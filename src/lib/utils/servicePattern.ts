// src/lib/utils/servicePattern.ts
import { writable, derived, type Readable, type Writable } from 'svelte/store';
import { errorService, ErrorSeverity, ErrorSource } from '$lib/services/errorService';

/**
 * Service function result
 */
export interface ServiceResult<T, E = Error> {
  /** Result data */
  data: T | null;
  /** Error if any */
  error: E | null;
  /** Whether the operation is loading */
  loading: boolean;
  /** Whether the operation was successful */
  success: boolean;
}

/**
 * Service function options
 */
export interface ServiceOptions {
  /** Error source for logging */
  errorSource?: ErrorSource;
  /** Error severity for logging */
  errorSeverity?: ErrorSeverity;
  /** Whether to throw errors */
  throwErrors?: boolean;
  /** Whether to retry on error */
  retry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * Default service options
 */
const DEFAULT_SERVICE_OPTIONS: ServiceOptions = {
  errorSource: ErrorSource.UNKNOWN,
  errorSeverity: ErrorSeverity.ERROR,
  throwErrors: false,
  retry: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Create a service function that handles errors and loading state
 * @param fn Service function implementation
 * @param options Service options
 * @returns Wrapped service function
 */
export function createService<T, P extends any[] = [], E extends Error = Error>(
  fn: (...args: P) => Promise<T>,
  options: ServiceOptions = {}
): (...args: P) => Promise<ServiceResult<T, E>> {
  const opts = { ...DEFAULT_SERVICE_OPTIONS, ...options };

  return async (...args: P): Promise<ServiceResult<T, E>> => {
    let retryCount = 0;

    const tryOperation = async (): Promise<ServiceResult<T, E>> => {
      try {
        const data = await fn(...args);

        return {
          data,
          error: null,
          loading: false,
          success: true
        };
      } catch (error) {
        // Log the error
        errorService.logError({
          message: `Service error: ${error instanceof Error ? error.message : String(error)}`,
          severity: opts.errorSeverity || ErrorSeverity.ERROR,
          source: opts.errorSource || ErrorSource.UNKNOWN,
          originalError: error,
          retryable: (opts.retry && retryCount < (opts.maxRetries || 0)) === true
        });

        // Retry if enabled and not exceeded max retries
        if (opts.retry && retryCount < (opts.maxRetries || 0)) {
          retryCount++;

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));

          // Try again
          return tryOperation();
        }

        // Throw if throwErrors is enabled
        if (opts.throwErrors) {
          throw error;
        }

        return {
          data: null,
          error: error as E,
          loading: false,
          success: false
        };
      }
    };

    return tryOperation();
  };
}

/**
 * Create a service store that handles errors and loading state
 * @param fn Service function implementation
 * @param initialArgs Initial arguments for the service function
 * @param options Service options
 * @returns Service store
 */
export function createServiceStore<T, P extends any[] = [], E extends Error = Error>(
  fn: (...args: P) => Promise<T>,
  initialArgs: P,
  options: ServiceOptions = {}
): {
  subscribe: Readable<ServiceResult<T, E>>['subscribe'];
  execute: (...args: P) => Promise<ServiceResult<T, E>>;
  reset: () => void;
} {
  const service = createService(fn, options);

  // Create store for service result
  const store = writable<ServiceResult<T, E>>({
    data: null,
    error: null,
    loading: false,
    success: false
  });

  // Execute the service function with the given arguments
  const execute = async (...args: P): Promise<ServiceResult<T, E>> => {
    // Set loading state
    store.update(state => ({ ...state, loading: true }));

    try {
      const result = await service(...args);

      // Update store with result
      store.set(result as ServiceResult<T, E>);

      return result as ServiceResult<T, E>;
    } catch (error) {
      // Update store with error
      const errorResult: ServiceResult<T, E> = {
        data: null,
        error: error as E,
        loading: false,
        success: false
      };

      store.set(errorResult);

      return errorResult;
    }
  };

  // Reset the store to initial state
  const reset = () => {
    store.set({
      data: null,
      error: null,
      loading: false,
      success: false
    });
  };

  // Execute with initial arguments
  if (initialArgs.length > 0) {
    void execute(...initialArgs);
  }

  return {
    subscribe: store.subscribe,
    execute,
    reset
  };
}

/**
 * Extract business logic from a component into a service
 * @param logic Business logic function
 * @param options Service options
 * @returns Service function
 */
export function extractBusinessLogic<T, P extends any[] = []>(
  logic: (...args: P) => Promise<T> | T,
  options: ServiceOptions = {}
): (...args: P) => Promise<ServiceResult<T>> {
  // Convert synchronous function to async if needed
  const asyncLogic = async (...args: P): Promise<T> => {
    return logic(...args);
  };

  return createService(asyncLogic, options);
}

/**
 * Create a service module with multiple service functions
 * @param services Object with service functions
 * @returns Service module
 */
export function createServiceModule<T extends Record<string, (...args: any[]) => Promise<any>>>(
  services: T
): T & { __serviceModule: true } {
  return {
    ...services,
    __serviceModule: true
  };
}

/**
 * Check if an object is a service module
 * @param obj Object to check
 * @returns True if the object is a service module
 */
export function isServiceModule(obj: any): obj is Record<string, any> & { __serviceModule: true } {
  return typeof obj === 'object' && '__serviceModule' in obj;
}

/**
 * Create a resource service for CRUD operations
 * @param resource Resource name
 * @param api API functions
 * @param options Service options
 * @returns Resource service
 */
export function createResourceService<T, ID = string>(
  resource: string,
  api: {
    getAll: () => Promise<T[]>;
    getById: (id: ID) => Promise<T>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: ID, data: Partial<T>) => Promise<T>;
    delete: (id: ID) => Promise<void>;
  },
  options: ServiceOptions = {}
) {
  const getAll = createService(api.getAll, {
    ...options,
    errorSource: ErrorSource.API,
    errorSeverity: ErrorSeverity.ERROR
  });

  const getById = createService(api.getById, {
    ...options,
    errorSource: ErrorSource.API,
    errorSeverity: ErrorSeverity.ERROR
  });

  const create = createService(api.create, {
    ...options,
    errorSource: ErrorSource.API,
    errorSeverity: ErrorSeverity.ERROR
  });

  const update = createService(api.update, {
    ...options,
    errorSource: ErrorSource.API,
    errorSeverity: ErrorSeverity.ERROR
  });

  const remove = createService(api.delete, {
    ...options,
    errorSource: ErrorSource.API,
    errorSeverity: ErrorSeverity.ERROR
  });

  return createServiceModule({
    getAll,
    getById,
    create,
    update,
    delete: remove
  });
}
