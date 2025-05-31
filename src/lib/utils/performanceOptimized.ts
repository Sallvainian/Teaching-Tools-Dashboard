import { tick } from 'svelte';

// Performance measurement utilities
export class PerformanceMonitor {
	private marks = new Map<string, number>();

	mark(name: string): void {
		this.marks.set(name, performance.now());
		performance.mark(name);
	}

	measure(name: string, startMark: string, endMark?: string): number {
		const endTime = endMark ? this.marks.get(endMark) || performance.now() : performance.now();
		const startTime = this.marks.get(startMark);

		if (!startTime) {
			console.warn(`Start mark '${startMark}' not found`);
			return 0;
		}

		const duration = endTime - startTime;
		performance.measure(name, startMark, endMark);

		if (process.env.NODE_ENV === 'development') {
			console.log(`${name}: ${duration.toFixed(2)}ms`);
		}

		return duration;
	}

	clear(): void {
		this.marks.clear();
		performance.clearMarks();
		performance.clearMeasures();
	}
}

export const perfMonitor = new PerformanceMonitor();

// Debounce function with better typing
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate = false
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};

		const callNow = immediate && !timeout;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) func(...args);
	};
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(this: any, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// Memoization for expensive computations
export function memoize<T extends (...args: any[]) => any>(
	fn: T,
	getKey?: (...args: Parameters<T>) => string
): T {
	const cache = new Map<string, ReturnType<T>>();

	return ((...args: Parameters<T>): ReturnType<T> => {
		const key = getKey ? getKey(...args) : JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key)!;
		}

		const result = fn(...args);
		cache.set(key, result);

		return result;
	}) as T;
}

// Batch DOM updates
export async function batchUpdate(callback: () => void): Promise<void> {
	await tick();
	callback();
	await tick();
}

// Virtual scrolling utilities
export interface VirtualScrollConfig {
	itemHeight: number;
	containerHeight: number;
	overscan?: number;
}

export function calculateVirtualItems<T>(
	items: T[],
	scrollTop: number,
	config: VirtualScrollConfig
): {
	startIndex: number;
	endIndex: number;
	visibleItems: T[];
	totalHeight: number;
	offsetY: number;
} {
	const { itemHeight, containerHeight, overscan = 5 } = config;

	const visibleCount = Math.ceil(containerHeight / itemHeight);
	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
	const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

	return {
		startIndex,
		endIndex,
		visibleItems: items.slice(startIndex, endIndex + 1),
		totalHeight: items.length * itemHeight,
		offsetY: startIndex * itemHeight
	};
}

// Image lazy loading with IntersectionObserver
export function createImageLazyLoader(options: IntersectionObserverInit = {}) {
	const defaultOptions: IntersectionObserverInit = {
		rootMargin: '50px',
		threshold: 0.1,
		...options
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const img = entry.target as HTMLImageElement;
				const src = img.dataset.src;

				if (src) {
					img.src = src;
					img.removeAttribute('data-src');
					observer.unobserve(img);
				}
			}
		});
	}, defaultOptions);

	return {
		observe: (img: HTMLImageElement) => observer.observe(img),
		disconnect: () => observer.disconnect()
	};
}

// Component performance decorator
export function measureComponentPerformance(componentName: string) {
	return function <T extends { $$: any }>(target: T): T {
		const originalMount = target.$$.on_mount || [];
		const originalDestroy = target.$$.on_destroy || [];

		target.$$.on_mount = [
			...originalMount,
			() => {
				perfMonitor.mark(`${componentName}-mount-start`);
				requestAnimationFrame(() => {
					perfMonitor.mark(`${componentName}-mount-end`);
					perfMonitor.measure(
						`${componentName}-mount`,
						`${componentName}-mount-start`,
						`${componentName}-mount-end`
					);
				});
			}
		];

		target.$$.on_destroy = [
			...originalDestroy,
			() => {
				perfMonitor.mark(`${componentName}-destroy`);
			}
		];

		return target;
	};
}

// Bundle size analyzer helper
export function reportBundleSize() {
	if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
		const scripts = Array.from(document.querySelectorAll('script[src]'));
		let totalSize = 0;

		scripts.forEach(async (script) => {
			try {
				const response = await fetch((script as HTMLScriptElement).src);
				const size = parseInt(response.headers.get('content-length') || '0');
				totalSize += size;
				console.log(
					`Script: ${(script as HTMLScriptElement).src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`
				);
			} catch (error) {
				console.warn('Could not fetch script size:', error);
			}
		});

		console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
	}
}
