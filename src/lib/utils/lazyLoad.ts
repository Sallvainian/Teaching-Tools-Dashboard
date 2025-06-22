/**
 * @ai-context LAZY_LOAD - Utility for lazy loading heavy features
 * @ai-dependencies None
 * @ai-sideEffects None
 * @ai-exports lazyLoadPDF, lazyLoadHandsontable, lazyLoadStorage, lazyLoadRealtime
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy load PDF.js library
 * @ai-flow INPUT: none -> DYNAMIC_IMPORT -> OUTPUT: pdfjs module
 */
export async function lazyLoadPDF() {
  const pdfjs = await import('pdfjs-dist');
  
  // Configure worker
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  }
  
  return pdfjs;
}

/**
 * Lazy load Handsontable for gradebook
 * @ai-flow INPUT: none -> DYNAMIC_IMPORT -> OUTPUT: Handsontable constructor
 */
export async function lazyLoadHandsontable() {
  const { default: Handsontable } = await import('handsontable');
  return Handsontable;
}

/**
 * Lazy load Supabase storage features
 * @ai-flow INPUT: supabase client -> DYNAMIC_IMPORT -> OUTPUT: storage client
 */
export async function lazyLoadStorage(supabase: SupabaseClient) {
  // Storage is already part of the client, but we can defer its initialization
  return supabase.storage;
}

/**
 * Lazy load Supabase realtime features
 * @ai-flow INPUT: supabase client -> SETUP_CHANNELS -> OUTPUT: channel functions
 */
export async function lazyLoadRealtime(supabase: SupabaseClient) {
  // Return realtime channel creation functions
  return {
    channel: (name: string) => supabase.channel(name),
    removeChannel: (channel: any) => supabase.removeChannel(channel),
    getChannels: () => supabase.getChannels()
  };
}

/**
 * Lazy load GIPHY SDK
 * @ai-flow INPUT: none -> DYNAMIC_IMPORT -> OUTPUT: GiphyFetch instance
 */
export async function lazyLoadGiphy() {
  const { GiphyFetch } = await import('@giphy/js-fetch-api');
  return GiphyFetch;
}

// Cache loaded modules to avoid re-importing
const moduleCache = new Map<string, any>();

/**
 * Generic lazy loader with caching
 * @ai-flow INPUT: module name, loader function -> CHECK_CACHE -> LOAD_IF_NEEDED -> OUTPUT: module
 */
export async function cachedLazyLoad<T>(
  moduleName: string,
  loader: () => Promise<T>
): Promise<T> {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName);
  }
  
  const module = await loader();
  moduleCache.set(moduleName, module);
  return module;
}