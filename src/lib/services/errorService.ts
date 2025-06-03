// src/lib/services/errorService.ts
import { writable, derived } from 'svelte/store';
import { createStore, createDerivedStore } from '$lib/stores/storeFactory';
import { storeRegistry } from '$lib/stores/registry';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error source categories
 */
export enum ErrorSource {
  NETWORK = 'network',
  API = 'api',
  DATABASE = 'database',
  AUTH = 'auth',
  UI = 'ui',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Structured error object
 */
export interface AppError {
  id: string;
  message: string;
  details?: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: number;
  originalError?: unknown;
  handled: boolean;
  retryable: boolean;
  userFriendlyMessage?: string;
  recoveryAction?: () => Promise<void>;
}

/**
 * Error state interface
 */
interface ErrorState {
  errors: AppError[];
  lastError: AppError | null;
  hasActiveErrors: boolean;
}

/**
 * Create a unique ID for errors
 */
function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a user-friendly message based on error source and severity
 */
function createUserFriendlyMessage(error: Partial<AppError>): string {
  const { source, severity } = error;

  // Default messages by source and severity
  const messages = {
    [ErrorSource.NETWORK]: {
      [ErrorSeverity.ERROR]: 'Unable to connect to the server. Please check your internet connection.',
      [ErrorSeverity.WARNING]: 'Network connection is unstable.',
      [ErrorSeverity.INFO]: 'Network status information.',
      [ErrorSeverity.CRITICAL]: 'Network connection lost. Unable to communicate with server.',
      default: 'A network issue occurred.'
    },
    [ErrorSource.API]: {
      [ErrorSeverity.ERROR]: 'The server encountered an error processing your request.',
      [ErrorSeverity.WARNING]: 'The server response was unexpected.',
      [ErrorSeverity.INFO]: 'API information message.',
      [ErrorSeverity.CRITICAL]: 'Critical API failure. Service may be unavailable.',
      default: 'An issue occurred with the server.'
    },
    [ErrorSource.DATABASE]: {
      [ErrorSeverity.ERROR]: 'Unable to access your data at this time.',
      [ErrorSeverity.WARNING]: 'Some data may be unavailable or outdated.',
      [ErrorSeverity.INFO]: 'Database information message.',
      [ErrorSeverity.CRITICAL]: 'Database connection lost. Data cannot be accessed.',
      default: 'A database issue occurred.'
    },
    [ErrorSource.AUTH]: {
      [ErrorSeverity.ERROR]: 'Authentication failed. Please try signing in again.',
      [ErrorSeverity.WARNING]: 'Your session may have expired.',
      [ErrorSeverity.INFO]: 'Authentication information.',
      [ErrorSeverity.CRITICAL]: 'Critical authentication failure. Security may be compromised.',
      default: 'An authentication issue occurred.'
    },
    [ErrorSource.UI]: {
      [ErrorSeverity.ERROR]: 'The application encountered an error.',
      [ErrorSeverity.WARNING]: 'Some features may not work correctly.',
      [ErrorSeverity.INFO]: 'User interface information.',
      [ErrorSeverity.CRITICAL]: 'Critical UI failure. Application may be unusable.',
      default: 'A user interface issue occurred.'
    },
    [ErrorSource.VALIDATION]: {
      [ErrorSeverity.ERROR]: 'The information provided is invalid.',
      [ErrorSeverity.WARNING]: 'Some information may be incorrect.',
      [ErrorSeverity.INFO]: 'Validation information.',
      [ErrorSeverity.CRITICAL]: 'Critical validation failure. Cannot proceed with operation.',
      default: 'Please check the information you provided.'
    },
    [ErrorSource.UNKNOWN]: {
      [ErrorSeverity.ERROR]: 'An unexpected error occurred.',
      [ErrorSeverity.WARNING]: 'Something unexpected happened.',
      [ErrorSeverity.INFO]: 'System information message.',
      [ErrorSeverity.CRITICAL]: 'Critical system failure. Please contact support.',
      default: 'An unknown issue occurred.'
    },
    default: 'An unexpected error occurred. Please try again later.'
  };

  if (!source || !severity) {
    return messages.default;
  }

  const sourceMessages = messages[source] || messages.default;
  return (typeof sourceMessages === 'object' ? 
    (sourceMessages[severity] || sourceMessages.default) : 
    sourceMessages);
}

/**
 * Create the error service
 */
function createErrorService() {
  // Create the main error store
  const errorStore = createStore<ErrorState>({
    name: 'errors',
    initialValue: {
      errors: [],
      lastError: null,
      hasActiveErrors: false
    }
  });

  // Create derived stores for specific error queries
  const activeErrors = createDerivedStore({
    name: 'errors.active',
    stores: [errorStore],
    deriveFn: ([$errors]) => $errors.errors.filter(e => !e.handled)
  });

  const criticalErrors = createDerivedStore({
    name: 'errors.critical',
    stores: [errorStore],
    deriveFn: ([$errors]) => $errors.errors.filter(e => e.severity === ErrorSeverity.CRITICAL)
  });

  const networkErrors = createDerivedStore({
    name: 'errors.network',
    stores: [errorStore],
    deriveFn: ([$errors]) => $errors.errors.filter(e => e.source === ErrorSource.NETWORK)
  });

  /**
   * Log an error to the error store
   */
  function logError(errorData: Omit<AppError, 'id' | 'timestamp' | 'handled'> & { id?: string; timestamp?: number; handled?: boolean }): AppError {
    const error: AppError = {
      id: errorData.id || generateErrorId(),
      message: errorData.message,
      details: errorData.details,
      severity: errorData.severity,
      source: errorData.source,
      timestamp: errorData.timestamp || Date.now(),
      originalError: errorData.originalError,
      handled: errorData.handled || false,
      retryable: errorData.retryable,
      userFriendlyMessage: errorData.userFriendlyMessage || createUserFriendlyMessage(errorData),
      recoveryAction: errorData.recoveryAction
    };

    // Add to error store
    errorStore.update(state => {
      const errors = [error, ...state.errors].slice(0, 100); // Keep last 100 errors
      return {
        errors,
        lastError: error,
        hasActiveErrors: errors.some(e => !e.handled)
      };
    });

    // Log to console based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        console.error(`[${error.source}] ${error.message}`, error.originalError || '');
        break;
      case ErrorSeverity.WARNING:
        console.warn(`[${error.source}] ${error.message}`, error.originalError || '');
        break;
      case ErrorSeverity.INFO:
        console.info(`[${error.source}] ${error.message}`, error.originalError || '');
        break;
    }

    return error;
  }

