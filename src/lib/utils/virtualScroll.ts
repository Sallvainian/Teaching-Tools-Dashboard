// src/lib/utils/virtualScroll.ts
import { writable, derived, type Readable } from 'svelte/store';
import { createStore, createDerivedStore } from '$lib/stores/storeFactory';

/**
 * Options for virtual scrolling
 */
export interface VirtualScrollOptions<T> {
  /** Initial items array */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render above and below the visible area */
  overscan?: number;
  /** Container height in pixels (if not provided, will use viewport height) */
  containerHeight?: number;
  /** Unique identifier function for items */
  getKey?: (item: T) => string | number;
}

/**
 * Virtual scroll state
 */
export interface VirtualScrollState<T> {
  /** All items */
  items: T[];
  /** Currently visible items */
  visibleItems: T[];
  /** Start index of visible items */
  startIndex: number;
  /** End index of visible items */
  endIndex: number;
  /** Total height of all items */
  totalHeight: number;
  /** Offset from the top */
  offsetY: number;
  /** Container height */
  containerHeight: number;
  /** Item height */
  itemHeight: number;
}

/**
 * Creates a virtual scroll store
 * @param options Virtual scroll options
 * @returns Virtual scroll store and methods
 */
export function createVirtualScroll<T>(options: VirtualScrollOptions<T>) {
  const {
    items: initialItems,
    itemHeight,
    overscan = 5,
    containerHeight = typeof window !== 'undefined' ? window.innerHeight : 800,
    getKey = (_: T, index: number) => index
  } = options;

  // Create the main store
  const store = createStore<VirtualScrollState<T>>({
    name: 'virtualScroll',
    initialValue: {
      items: initialItems,
      visibleItems: [],
      startIndex: 0,
      endIndex: 0,
      totalHeight: initialItems.length * itemHeight,
      offsetY: 0,
      containerHeight,
      itemHeight
    }
  });

  // Calculate visible items based on scroll position
  function calculateVisibleItems(scrollTop: number) {
    const state = store.current();
    const { items, itemHeight, containerHeight } = state;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    // Get visible items
    const visibleItems = items.slice(startIndex, endIndex + 1);

    // Calculate offset
    const offsetY = startIndex * itemHeight;

    // Update store
    store.update(state => ({
      ...state,
      visibleItems,
      startIndex,
      endIndex,
      offsetY
    }));
  }

  // Handle scroll events
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    calculateVisibleItems(target.scrollTop);
  }

  // Update items
  function setItems(newItems: T[]) {
    store.update(state => ({
      ...state,
      items: newItems,
      totalHeight: newItems.length * state.itemHeight
    }));

    // Recalculate visible items
    calculateVisibleItems(store.current().offsetY / store.current().itemHeight);
  }

  // Update container height
  function setContainerHeight(height: number) {
    store.update(state => ({
      ...state,
      containerHeight: height
    }));

    // Recalculate visible items
    calculateVisibleItems(store.current().offsetY / store.current().itemHeight);
  }

  // Initialize visible items
  calculateVisibleItems(0);

  // Create derived stores for specific properties
  const visibleItems = createDerivedStore({
    name: 'virtualScroll.visibleItems',
    stores: [store],
    deriveFn: ([$store]) => $store.visibleItems
  });

  const scrollProps = createDerivedStore({
    name: 'virtualScroll.scrollProps',
    stores: [store],
    deriveFn: ([$store]) => ({
      height: $store.totalHeight,
      offsetY: $store.offsetY,
      containerHeight: $store.containerHeight
    })
  });

  return {
    subscribe: store.subscribe,
    visibleItems,
    scrollProps,
    handleScroll,
    setItems,
    setContainerHeight,
    calculateVisibleItems
  };
}

/**
 * Svelte action for virtual scrolling
 * @param node The DOM node to attach the action to
 * @param virtualScroll The virtual scroll store
 * @returns Svelte action object
 */
export function virtualScroll(
  node: HTMLElement,
  virtualScroll: ReturnType<typeof createVirtualScroll<any>>
) {
  // Add scroll event listener
  node.addEventListener('scroll', virtualScroll.handleScroll);

  // Set initial container height
  virtualScroll.setContainerHeight(node.clientHeight);

  // Handle resize
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      virtualScroll.setContainerHeight(entry.contentRect.height);
    }
  });

  resizeObserver.observe(node);

  return {
    destroy() {
      node.removeEventListener('scroll', virtualScroll.handleScroll);
      resizeObserver.disconnect();
    },
    update(newVirtualScroll: ReturnType<typeof createVirtualScroll<any>>) {
      node.removeEventListener('scroll', virtualScroll.handleScroll);
      node.addEventListener('scroll', newVirtualScroll.handleScroll);
      virtualScroll = newVirtualScroll;
    }
  };
}

/**
 * Helper function to create style for a virtual scroll item
 * @param index Item index
 * @param itemHeight Height of each item
 * @param offsetY Offset from the top
 * @returns CSS style string
 */
export function getVirtualItemStyle(index: number, itemHeight: number, offsetY: number): string {
  const top = index * itemHeight - offsetY;
  return `position: absolute; top: ${top}px; height: ${itemHeight}px; left: 0; right: 0;`;
}

/**
 * Helper component props for virtual scrolling
 */
export interface VirtualScrollProps {
  /** Height of the container */
  height: string;
  /** Width of the container */
  width?: string;
  /** Additional CSS class */
  class?: string;
}
