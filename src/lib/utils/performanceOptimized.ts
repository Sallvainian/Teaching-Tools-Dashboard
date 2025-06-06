// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
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
export function throttle<T extends (...args: unknown[]) => unknown>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(this: unknown, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// Memoization for expensive computations
export function memoize<T extends (...args: unknown[]) => unknown>(
	fn: T,
	getKey?: (...args: Parameters<T>) => string
): T {
	const cache = new Map<string, ReturnType<T>>();

	return ((...args: Parameters<T>): ReturnType<T> => {
		const key = getKey ? getKey(...args) : JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key) as ReturnType<T>;
		}

		const result = fn(...args) as ReturnType<T>;
		cache.set(key, result);

		return result;
	}) as T;
}