import * as Sentry from '@sentry/sveltekit';

/**
 * Custom performance utilities for manual instrumentation
 */

/**
 * Track async operations like API calls
 */
export async function trackAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
      attributes,
    },
    async () => {
      try {
        const result = await operation();
        Sentry.setTag('operation.success', 'true');
        return result;
      } catch (error) {
        Sentry.setTag('operation.success', 'false');
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}

/**
 * Track component rendering performance
 * Call this at the start of component initialization, then call the returned function when done
 */
export function trackComponentRender<T>(componentName: string, renderFn: () => T): T {
  return Sentry.startSpan(
    {
      name: `${componentName} render`,
      op: 'ui.svelte.render',
    },
    renderFn
  );
}

/**
 * Track user interactions
 */
export function trackUserInteraction(action: string, target?: string) {
  Sentry.addBreadcrumb({
    message: `User ${action}`,
    category: 'user',
    data: {
      target,
      timestamp: Date.now(),
    },
    level: 'info',
  });
}

/**
 * Track database operations
 */
export async function trackDatabaseOperation<T>(
  table: string,
  operation: string,
  dbOperation: () => Promise<T>
): Promise<T> {
  return trackAsyncOperation(
    `db.${operation}`,
    dbOperation,
    {
      'db.table': table,
      'db.operation': operation,
    }
  );
}

/**
 * Track route changes manually (in addition to automatic tracking)
 */
export function trackRouteChange<T>(from: string, to: string, navigationFn: () => T): T {
  return Sentry.startSpan(
    {
      name: `Route change: ${from} → ${to}`,
      op: 'navigation',
      attributes: {
        'route.from': from,
        'route.to': to,
      },
    },
    navigationFn
  );
}