  /**
   * Mark an error as handled
   */
  function markErrorHandled(errorId: string): void {
    errorStore.update(state => {
      const errors = state.errors.map(e => 
        e.id === errorId ? { ...e, handled: true } : e
      );

      return {
        ...state,
        errors,
        hasActiveErrors: errors.some(e => !e.handled)
      };
    });
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errorStore.update(state => ({
      ...state,
      errors: [],
      lastError: null,
      hasActiveErrors: false
    }));
  }

  /**
   * Handle a network error with automatic retry
   */
  async function handleNetworkError<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      onRetry?: (attempt: number, error: unknown) => void;
      errorMessage?: string;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      errorMessage = 'Network request failed'
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Log a warning for retry attempts
          logError({
            message: `${errorMessage} (Attempt ${attempt + 1}/${maxRetries + 1})`,
            severity: ErrorSeverity.WARNING,
            source: ErrorSource.NETWORK,
            originalError: error,
            retryable: true,
            handled: true // Auto-handled by retry mechanism
          });

          if (onRetry) {
            onRetry(attempt + 1, error);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    // If we get here, all retries failed
    const finalError = logError({
      message: `${errorMessage} (Failed after ${maxRetries + 1} attempts)`,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.NETWORK,
      originalError: lastError,
      retryable: true
    });

    throw new Error(`${finalError.message} (ID: ${finalError.id})`);
  }

  /**
   * Create a recovery action for an error
   */
  function createRecoveryAction<T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void
  ): () => Promise<void> {
    return async () => {
      try {
        const result = await operation();
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        // Log the recovery failure
        logError({
          message: 'Recovery action failed',
          severity: ErrorSeverity.ERROR,
          source: ErrorSource.UNKNOWN,
          originalError: error,
          retryable: false
        });
      }
    };
  }

  return {
    subscribe: errorStore.subscribe,
    activeErrors,
    criticalErrors,
    networkErrors,
    logError,
    markErrorHandled,
    clearErrors,
    handleNetworkError,
    createRecoveryAction
  };
}

// Create and export the error service singleton
export const errorService = createErrorService();
