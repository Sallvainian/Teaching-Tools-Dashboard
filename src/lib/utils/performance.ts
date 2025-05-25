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
  tags?: Record<string, string>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
      tags,
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
 */
export function trackComponentRender(componentName: string) {
  return Sentry.startSpan({
    name: `${componentName} render`,
    op: 'ui.svelte.render',
  });
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
export function trackRouteChange(from: string, to: string) {
  Sentry.startSpan({
    name: `Route change: ${from} → ${to}`,
    op: 'navigation',
    tags: {
      'route.from': from,
      'route.to': to,
    },
  });
}