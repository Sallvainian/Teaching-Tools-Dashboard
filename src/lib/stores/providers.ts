// src/lib/stores/providers.ts
import { gradebookStore as gradebookLocalStore } from './gradebook';
import { jeopardyStore as jeopardyLocalStore } from './jeopardy';

// Export the stores directly
export const gradebookStore = gradebookLocalStore;
export const jeopardyStore = jeopardyLocalStore;

// Initialize stores - just a stub to maintain API compatibility
export async function initializeStores(): Promise<void> {
  // Only initialize on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  // Nothing to initialize with localStorage stores
}