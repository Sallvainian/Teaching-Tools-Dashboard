// src/lib/utils/ssr.ts
import { browser } from '$app/environment';
import { onMount } from 'svelte';

/**
 * Options for SSR optimization
 */
export interface SSROptions {
  /** Whether to use partial hydration */
  partialHydration?: boolean;
  /** Whether to use streaming SSR */
  streaming?: boolean;
  /** Whether to defer hydration until idle */
  deferHydration?: boolean;
  /** Whether to use progressive hydration */
  progressiveHydration?: boolean;
}

/**
 * Default SSR options
 */
const DEFAULT_SSR_OPTIONS: SSROptions = {
  partialHydration: true,
  streaming: false,
  deferHydration: true,
  progressiveHydration: false
};

/**
 * Check if the code is running on the server
 * @returns True if running on the server
 */
export function isServer(): boolean {
  return !browser;
}

/**
 * Check if the code is running in the browser
 * @returns True if running in the browser
 */
export function isBrowser(): boolean {
  return browser;
}

/**
 * Defer hydration until the browser is idle
 * @param callback Function to call when hydration is complete
 */
export function deferHydration(callback?: () => void): void {
  if (!browser) {
    return;
  }

  onMount(() => {
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
        if (callback) callback();
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        if (callback) callback();
      }, 200);
    }
  });
}

/**
 * Create a component that only hydrates when it becomes visible
 * @param options SSR options
 * @returns Object with onVisible function
 */
export function createVisibilityHydration(options: SSROptions = {}): {
  onVisible: (element: HTMLElement, callback: () => void) => void;
} {
  const opts = { ...DEFAULT_SSR_OPTIONS, ...options };

  if (!browser || !opts.progressiveHydration) {
    // If not in browser or progressive hydration is disabled,
    // return a no-op function
    return {
      onVisible: (_, callback) => callback()
    };
  }

  return {
    onVisible: (element: HTMLElement, callback: () => void) => {
      // Use Intersection Observer to detect when the element becomes visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Element is visible, hydrate it
              callback();
              // Stop observing
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px' } // Start hydrating when element is 200px from viewport
      );

      observer.observe(element);
    }
  };
}

/**
 * Mark a component as static (no client-side JavaScript)
 * This is useful for components that don't need interactivity
 * @returns Object with isStatic flag
 */
export function markStatic(): { isStatic: boolean } {
  return {
    isStatic: true
  };
}

/**
 * Mark a component as interactive (needs client-side JavaScript)
 * This is useful for components that need interactivity
 * @returns Object with isInteractive flag
 */
export function markInteractive(): { isInteractive: boolean } {
  return {
    isInteractive: true
  };
}

/**
 * Create a streaming SSR context
 * @returns Object with streaming functions
 */
export function createStreamingSSR() {
  if (!isServer()) {
    // No-op in browser
    return {
      flush: () => {},
      chunk: (_id: string, _content: string) => {}
    };
  }

  return {
    /**
     * Flush the current chunk to the client
     */
    flush: () => {
			// This would be implemented by the framework
		},

    /**
     * Add content to a specific chunk
     * @param id Chunk ID
     * @param content Chunk content
     */
    chunk: (_id: string, _content: string) => {
			// This would be implemented by the framework
		}
  };
}

/**
 * Create a partial hydration context
 * @param options SSR options
 * @returns Object with hydration functions
 */
export function createPartialHydration(options: SSROptions = {}) {
  const opts = { ...DEFAULT_SSR_OPTIONS, ...options };

  if (!browser) {
    // Server-side rendering
    return {
      markStatic,
      markInteractive,
      isHydrating: false
    };
  }

  // Client-side rendering
  let isHydrating = true;

  // Defer hydration if enabled
  if (opts.deferHydration) {
    deferHydration(() => {
      isHydrating = false;
    });
  } else {
    onMount(() => {
      isHydrating = false;
    });
  }

  return {
    markStatic,
    markInteractive,
    isHydrating
  };
}

/**
 * Create a component that only renders on the server or client
 * @param serverOnly Whether to render only on the server
 * @param clientOnly Whether to render only on the client
 * @returns Object with shouldRender flag
 */
export function createConditionalRendering(serverOnly = false, clientOnly = false): {
  shouldRender: boolean;
} {
  if (serverOnly && clientOnly) {
    throw new Error('Component cannot be both serverOnly and clientOnly');
  }

  if (serverOnly) {
    return {
      shouldRender: isServer()
    };
  }

  if (clientOnly) {
    return {
      shouldRender: isBrowser()
    };
  }

  return {
    shouldRender: true
  };
}